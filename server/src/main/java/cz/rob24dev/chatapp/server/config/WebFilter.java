package cz.rob24dev.chatapp.server.config;

import cz.rob24dev.chatapp.server.services.AuthorizationService;
import cz.rob24dev.chatapp.server.services.RateLimitingService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public class WebFilter extends OncePerRequestFilter {

    private final AuthorizationService authorizationService;
    private final RateLimitingService rateLimitingService;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();


    private static final List<String> PUBLIC_PATHS = List.of(
            "/v1/auth/register",
            "/v1/auth/login",
            "/v1/auth/forgot-password",
            "/v1/auth/reset-password",
            "/v1/users/me/confirm-email",
            "/v1/beta/signup"
    );

    public WebFilter(AuthorizationService authorizationService, RateLimitingService rateLimitingService) {
        this.authorizationService = authorizationService;
        this.rateLimitingService = rateLimitingService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String clientIp = request.getRemoteAddr();
        Bucket bucket = rateLimitingService.resolveBucket(clientIp);

        if(!bucket.tryConsume(PUBLIC_PATHS.stream().anyMatch(publicPath -> antPathMatcher.match(publicPath, request.getServletPath())) ? 30 : 1)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("""
                    {
                        "message": "Zpomal!"
                    }""");
            return;
        }

        if(request.getMethod().equalsIgnoreCase("OPTIONS") || PUBLIC_PATHS.stream().anyMatch(publicPath -> antPathMatcher.match(publicPath, request.getServletPath()))) {
            filterChain.doFilter(request, response);
            return;
        }

        String fullToken = request.getHeader("Authorization");
        if(fullToken == null || !fullToken.startsWith("Bearer ")) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Chybí autorizační token nebo je neplatný.");
            return;
        }
        fullToken = fullToken.substring(7);
        UUID userID = authorizationService.verifyToken(fullToken);
        if(userID != null) {
            request.setAttribute("authenticatedUserId", userID);

            UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken
                    = UsernamePasswordAuthenticationToken.authenticated(userID, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

            usernamePasswordAuthenticationToken.setDetails(new WebAuthenticationDetails(request));
            SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            filterChain.doFilter(request, response);
        } else {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Chybí autorizační token nebo je neplatný.");
        }
    }
}
