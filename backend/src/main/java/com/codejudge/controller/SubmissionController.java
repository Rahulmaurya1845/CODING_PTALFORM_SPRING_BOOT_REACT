package com.codejudge.controller;

import com.codejudge.dto.Dto.*;
import com.codejudge.security.AuthUser;
import com.codejudge.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {
    private final SubmissionService service;
    public SubmissionController(SubmissionService service) { this.service = service; }

    @PostMapping
    public SubmissionDto submit(@AuthenticationPrincipal AuthUser u, @Valid @RequestBody SubmissionRequest r) { return service.submit(u, r); }

    @PostMapping("/run")
    public RunResult run(@AuthenticationPrincipal AuthUser u, @Valid @RequestBody RunRequest r) { return service.run(u, r); }

    @GetMapping("/mine")
    public PageDto<SubmissionDto> mine(@AuthenticationPrincipal AuthUser u, @RequestParam(required = false) String problem,
                                       @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.mine(u, problem, page, size);
    }

    @GetMapping("/{id}")
    public SubmissionDto get(@PathVariable("id") Long id, @AuthenticationPrincipal AuthUser u) { return service.get(id, u); }
}
