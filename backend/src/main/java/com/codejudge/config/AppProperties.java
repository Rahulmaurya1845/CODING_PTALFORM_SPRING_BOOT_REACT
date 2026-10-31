package com.codejudge.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Admin admin, Cors cors, Judge judge) {
    public record Jwt(String secret, long expirationMs) {}
    public record Admin(String username, String email, String password) {}
    public record Cors(List<String> allowedOrigins) {}
    public record Judge(int workers, int startupAllowanceMs, boolean prepull, List<String> languages) {}
}
