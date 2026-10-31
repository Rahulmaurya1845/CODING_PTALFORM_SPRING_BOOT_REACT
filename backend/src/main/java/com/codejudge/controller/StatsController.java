package com.codejudge.controller;

import com.codejudge.dto.Dto.*;
import com.codejudge.service.StatsService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class StatsController {
    private final StatsService stats;
    public StatsController(StatsService stats) { this.stats = stats; }

    @GetMapping("/stats") public PublicStats publicStats() { return stats.publicStats(); }
    @GetMapping("/leaderboard") public List<GlobalRank> ranking(@RequestParam(defaultValue = "50") int size) { return stats.ranking(size); }
    @GetMapping("/users/{username}") public Profile profile(@PathVariable("username") String username) { return stats.profile(username); }
}
