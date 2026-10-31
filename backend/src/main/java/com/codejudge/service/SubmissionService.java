package com.codejudge.service;

import com.codejudge.domain.*;
import com.codejudge.dto.Dto.*;
import com.codejudge.dto.Mappers;
import com.codejudge.exception.ApiException;
import com.codejudge.judge.JudgeService;
import com.codejudge.repository.*;
import com.codejudge.security.AuthUser;
import com.codejudge.util.RateLimiter;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService {
    private final SubmissionRepository subs;
    private final ProblemRepository problems;
    private final UserRepository users;
    private final ContestRepository contests;
    private final JudgeService judge;
    private final RateLimiter runLimiter = new RateLimiter();

    public SubmissionService(SubmissionRepository subs, ProblemRepository problems, UserRepository users,
                             ContestRepository contests, JudgeService judge) {
        this.subs = subs; this.problems = problems; this.users = users; this.contests = contests; this.judge = judge;
    }

    public SubmissionDto submit(AuthUser au, SubmissionRequest r) {
        if (!judge.isEnabled(r.language())) throw ApiException.bad(r.language() + " is not enabled on this server");
        Problem p = problems.findBySlug(r.problemSlug()).filter(x -> x.isPublished() || au.isAdmin())
                .orElseThrow(() -> ApiException.notFound("Problem"));
        if (subs.countByUserIdAndCreatedAtAfter(au.id(), Instant.now().minus(1, ChronoUnit.MINUTES)) >= 15)
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Slow down: max 15 submissions per minute");
        if (r.contestId() != null) {
            Contest c = contests.findById(r.contestId()).orElseThrow(() -> ApiException.notFound("Contest"));
            if (!"RUNNING".equals(Mappers.contestStatus(c))) throw ApiException.bad("This contest is not running");
            if (!contests.isParticipant(c.getId(), au.id())) throw ApiException.bad("Register for the contest first");
            if (!contests.hasProblem(c.getId(), p.getId())) throw ApiException.bad("This problem is not part of the contest");
        }
        User u = users.findById(au.id()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account no longer exists"));
        Submission s = new Submission();
        s.setUser(u); s.setProblem(p); s.setContestId(r.contestId());
        s.setLanguage(r.language()); s.setCode(r.code());
        s = subs.save(s);
        judge.enqueue(s.getId());
        return Mappers.submission(s, false);
    }

    public SubmissionDto get(Long id, AuthUser au) {
        Submission s = subs.findDetailed(id).orElseThrow(() -> ApiException.notFound("Submission"));
        if (!s.getUser().getId().equals(au.id()) && !au.isAdmin()) throw new ApiException(HttpStatus.FORBIDDEN, "Not your submission");
        return Mappers.submission(s, true);
    }

    public PageDto<SubmissionDto> mine(AuthUser au, String slug, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        Page<Submission> p = (slug == null || slug.isBlank()) ? subs.mine(au.id(), pr) : subs.mineForProblem(au.id(), slug, pr);
        return new PageDto<>(p.getContent().stream().map(s -> Mappers.submission(s, false)).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    public RunResult run(AuthUser au, RunRequest r) {
        if (!judge.isEnabled(r.language())) throw ApiException.bad(r.language() + " is not enabled on this server");
        if (!runLimiter.allow("run:" + au.id(), 20, 60_000)) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Slow down: max 20 runs per minute");
        return judge.runCustom(r.language(), r.code(), r.input() == null ? "" : r.input());
    }
}
