package cz.rob24dev.chatapp.server.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Slf4j
public class AuthorizationService {

    @Value("${jwt.secret.key}")
    private String secretKey;

    public String generateToken(UUID playerId) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            return JWT.create()
                    .withIssuer("chatapp")
                    .withClaim("ID", playerId.toString())
                    .withExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS))
                    .sign(algorithm);
        } catch (JWTCreationException ex) {
            log.error("An error occurred while creating the token: {}", ex.getMessage());
            return null;
        }
    }

    public UUID verifyToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer("chatapp")
                    .build();
            DecodedJWT jwt = verifier.verify(token);
            return UUID.fromString(jwt.getClaim("ID").asString());
        } catch (JWTVerificationException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
            return null;
        }
    }
}
