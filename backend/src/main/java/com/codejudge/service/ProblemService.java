package com.codejudge.service;

import com.codejudge.domain.*;
import com.codejudge.dto.Dto.*;
import com.codejudge.dto.Mappers;
import com.codejudge.exception.ApiException;
import com.codejudge.repository.*;
import com.codejudge.util.SlugUtil;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProblemService {
    private final ProblemRepository problems;
    private final SubmissionRepository subs;
    private final ContestRepository contests;
    private final TestCaseRepository testCases;

    public ProblemService(ProblemRepository problems, SubmissionRepository subs, ContestRepository contests,
                          TestCaseRepository testCases) {
        this.problems = problems; this.subs = subs; this.contests = contests; this.testCases = testCases;
    }

    // ---------- public ----------
    @Transactional(readOnly = true)
    public PageDto<ProblemSummary> list(String q, Difficulty d, String tag, int page, int size, Long uid) {
        Specification<Problem> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            ps.add(cb.isTrue(root.get("published")));
            if (q != null && !q.isBlank()) ps.add(cb.like(cb.lower(root.get("title")), "%" + q.trim().toLowerCase() + "%"));
            if (d != null) ps.add(cb.equal(root.get("difficulty"), d));
            if (tag != null && !tag.isBlank()) ps.add(cb.isMember(tag.toLowerCase(), root.<Set<String>>get("tags")));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Page<Problem> p = problems.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), Sort.by("id")));
        return new PageDto<>(summaries(p.getContent(), uid), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<String> tags() { return problems.allTags(); }

    @Transactional(readOnly = true)
    public ProblemSummary daily(Long uid) {
        List<Problem> all = problems.findByPublishedTrueOrderByIdAsc();
        if (all.isEmpty()) throw ApiException.notFound("Problem");
        int idx = (int) (LocalDate.now(ZoneOffset.UTC).toEpochDay() % all.size());
        return summaries(List.of(all.get(idx)), uid).get(0);
    }

    @Transactional(readOnly = true)
    public ProblemDetail detail(String slug, Long uid, boolean admin) {
        Problem p = problems.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Problem"));
        if (!p.isPublished() && !admin) throw ApiException.notFound("Problem");
        ProblemSummary s = summaries(List.of(p), uid).get(0);
        List<SampleDto> samples = testCases.findByProblemIdAndSampleTrueOrderByOrderIndexAsc(p.getId()).stream()
                .map(t -> new SampleDto(t.getInput(), t.getExpectedOutput())).toList();
        return new ProblemDetail(p.getId(), p.getSlug(), p.getTitle(), p.getDifficulty().name(), s.tags(), p.getDescription(),
                p.getTimeLimitMs(), p.getMemoryLimitMb(), s.acceptance(), s.submissions(), s.status(), samples);
    }

    public List<ProblemSummary> summaries(Collection<Problem> ps, Long uid) {
        List<Long> ids = ps.stream().map(Problem::getId).toList();
        Map<Long, long[]> st = new HashMap<>();
        if (!ids.isEmpty())
            for (Object[] r : subs.stats(ids)) st.put((Long) r[0], new long[]{((Number) r[1]).longValue(), ((Number) r[2]).longValue()});
        Set<Long> solved = uid == null ? Set.of() : new HashSet<>(subs.solvedIds(uid));
        Set<Long> tried = uid == null ? Set.of() : new HashSet<>(subs.attemptedIds(uid));
        return ps.stream().map(p -> {
            long[] s = st.getOrDefault(p.getId(), new long[]{0, 0});
            String status = solved.contains(p.getId()) ? "SOLVED" : tried.contains(p.getId()) ? "ATTEMPTED" : null;
            return new ProblemSummary(p.getId(), p.getSlug(), p.getTitle(), p.getDifficulty().name(), Mappers.tags(p),
                    Mappers.percent(s[1], s[0]), s[0], status);
        }).toList();
    }

    // ---------- admin ----------
    @Transactional(readOnly = true)
    public List<AdminProblemRow> adminList() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] r : testCases.countPerProblem()) counts.put((Long) r[0], (Long) r[1]);
        return problems.findAll(Sort.by("id")).stream().map(p -> new AdminProblemRow(p.getId(), p.getSlug(), p.getTitle(),
                p.getDifficulty().name(), p.isPublished(), counts.getOrDefault(p.getId(), 0L).intValue())).toList();
    }

    @Transactional(readOnly = true)
    public AdminProblem adminGet(Long id) {
        Problem p = problems.findById(id).orElseThrow(() -> ApiException.notFound("Problem"));
        return new AdminProblem(p.getId(), p.getSlug(), p.getTitle(), p.getDescription(), p.getDifficulty().name(), Mappers.tags(p),
                p.getTimeLimitMs(), p.getMemoryLimitMb(), p.isPublished(),
                p.getTestCases().stream().map(t -> new TestCaseDto(t.getId(), t.getInput(), t.getExpectedOutput(), t.isSample())).toList());
    }

    @Transactional
    public AdminProblem create(ProblemRequest r) {
        Problem p = new Problem();
        p.setSlug(uniqueSlug(r.title()));
        apply(p, r);
        return adminGet(problems.save(p).getId());
    }

    @Transactional
    public AdminProblem update(Long id, ProblemRequest r) {
        Problem p = problems.findById(id).orElseThrow(() -> ApiException.notFound("Problem"));
        apply(p, r);
        problems.save(p);
        return adminGet(id);
    }

    @Transactional
    public void delete(Long id) {
        Problem p = problems.findById(id).orElseThrow(() -> ApiException.notFound("Problem"));
        for (Contest c : contests.findByProblemId(id)) c.getProblems().removeIf(x -> x.getId().equals(id));
        subs.deleteByProblemId(id);
        problems.delete(p);
    }

    private void apply(Problem p, ProblemRequest r) {
        p.setTitle(r.title().trim());
        p.setDescription(r.description());
        p.setDifficulty(r.difficulty());
        p.setTimeLimitMs(r.timeLimitMs());
        p.setMemoryLimitMb(r.memoryLimitMb());
        p.setPublished(r.published());
        p.getTags().clear();
        if (r.tags() != null) r.tags().stream().map(t -> t.trim().toLowerCase()).filter(t -> !t.isEmpty()).forEach(p.getTags()::add);
        p.getTestCases().clear();
        int i = 0;
        for (TestCaseRequest t : r.testCases()) {
            TestCase tc = new TestCase();
            tc.setProblem(p);
            tc.setInput(t.input().replace("\r\n", "\n"));
            tc.setExpectedOutput(t.expectedOutput().replace("\r\n", "\n"));
            tc.setSample(t.sample());
            tc.setOrderIndex(i++);
            p.getTestCases().add(tc);
        }
    }

    public String uniqueSlug(String title) {
        String base = SlugUtil.slugify(title), slug = base;
        int n = 2;
        while (problems.existsBySlug(slug)) slug = base + "-" + n++;
        return slug;
    }
}
