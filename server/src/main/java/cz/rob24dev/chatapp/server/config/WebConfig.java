package cz.rob24dev.chatapp.server.config;

import cz.rob24dev.chatapp.server.services.AuthorizationService;
import cz.rob24dev.chatapp.server.services.RateLimitingService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class WebConfig  {

    private final AuthorizationService authorizationService;

    public WebConfig(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity, RateLimitingService rateLimitingService) {
        httpSecurity
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/v1/auth/register",
                                "/v1/auth/login",
                                "/v1/auth/forgot-password",
                                "/v1/auth/reset-password",
                                "/v1/users/me/confirm-email",
                                "/v1/beta/signup"
                        ).permitAll()
                        .requestMatchers("/v1/**").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((_, response, _) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            response.getWriter().write(
                                    "{\"error\":\"UNAUTHORIZED\",\"message\":\"Přihlaš se!\"}"
                            );
                            response.getWriter().flush();
                        })
                        .accessDeniedHandler((_, response, _) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                            response.getWriter().write(
                                    "{\"error\":\"FORBIDDEN\",\"message\":\"K tomuto nemáš oprávnění.\"}"
                            );
                            response.getWriter().flush();
                        })
                )
                .addFilterBefore(
                        new WebFilter(authorizationService, rateLimitingService), UsernamePasswordAuthenticationFilter.class);
        return httpSecurity.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "https://app.qero.chat", "http://panel.qero.chat"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setMaxAge(3600L);
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
