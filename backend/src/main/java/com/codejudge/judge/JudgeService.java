package com.codejudge.judge;

import com.codejudge.config.AppProperties;
import com.codejudge.domain.*;
import com.codejudge.dto.Dto.RunResult;
import com.codejudge.repository.SubmissionRepository;
import com.codejudge.repository.TestCaseRepository;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.*;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

/** Takes submissions from an in-memory queue and judges them on a pool of worker threads. */
@Service
public class JudgeService {
    private static final Logger log = LoggerFactory.getLogger(JudgeService.class);

    private final SubmissionRepository subs;
    private final TestCaseRepository tests;
    private final DockerSandbox sandbox;
    private final AppProperties props;
    private final ExecutorService pool;

    public JudgeService(SubmissionRepository subs, TestCaseRepository tests, DockerSandbox sandbox, AppProperties props) {
        this.subs = subs; this.tests = tests; this.sandbox = sandbox; this.props = props;
        this.pool = Executors.newFixedThreadPool(Math.max(1, props.judge().workers()), r -> {
            Thread t = new Thread(r, "judge-worker");
            t.setDaemon(true);
            return t;
        });
    }

    @PreDestroy
    void stop() { pool.shutdownNow(); }

    public boolean isEnabled(Language l) { return props.judge().languages().stream().anyMatch(x -> x.trim().equalsIgnoreCase(l.name())); }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (!sandbox.dockerAvailable()) {
            log.error("==> Docker is NOT reachable. Start Docker Desktop, otherwise submissions cannot be judged.");
            return;
        }
        log.info("Docker is available. Judge workers: {}", props.judge().workers());
        if (props.judge().prepull()) {
            Thread.startVirtualThread(() -> {
                for (Language l : Language.values()) {
                    if (!isEnabled(l)) continue;
                    try { sandbox.ensureImage(LangSpec.of(l).image()); } catch (Exception e) { log.warn("Prepull failed: {}", e.getMessage()); }
                }
            });
        }
        // re-queue submissions that were interrupted by a restart
        for (Submission s : subs.findByVerdictIn(List.of(Verdict.PENDING, Verdict.JUDGING))) enqueue(s.getId());
    }

    public void enqueue(Long submissionId) { pool.execute(() -> safeJudge(submissionId)); }

    // ------------------------------------------------------------------ judging
    private void safeJudge(Long id) {
        try {
            judge(id);
        } catch (Throwable t) {
            log.error("Judging failed for submission {}", id, t);
            finish(id, Verdict.INTERNAL_ERROR, null, 0, 0,
                    "The judge hit an internal error: " + t.getMessage() + "\nIs Docker Desktop running?");
        }
    }

    private void finish(Long id, Verdict v, Long runtimeMs, int passed, int total, String message) {
        log.info("Submission {} finished: {} ({}/{} tests, {} ms)", id, v, passed, total, runtimeMs);
        subs.updateResult(id, v, runtimeMs, passed, total, message);
    }

    private void judge(Long id) throws Exception {
        Submission s = subs.findDetailed(id).orElse(null);
        if (s == null) return;
        Problem p = s.getProblem();
        log.info("Judging submission {} ({} / {})", id, s.getLanguage(), p.getSlug());
        List<TestCase> cases = tests.findByProblemIdOrderByOrderIndexAsc(p.getId());
        subs.setVerdict(id, Verdict.JUDGING);
        if (cases.isEmpty()) { finish(id, Verdict.INTERNAL_ERROR, null, 0, 0, "This problem has no test cases."); return; }

        LangSpec spec = LangSpec.of(s.getLanguage());
        int mem = p.getMemoryLimitMb();
        long limit = p.getTimeLimitMs();
        long allowance = props.judge().startupAllowanceMs();
        Path root = Files.createTempDirectory("cj-");
        try {
            Path code = Files.createDirectory(root.resolve("code"));
            Path stdin = root.resolve("in.txt");
            Files.writeString(code.resolve(spec.fileName()), s.getCode());
            sandbox.ensureImage(spec.image());
            log.info("Submission {}: image {} is ready", id, spec.image());

            if (spec.compile() != null) {
                Files.writeString(stdin, "");
                SandboxResult c = sandbox.run(code, false, spec.image(), spec.compile(), stdin, 60_000, 768);
                log.info("Submission {}: compile finished in {} ms (exit {}, timedOut {})", id, c.timeMs(), c.exitCode(), c.timedOut());
                if (c.exitCode() != 0 || c.timedOut()) {
                    String msg = c.timedOut() ? "Compilation took too long" : c.stderr() + c.stdout();
                    finish(id, Verdict.COMPILATION_ERROR, null, 0, cases.size(), cut(msg, 4000));
                    return;
                }
            }

            log.info("Submission {}: starting sandbox container...", id);
            String session = sandbox.startSession(code, spec.image(), mem + spec.extraMemoryMb());
            log.info("Submission {}: sandbox container started", id);
            try {
                int passed = 0;
                long maxTime = 0;
                for (int i = 0; i < cases.size(); i++) {
                    TestCase tc = cases.get(i);
                    Files.writeString(stdin, tc.getInput());
                    SandboxResult r = sandbox.exec(session, spec.run().apply(mem), stdin, limit + allowance);
                    log.info("Submission {}: test {}/{} exit={} {} ms timedOut={}", id, i + 1, cases.size(), r.exitCode(), r.timeMs(), r.timedOut());
                    maxTime = Math.max(maxTime, Math.min(r.timeMs(), limit));
                    String fail = null;
                    Verdict v = null;
                    if (r.timedOut() || r.timeMs() > limit + allowance) {
                        v = Verdict.TIME_LIMIT_EXCEEDED; fail = "Your program did not finish within " + limit + " ms.";
                    } else if (r.exitCode() == 137 || r.stderr().contains("OutOfMemoryError") || r.stderr().contains("bad_alloc") || r.stderr().contains("MemoryError")) {
                        v = Verdict.MEMORY_LIMIT_EXCEEDED; fail = "Your program used more than " + mem + " MB of memory.";
                    } else if (r.exitCode() != 0) {
                        v = Verdict.RUNTIME_ERROR; fail = "Exit code " + r.exitCode() + "\n" + tail(r.stderr(), 1500);
                    } else if (!OutputComparator.same(tc.getExpectedOutput(), r.stdout())) {
                        v = Verdict.WRONG_ANSWER;
                        fail = tc.isSample()
                                ? "Input:\n" + cut(tc.getInput(), 500) + "\n\nExpected:\n" + cut(tc.getExpectedOutput(), 500) + "\n\nYour output:\n" + cut(r.stdout(), 500)
                                : "Your output differs from the expected output on a hidden test case.";
                    }
                    if (v != null) {
                        String where = "Failed on test case " + (i + 1) + " of " + cases.size() + (tc.isSample() ? " (sample)" : " (hidden)") + "\n\n";
                        finish(id, v, maxTime, passed, cases.size(), where + fail);
                        return;
                    }
                    passed++;
                }
                finish(id, Verdict.ACCEPTED, maxTime, passed, cases.size(), null);
            } finally {
                sandbox.stopSession(session);
            }
        } finally {
            deleteQuietly(root);
        }
    }

    // ------------------------------------------------------------------ "Run" with custom input
    public RunResult runCustom(Language lang, String source, String input) {
        try {
            return pool.submit(() -> doRun(lang, source, input)).get(120, TimeUnit.SECONDS);
        } catch (Exception e) {
            return new RunResult("INTERNAL_ERROR", "", "Judge error: " + e.getMessage() + "\nIs Docker Desktop running?", 0);
        }
    }

    private RunResult doRun(Language lang, String source, String input) throws Exception {
        LangSpec spec = LangSpec.of(lang);
        Path root = Files.createTempDirectory("cj-run-");
        try {
            Path code = Files.createDirectory(root.resolve("code"));
            Path stdin = root.resolve("in.txt");
            Files.writeString(code.resolve(spec.fileName()), source);
            sandbox.ensureImage(spec.image());
            if (spec.compile() != null) {
                Files.writeString(stdin, "");
                SandboxResult c = sandbox.run(code, false, spec.image(), spec.compile(), stdin, 60_000, 768);
                if (c.exitCode() != 0 || c.timedOut()) return new RunResult("COMPILATION_ERROR", "", cut(c.stderr() + c.stdout(), 4000), c.timeMs());
            }
            Files.writeString(stdin, input);
            String session = sandbox.startSession(code, spec.image(), 256 + spec.extraMemoryMb());
            SandboxResult r;
            try {
                r = sandbox.exec(session, spec.run().apply(256), stdin, 5000 + props.judge().startupAllowanceMs());
            } finally {
                sandbox.stopSession(session);
            }
            String status = r.timedOut() ? "TIME_LIMIT_EXCEEDED"
                    : (r.exitCode() == 137 || r.stderr().contains("OutOfMemoryError")) ? "MEMORY_LIMIT_EXCEEDED"
                    : r.exitCode() != 0 ? "RUNTIME_ERROR" : "OK";
            return new RunResult(status, cut(r.stdout(), 20000), tail(r.stderr(), 4000), r.timeMs());
        } finally {
            deleteQuietly(root);
        }
    }

    // ------------------------------------------------------------------ helpers
    private static String cut(String s, int max) { return s == null ? "" : s.length() <= max ? s : s.substring(0, max) + "\n... (truncated)"; }
    private static String tail(String s, int max) { return s == null ? "" : s.length() <= max ? s : "... (truncated)\n" + s.substring(s.length() - max); }

    private static void deleteQuietly(Path root) {
        try (Stream<Path> w = Files.walk(root)) {
            w.sorted(Comparator.reverseOrder()).forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) { } });
        } catch (IOException ignored) { }
    }
}
