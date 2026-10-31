package com.codejudge.controller;

import com.codejudge.dto.Dto.*;
import com.codejudge.service.ContestService;
import com.codejudge.service.ProblemImportService;
import com.codejudge.service.ProblemService;
import com.codejudge.service.StatsService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/** Everything under /api/admin requires the ADMIN role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final ProblemService problems;
    private final ContestService contests;
    private final StatsService stats;
    private final ProblemImportService importer;

    public AdminController(ProblemService problems, ContestService contests, StatsService stats, ProblemImportService importer) {
        this.problems = problems; this.contests = contests; this.stats = stats; this.importer = importer;
    }

    @GetMapping("/stats") public AdminStats stats() { return stats.adminStats(); }

    @PostMapping("/import")
    public ImportStatus startImport(@RequestParam(defaultValue = "50") int count,
                                    @RequestParam(defaultValue = "800") int minRating,
                                    @RequestParam(defaultValue = "1600") int maxRating) {
        return importer.start(Math.min(Math.max(count, 1), 500), minRating, maxRating);
    }
    @GetMapping("/import/status") public ImportStatus importStatus() { return importer.status(); }

    @GetMapping("/problems") public List<AdminProblemRow> problems() { return problems.adminList(); }
    @GetMapping("/problems/{id}") public AdminProblem problem(@PathVariable("id") Long id) { return problems.adminGet(id); }
    @PostMapping("/problems") public AdminProblem create(@Valid @RequestBody ProblemRequest r) { return problems.create(r); }
    @PutMapping("/problems/{id}") public AdminProblem update(@PathVariable("id") Long id, @Valid @RequestBody ProblemRequest r) { return problems.update(id, r); }
    @DeleteMapping("/problems/{id}") public void delete(@PathVariable("id") Long id) { problems.delete(id); }

    @GetMapping("/contests/{id}/problem-ids") public List<Long> contestProblems(@PathVariable("id") Long id) { return contests.problemIds(id); }
    @PostMapping("/contests") public ContestSummary createContest(@Valid @RequestBody ContestRequest r) { return contests.create(r); }
    @PutMapping("/contests/{id}") public ContestSummary updateContest(@PathVariable("id") Long id, @Valid @RequestBody ContestRequest r) { return contests.update(id, r); }
    @DeleteMapping("/contests/{id}") public void deleteContest(@PathVariable("id") Long id) { contests.delete(id); }
}
