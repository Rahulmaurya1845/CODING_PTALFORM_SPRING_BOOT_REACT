package com.codejudge.dto;

import com.codejudge.domain.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class Dto {
    private Dto() {}

    // ---- auth ----
    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 30) @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "may only contain letters, numbers and _") String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 100) String password) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record UserDto(Long id, String username, String email, String role, Instant createdAt) {}
    public record AuthResponse(String token, UserDto user) {}

    // ---- generic ----
    public record PageDto<T>(List<T> items, int page, int size, long total, int pages) {}

    // ---- problems ----
    public record SampleDto(String input, String output) {}
    public record ProblemSummary(Long id, String slug, String title, String difficulty, List<String> tags,
                                 double acceptance, long submissions, String status) {}
    public record ProblemDetail(Long id, String slug, String title, String difficulty, List<String> tags,
                                String description, int timeLimitMs, int memoryLimitMb, double acceptance,
                                long submissions, String status, List<SampleDto> samples) {}
    public record TestCaseDto(Long id, String input, String expectedOutput, boolean sample) {}
    public record TestCaseRequest(@NotNull String input, @NotNull String expectedOutput, boolean sample) {}
    public record ProblemRequest(
            @NotBlank @Size(max = 150) String title,
            @NotBlank String description,
            @NotNull Difficulty difficulty,
            List<String> tags,
            @Min(500) @Max(15000) int timeLimitMs,
            @Min(64) @Max(1024) int memoryLimitMb,
            boolean published,
            @NotEmpty List<@Valid TestCaseRequest> testCases) {}
    public record AdminProblem(Long id, String slug, String title, String description, String difficulty,
                               List<String> tags, int timeLimitMs, int memoryLimitMb, boolean published,
                               List<TestCaseDto> testCases) {}
    public record AdminProblemRow(Long id, String slug, String title, String difficulty, boolean published, int testCases) {}

    // ---- submissions ----
    public record SubmissionRequest(@NotBlank String problemSlug, @NotNull Language language,
                                    @NotBlank @Size(max = 65536) String code, Long contestId) {}
    public record RunRequest(@NotNull Language language, @NotBlank @Size(max = 65536) String code,
                             @Size(max = 100000) String input) {}
    public record RunResult(String status, String stdout, String stderr, long timeMs) {}
    public record SubmissionDto(Long id, String username, String problemSlug, String problemTitle, String language,
                                String verdict, Long runtimeMs, int passed, int total, String message, String code,
                                Instant createdAt, Long contestId) {}

    // ---- contests ----
    public record ContestRequest(@NotBlank String title, String description, @NotNull Instant startTime,
                                 @NotNull Instant endTime, List<Long> problemIds) {}
    public record ContestSummary(Long id, String title, String description, Instant startTime, Instant endTime,
                                 String status, int problemCount, int participants, boolean registered) {}
    public record ContestDetail(Long id, String title, String description, Instant startTime, Instant endTime,
                                String status, int participants, boolean registered, List<ProblemSummary> problems) {}
    public record ProblemResult(boolean solved, int attempts, long minutes) {}
    public record LeaderboardRow(int rank, String username, int solved, long penalty, Map<Long, ProblemResult> results) {}

    // ---- stats / profile ----
    public record GlobalRank(int rank, String username, int solved) {}
    public record PublicStats(long problems, long users, long submissions, long contests) {}
    public record Profile(String username, Instant joinedAt, Integer rank, long totalSolved, Map<String, Long> solved,
                          Map<String, Long> available, long totalSubmissions, long accepted, double acceptanceRate,
                          int streak, int longestStreak, Map<String, Long> languages, Map<String, Integer> heatmap,
                          List<SubmissionDto> recent) {}
    public record ImportStatus(boolean running, int imported, int scanned, int skipped, String message) {}
    public record AdminStats(long users, long problems, long submissions, long contests,
                             Map<String, Long> verdicts, Map<String, Long> last7Days) {}
}
