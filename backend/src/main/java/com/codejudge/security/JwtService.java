package com.codejudge.security;

import com.codejudge.config.AppProperties;
import com.codejudge.domain.Role;
import com.codejudge.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMs;

    public JwtService(AppProperties props) {
        String secret = props.jwt().secret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be set in .env and be at least 32 characters long");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = props.jwt().expirationMs();
    }

    public String generate(User u) {
        Date now = new Date();
        return Jwts.builder().subject(String.valueOf(u.getId()))
                .claim("username", u.getUsername()).claim("role", u.getRole().name())
                .issuedAt(now).expiration(new Date(now.getTime() + expirationMs))
                .signWith(key).compact();
    }

    public AuthUser parse(String token) {
        Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return new AuthUser(Long.parseLong(c.getSubject()), c.get("username", String.class),
                Role.valueOf(c.get("role", String.class)));
    }
}
