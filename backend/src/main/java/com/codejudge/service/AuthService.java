package com.codejudge.service;

import com.codejudge.domain.User;
import com.codejudge.dto.Dto.*;
import com.codejudge.dto.Mappers;
import com.codejudge.exception.ApiException;
import com.codejudge.repository.UserRepository;
import com.codejudge.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest r) {
        if (users.existsByUsernameIgnoreCase(r.username())) throw new ApiException(HttpStatus.CONFLICT, "Username is already taken");
        if (users.existsByEmailIgnoreCase(r.email())) throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        User u = new User();
        u.setUsername(r.username());
        u.setEmail(r.email().toLowerCase());
        u.setPasswordHash(encoder.encode(r.password()));
        u = users.save(u);
        return new AuthResponse(jwt.generate(u), Mappers.user(u));
    }

    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmailIgnoreCase(r.email())
                .or(() -> users.findByUsernameIgnoreCase(r.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!encoder.matches(r.password(), u.getPasswordHash()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        return new AuthResponse(jwt.generate(u), Mappers.user(u));
    }

    public UserDto me(Long id) {
        return Mappers.user(users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists")));
    }
}
