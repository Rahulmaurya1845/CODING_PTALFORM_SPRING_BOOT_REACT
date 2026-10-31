package com.codejudge.service;

import com.codejudge.domain.*;
import com.codejudge.dto.Dto.ImportStatus;
import com.codejudge.repository.ProblemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Imports Codeforces problems (statement + official test cases) from the open dataset "open-r1/codeforces"
 * (CC BY 4.0) using the free Hugging Face dataset-viewer API. Only problems that this judge can grade fairly are kept:
 * standard input/output, a single correct answer (no special checker), no interaction, no images, complete official tests.
 */
@Service
public class ProblemImportService {
    private static final Logger log = LoggerFactory.getLogger(ProblemImportService.class);
    private static final String BASE = "https://datasets-server.huggingface.co";
    private static final String DATASET = "open-r1/codeforces";
    private static final int PAGE = 20, MAX_TESTS = 40, MAX_TEST_CHARS = 1_000_000;

    private final ProblemRepository problems;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NORMAL).build();
    private volatile ImportStatus status = new ImportStatus(false, 0, 0, 0, "Idle");

    public ProblemImportService(ProblemRepository problems, ObjectMapper mapper) {
        this.problems = problems; this.mapper = mapper;
    }

    public ImportStatus status() { return status; }

    public synchronized ImportStatus start(int count, int minRating, int maxRating) {
        if (status.running()) return status;
        status = new ImportStatus(true, 0, 0, 0, "Starting...");
        Thread.startVirtualThread(() -> run(count, minRating, maxRating));
        return status;
    }

    private void run(int count, int minRating, int maxRating) {
        int imported = 0, scanned = 0, skipped = 0;
        try {
            String[] cs = discover();
            log.info("Import started: dataset {} config={} split={} (want {} problems, rating {}-{})", DATASET, cs[0], cs[1], count, minRating, maxRating);
            int total = Integer.MAX_VALUE, offset = 0;
            while (imported < count && offset < total) {
                JsonNode page = getJson(BASE + "/rows?dataset=" + enc(DATASET) + "&config=" + enc(cs[0]) + "&split=" + enc(cs[1])
                        + "&offset=" + offset + "&length=" + PAGE);
                if (page.path("num_rows_total").isNumber()) total = page.path("num_rows_total").asInt();
                JsonNode rows = page.path("rows");
                if (!rows.isArray() || rows.isEmpty()) break;
                for (JsonNode item : rows) {
                    if (imported >= count) break;
                    scanned++;
                    try {
                        Problem p = toProblem(item, minRating, maxRating);
                        if (p == null || problems.existsBySlug(p.getSlug())) { skipped++; continue; }
                        problems.save(p);
                        imported++;
                    } catch (Exception e) {
                        skipped++;
                        log.warn("Skipped one row: {}", e.toString());
                    }
                }
                offset += rows.size();
                status = new ImportStatus(true, imported, scanned, skipped,
                        "Imported " + imported + " of " + count + " (scanned " + scanned + " rows)...");
                Thread.sleep(300);
            }
            status = new ImportStatus(false, imported, scanned, skipped,
                    "Done: imported " + imported + " problems (scanned " + scanned + ", skipped " + skipped + ").");
            log.info(status.message());
        } catch (Exception e) {
            log.error("Import failed", e);
            status = new ImportStatus(false, imported, scanned, skipped, "Import failed: " + e.getMessage());
        }
    }

    private String[] discover() throws IOException, InterruptedException {
        JsonNode splits = getJson(BASE + "/splits?dataset=" + enc(DATASET)).path("splits");
        for (JsonNode s : splits)
            if ("default".equals(s.path("config").asText()) && "train".equals(s.path("split").asText())) return new String[]{"default", "train"};
        if (splits.isArray() && !splits.isEmpty()) return new String[]{splits.get(0).path("config").asText(), splits.get(0).path("split").asText()};
        throw new IOException("Dataset " + DATASET + " was not found on Hugging Face");
    }

    private JsonNode getJson(String url) throws IOException, InterruptedException {
        IOException last = new IOException("No response");
        for (int i = 0; i < 4; i++) {
            HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(180))
                    .header("Accept", "application/json").GET().build();
            try {
                HttpResponse<String> r = http.send(req, HttpResponse.BodyHandlers.ofString());
                if (r.statusCode() == 200) return mapper.readTree(r.body());
                String b = r.body() == null ? "" : r.body();
                last = new IOException("HTTP " + r.statusCode() + " from Hugging Face " + (b.length() > 200 ? b.substring(0, 200) : b));
                if (r.statusCode() == 400 || r.statusCode() == 404) break;
            } catch (IOException e) { last = e; }
            Thread.sleep(2000L * (i + 1));
        }
        throw last;
    }

    // ------------------------------------------------------------------ row -> Problem
    /** Returns null when the row is not suitable for this judge. Package-private for unit tests. */
    static Problem toProblem(JsonNode item, int minRating, int maxRating) {
        JsonNode r = item.path("row");
        if (item.path("truncated_cells").size() > 0) return null;
        if (!r.path("executable").asBoolean(false) || !r.path("official_tests_complete").asBoolean(false)) return null;
        if (!"stdio".equals(r.path("input_mode").asText("stdio"))) return null;
        if (has(r, "generated_checker") || has(r, "interaction_format")) return null;
        if (!r.path("rating").isNumber()) return null;
        int rating = r.path("rating").asInt();
        if (rating < minRating || rating > maxRating) return null;

        String title = text(r, "title"), desc = text(r, "description");
        if (title == null || desc == null || desc.contains("<img") || desc.contains("![")) return null;
        JsonNode tests = r.path("official_tests");
        if (!tests.isArray() || tests.isEmpty()) return null;

        // sample inputs shown to users
        Map<String, String> samples = new LinkedHashMap<>();
        for (JsonNode e : r.path("examples")) {
            String in = text(e, "input"), out = text(e, "output");
            if (in != null && out != null) samples.put(norm(in), out);
        }
        List<String[]> cases = new ArrayList<>();
        Set<String> used = new HashSet<>();
        for (JsonNode t : tests) {
            if (cases.size() >= MAX_TESTS) break;
            String in = text(t, "input"), out = text(t, "output");
            if (in == null || out == null || in.length() > MAX_TEST_CHARS || out.length() > MAX_TEST_CHARS) return null;
            boolean sample = samples.containsKey(norm(in));
            if (sample) used.add(norm(in));
            cases.add(new String[]{in.replace("\r\n", "\n"), out.replace("\r\n", "\n"), sample ? "1" : "0"});
        }
        List<String[]> ordered = new ArrayList<>();
        for (Map.Entry<String, String> s : samples.entrySet())
            if (!used.contains(s.getKey())) ordered.add(new String[]{s.getKey() + "\n", s.getValue().replace("\r\n", "\n"), "1"});
        ordered.addAll(cases);
        if (ordered.stream().noneMatch(c -> c[2].equals("1"))) ordered.get(0)[2] = "1";

        String contestId = r.path("contest_id").isMissingNode() || r.path("contest_id").isNull() ? text(r, "id") : r.path("contest_id").asText();
        String label = (contestId == null ? "" : contestId) + (text(r, "index") == null ? "" : text(r, "index"));
        String slug = ("cf-" + label).toLowerCase().replaceAll("[^a-z0-9]+", "");
        if (slug.equals("cf")) return null;
        slug = "cf-" + slug.substring(2);

        StringBuilder md = new StringBuilder(math(desc));
        if (text(r, "input_format") != null) md.append("\n\n## Input\n\n").append(math(text(r, "input_format")));
        if (text(r, "output_format") != null) md.append("\n\n## Output\n\n").append(math(text(r, "output_format")));
        if (text(r, "note") != null) md.append("\n\n## Note\n\n").append(math(text(r, "note")));
        md.append("\n\n---\n*Source: Codeforces problem ").append(label)
          .append(" via the open-r1/codeforces dataset (CC BY 4.0). Original statement by the Codeforces problem setters.*");

        Problem p = new Problem();
        p.setSlug(slug);
        p.setTitle(title.trim());
        p.setDescription(md.toString());
        p.setDifficulty(rating <= 1100 ? Difficulty.EASY : rating <= 1700 ? Difficulty.MEDIUM : Difficulty.HARD);
        // limits are tuned for C++ on Codeforces: double the time for Python/Java/JS, keep memory sane
        p.setTimeLimitMs((int) Math.min(15000, Math.max(2000, Math.round(r.path("time_limit").asDouble(1.0) * 2000))));
        p.setMemoryLimitMb((int) Math.min(1024, Math.max(256, Math.round(r.path("memory_limit").asDouble(256)))));
        for (JsonNode t : r.path("tags")) if (t.isTextual()) p.getTags().add(t.asText().toLowerCase());
        p.getTags().add("codeforces");
        int i = 0;
        for (String[] c : ordered) {
            TestCase tc = new TestCase();
            tc.setProblem(p); tc.setInput(c[0]); tc.setExpectedOutput(c[1]); tc.setSample(c[2].equals("1")); tc.setOrderIndex(i++);
            p.getTestCases().add(tc);
        }
        return p;
    }

    /** Codeforces writes inline math as $$$x$$$; standard LaTeX delimiters are $x$ and $$x$$. */
    static String math(String s) { return s.replace("$$$$$$", "$$").replace("$$$", "$"); }
    private static String norm(String s) { return s.replace("\r\n", "\n").strip(); }
    private static String text(JsonNode n, String f) {
        JsonNode v = n.path(f);
        return v.isTextual() && !v.asText().isBlank() ? v.asText() : null;
    }
    private static boolean has(JsonNode n, String f) { return text(n, f) != null; }
    private static String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }
}
