package com.codejudge.controller;

import com.codejudge.dto.Dto.*;
import com.codejudge.security.AuthUser;
import com.codejudge.service.ContestService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contests")
public class ContestController {
    private final ContestService contests;
    public ContestController(ContestService contests) { this.contests = contests; }

    @GetMapping public List<ContestSummary> list(@AuthenticationPrincipal AuthUser u) { return contests.list(u == null ? null : u.id()); }
    @GetMapping("/{id}") public ContestDetail detail(@PathVariable("id") Long id, @AuthenticationPrincipal AuthUser u) { return contests.detail(id, u); }
    @GetMapping("/{id}/leaderboard") public List<LeaderboardRow> leaderboard(@PathVariable("id") Long id) { return contests.leaderboard(id); }

    @PostMapping("/{id}/register")
    public void register(@PathVariable("id") Long id, @AuthenticationPrincipal AuthUser u) { contests.register(id, u); }
}
