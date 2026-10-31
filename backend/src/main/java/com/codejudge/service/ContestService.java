package com.codejudge.service;

import com.codejudge.domain.*;
import com.codejudge.dto.Dto.*;
import com.codejudge.dto.Mappers;
import com.codejudge.exception.ApiException;
import com.codejudge.repository.*;
import com.codejudge.security.AuthUser;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContestService {
    private static final int WRONG_ATTEMPT_PENALTY_MIN = 20;
    private static final Set<Verdict> COUNTED_WRONG = Set.of(Verdict.WRONG_ANSWER, Verdict.TIME_LIMIT_EXCEEDED,
            Verdict.MEMORY_LIMIT_EXCEEDED, Verdict.RUNTIME_ERROR);

    private final ContestRepository contests;
    private final ProblemRepository problems;
    private final UserRepository users;
    private final SubmissionRepository subs;
    private final ProblemService problemService;

    public ContestService(ContestRepository contests, ProblemRepository problems, UserRepository users,
                          SubmissionRepository subs, ProblemService problemService) {
        this.contests = contests; this.problems = problems; this.users = users; this.subs = subs; this.problemService = problemService;
    }

    @Transactional(readOnly = true)
    public List<ContestSummary> list(Long uid) {
        return contests.findAllByOrderByStartTimeDesc().stream().map(c -> new ContestSummary(c.getId(), c.getTitle(),
                c.getDescription(), c.getStartTime(), c.getEndTime(), Mappers.contestStatus(c), c.getProblems().size(),
                c.getParticipants().size(), uid != null && contests.isParticipant(c.getId(), uid))).toList();
    }

    @Transactional(readOnly = true)
    public ContestDetail detail(Long id, AuthUser au) {
        Contest c = find(id);
        Long uid = au == null ? null : au.id();
        boolean visible = !Instant.now().isBefore(c.getStartTime()) || (au != null && au.isAdmin());
        List<ProblemSummary> ps = visible ? problemService.summaries(c.getProblems(), uid) : List.of();
        return new ContestDetail(c.getId(), c.getTitle(), c.getDescription(), c.getStartTime(), c.getEndTime(),
                Mappers.contestStatus(c), c.getParticipants().size(), uid != null && contests.isParticipant(id, uid), ps);
    }

    @Transactional
    public void register(Long id, AuthUser au) {
        Contest c = find(id);
        if ("ENDED".equals(Mappers.contestStatus(c))) throw ApiException.bad("This contest has already ended");
        c.getParticipants().add(users.getReferenceById(au.id()));
    }

    /** ICPC-style ranking: more solved first, then lower penalty (minutes + 20 per wrong attempt). */
    @Transactional(readOnly = true)
    public List<LeaderboardRow> leaderboard(Long id) {
        Contest c = find(id);
        if (Instant.now().isBefore(c.getStartTime())) return List.of();
        Map<String, Map<Long, int[]>> table = new LinkedHashMap<>(); // user -> problem -> {solved, attempts, minutes}
        for (User u : c.getParticipants()) table.put(u.getUsername(), new HashMap<>());
        for (Submission s : subs.forContest(id)) {
            if (s.getCreatedAt().isAfter(c.getEndTime())) continue;
            Verdict v = s.getVerdict();
            if (v != Verdict.ACCEPTED && !COUNTED_WRONG.contains(v)) continue;
            int[] cell = table.computeIfAbsent(s.getUser().getUsername(), k -> new HashMap<>())
                    .computeIfAbsent(s.getProblem().getId(), k -> new int[3]);
            if (cell[0] == 1) continue;
            if (v == Verdict.ACCEPTED) {
                cell[0] = 1;
                cell[2] = (int) Duration.between(c.getStartTime(), s.getCreatedAt()).toMinutes();
            } else cell[1]++;
        }
        List<LeaderboardRow> rows = new ArrayList<>();
        table.forEach((name, probs) -> {
            int solved = 0; long penalty = 0;
            Map<Long, ProblemResult> res = new LinkedHashMap<>();
            for (Map.Entry<Long, int[]> e : probs.entrySet()) {
                int[] x = e.getValue();
                res.put(e.getKey(), new ProblemResult(x[0] == 1, x[1], x[2]));
                if (x[0] == 1) { solved++; penalty += x[2] + (long) WRONG_ATTEMPT_PENALTY_MIN * x[1]; }
            }
            rows.add(new LeaderboardRow(0, name, solved, penalty, res));
        });
        rows.sort(Comparator.comparingInt(LeaderboardRow::solved).reversed().thenComparingLong(LeaderboardRow::penalty));
        List<LeaderboardRow> ranked = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            LeaderboardRow r = rows.get(i);
            ranked.add(new LeaderboardRow(i + 1, r.username(), r.solved(), r.penalty(), r.results()));
        }
        return ranked;
    }

    // ---------- admin ----------
    @Transactional
    public ContestSummary create(ContestRequest r) {
        Contest c = new Contest();
        apply(c, r);
        c = contests.save(c);
        return summary(c);
    }

    @Transactional
    public ContestSummary update(Long id, ContestRequest r) {
        Contest c = find(id);
        apply(c, r);
        return summary(contests.save(c));
    }

    @Transactional
    public void delete(Long id) { contests.delete(find(id)); }

    @Transactional(readOnly = true)
    public List<Long> problemIds(Long id) { return find(id).getProblems().stream().map(Problem::getId).toList(); }

    private ContestSummary summary(Contest c) {
        return new ContestSummary(c.getId(), c.getTitle(), c.getDescription(), c.getStartTime(), c.getEndTime(),
                Mappers.contestStatus(c), c.getProblems().size(), c.getParticipants().size(), false);
    }

    private void apply(Contest c, ContestRequest r) {
        if (!r.endTime().isAfter(r.startTime())) throw ApiException.bad("End time must be after start time");
        c.setTitle(r.title().trim());
        c.setDescription(r.description());
        c.setStartTime(r.startTime());
        c.setEndTime(r.endTime());
        Map<Long, Problem> byId = new HashMap<>();
        problems.findAllById(r.problemIds() == null ? List.of() : r.problemIds()).forEach(p -> byId.put(p.getId(), p));
        c.getProblems().clear();
        if (r.problemIds() != null) for (Long pid : r.problemIds()) if (byId.containsKey(pid)) c.getProblems().add(byId.get(pid));
    }

    private Contest find(Long id) { return contests.findById(id).orElseThrow(() -> ApiException.notFound("Contest")); }
}
