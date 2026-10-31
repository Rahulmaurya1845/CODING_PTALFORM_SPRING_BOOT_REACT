package com.codejudge.controller;

import com.codejudge.domain.Difficulty;
import com.codejudge.dto.Dto.*;
import com.codejudge.security.AuthUser;
import com.codejudge.service.ProblemService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {
    private final ProblemService problems;
    public ProblemController(ProblemService problems) { this.problems = problems; }

    @GetMapping
    public PageDto<ProblemSummary> list(@RequestParam(required = false) String q,
                                        @RequestParam(required = false) Difficulty difficulty,
                                        @RequestParam(required = false) String tag,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size,
                                        @AuthenticationPrincipal AuthUser user) {
        return problems.list(q, difficulty, tag, page, size, user == null ? null : user.id());
    }

    @GetMapping("/tags") public List<String> tags() { return problems.tags(); }

    @GetMapping("/daily") public ProblemSummary daily(@AuthenticationPrincipal AuthUser user) {
        return problems.daily(user == null ? null : user.id());
    }

    @GetMapping("/{slug}")
    public ProblemDetail detail(@PathVariable("slug") String slug, @AuthenticationPrincipal AuthUser user) {
        return problems.detail(slug, user == null ? null : user.id(), user != null && user.isAdmin());
    }
}
