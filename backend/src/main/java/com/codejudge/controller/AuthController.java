package com.codejudge.controller;

import com.codejudge.dto.Dto.*;
import com.codejudge.security.AuthUser;
import com.codejudge.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register") public AuthResponse register(@Valid @RequestBody RegisterRequest r) { return auth.register(r); }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }
    @GetMapping("/me") public UserDto me(@AuthenticationPrincipal AuthUser u) { return auth.me(u.id()); }
}
