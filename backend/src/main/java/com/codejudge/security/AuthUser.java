package com.codejudge.security;

import com.codejudge.domain.Role;

public record AuthUser(Long id, String username, Role role) {
    public boolean isAdmin() { return role == Role.ADMIN; }
}
