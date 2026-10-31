package com.codejudge.config;

import com.codejudge.domain.*;
import com.codejudge.repository.ContestRepository;
import com.codejudge.repository.ProblemRepository;
import com.codejudge.repository.UserRepository;
import com.codejudge.util.SlugUtil;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the admin account (from .env) and a set of starter problems on the first run. */
@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final ProblemRepository problems;
    private final ContestRepository contests;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public DataSeeder(UserRepository users, ProblemRepository problems, ContestRepository contests,
                      PasswordEncoder encoder, AppProperties props) {
        this.users = users; this.problems = problems; this.contests = contests; this.encoder = encoder; this.props = props;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        if (problems.count() == 0) seedProblems();
        if (contests.count() == 0 && problems.count() > 0) seedContests();
    }

    /** Three sample contests so the Contests page is not empty: one live, one upcoming, one finished. */
    private void seedContests() {
        Instant now = Instant.now();
        addContest("Weekly Warm-up", "A relaxed round for everyone. Register, solve as many problems as you can, and climb the board.",
                now.minus(Duration.ofHours(1)), now.plus(Duration.ofDays(7)),
                "add-two-numbers", "two-sum", "fizzbuzz", "reverse-a-string");
        addContest("Algorithm Showdown", "Harder problems for a three hour sprint. Starts in two days.",
                now.plus(Duration.ofDays(2)), now.plus(Duration.ofDays(2)).plus(Duration.ofHours(3)),
                "palindrome-number", "valid-parentheses", "maximum-subarray", "longest-common-subsequence");
        addContest("Beginner Cup", "Our first contest. It has ended, but the final standings stay online.",
                now.minus(Duration.ofDays(10)), now.minus(Duration.ofDays(9)),
                "fibonacci-number", "palindrome-number");
        log.info("Seeded {} sample contests", contests.count());
    }

    private void addContest(String title, String description, Instant start, Instant end, String... slugs) {
        Contest c = new Contest();
        c.setTitle(title);
        c.setDescription(description);
        c.setStartTime(start);
        c.setEndTime(end);
        for (String slug : slugs) problems.findBySlug(slug).ifPresent(c.getProblems()::add);
        contests.save(c);
    }

    private void seedAdmin() {
        var a = props.admin();
        if (a.password() == null || a.password().length() < 8) {
            log.warn("ADMIN_PASSWORD is empty or shorter than 8 characters in .env - no admin account created.");
            return;
        }
        if (users.existsByEmailIgnoreCase(a.email()) || users.existsByUsernameIgnoreCase(a.username())) return;
        User u = new User();
        u.setUsername(a.username());
        u.setEmail(a.email().toLowerCase());
        u.setPasswordHash(encoder.encode(a.password()));
        u.setRole(Role.ADMIN);
        users.save(u);
        log.info("Admin account created: {}", a.email());
    }

    // ------------------------------------------------------------------ starter problems
    private void seedProblems() {
        log.info("Seeding starter problems...");

        add("Add Two Numbers", Difficulty.EASY, "math,beginner", 1000, """
                Read two integers and print their sum.

                ## Input
                One line with two integers `a` and `b` separated by a space.

                ## Output
                Print `a + b`.

                ## Constraints
                - `-10^9 <= a, b <= 10^9`
                - The sum can be larger than a 32-bit integer. Use `long` in Java / C++.

                ## Example
                ```
                Input:  3 5
                Output: 8
                ```
                """, 2, sum(), "3 5", "-10 4", "1000000000 1000000000", "0 0", "-7 -8", "-1000000000 -1000000000");

        addRaw("Two Sum", Difficulty.EASY, "array,hash-table", 1500, """
                Given an array of `n` integers and a `target`, find the two **different** positions whose values add up to `target`.
                Exactly one such pair exists.

                ## Input
                - Line 1: integer `n`
                - Line 2: `n` integers
                - Line 3: integer `target`

                ## Output
                Two zero-based indices `i j` with `i < j`, separated by a space.

                ## Constraints
                - `2 <= n <= 10^5`
                - Values fit in a 32-bit integer

                ## Example
                ```
                Input:
                4
                2 7 11 15
                9

                Output:
                0 1
                ```
                Because `2 + 7 = 9`.
                """, 2, new String[][]{
                {"4\n2 7 11 15\n9\n", "0 1\n"}, {"3\n3 2 4\n6\n", "1 2\n"}, {"2\n3 3\n6\n", "0 1\n"},
                {"5\n-1 -2 -3 -4 -5\n-8\n", "2 4\n"}, {"6\n1 5 3 8 12 7\n20\n", "3 4\n"}});

        add("FizzBuzz", Difficulty.EASY, "simulation,string", 1000, """
                Print the numbers from `1` to `n`, one per line, but:
                - for multiples of 3 print `Fizz`
                - for multiples of 5 print `Buzz`
                - for multiples of both print `FizzBuzz`

                ## Input
                A single integer `n` (`1 <= n <= 10^4`).

                ## Example
                ```
                Input:  5
                Output:
                1
                2
                Fizz
                4
                Buzz
                ```
                """, 2, in -> {
            int n = Integer.parseInt(in.trim());
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i <= n; i++) sb.append(i % 15 == 0 ? "FizzBuzz" : i % 3 == 0 ? "Fizz" : i % 5 == 0 ? "Buzz" : String.valueOf(i)).append('\n');
            return sb.toString();
        }, "5", "15", "1", "30", "100", "10000");

        add("Reverse a String", Difficulty.EASY, "string,two-pointers", 1000, """
                Read one line of text and print it reversed (spaces are kept as characters).

                ## Input
                One line, length between 1 and 10^5.

                ## Example
                ```
                Input:  hello world
                Output: dlrow olleh
                ```
                """, 2, in -> new StringBuilder(in.strip()).reverse().toString(),
                "hello world", "racecar level", "a", "Code Judge 2026", "abcdefghijklmnopqrstuvwxyz");

        add("Palindrome Number", Difficulty.EASY, "math", 1000, """
                Given an integer `x`, print `true` if it reads the same forwards and backwards, otherwise `false`.
                Negative numbers are never palindromes.

                ## Input
                One integer `x` (`-2^31 <= x <= 2^31 - 1`).

                ## Example
                ```
                Input:  121
                Output: true

                Input:  -121
                Output: false
                ```
                """, 2, in -> {
            String s = in.trim();
            return String.valueOf(!s.startsWith("-") && new StringBuilder(s).reverse().toString().equals(s));
        }, "121", "-121", "10", "0", "12321", "1000021", "2147447412");

        add("Fibonacci Number", Difficulty.EASY, "dp,math", 1000, """
                `F(0) = 0`, `F(1) = 1`, and `F(n) = F(n-1) + F(n-2)`. Print `F(n)`.

                ## Input
                One integer `n` (`0 <= n <= 90`).

                ## Hint
                A plain recursive solution is far too slow for `n = 90`. Remember what you already computed.

                ## Example
                ```
                Input:  10
                Output: 55
                ```
                """, 2, in -> {
            int n = Integer.parseInt(in.trim());
            long a = 0, b = 1;
            for (int i = 0; i < n; i++) { long t = a + b; a = b; b = t; }
            return String.valueOf(a);
        }, "10", "0", "1", "50", "90", "45");

        add("Valid Parentheses", Difficulty.MEDIUM, "stack,string", 1000, """
                A string made only of `()[]{}` is **valid** if every bracket is closed by the same type of bracket in the correct order.
                Print `true` or `false`.

                ## Input
                One line with between 1 and 10^5 bracket characters.

                ## Example
                ```
                Input:  {[()]}
                Output: true

                Input:  ([)]
                Output: false
                ```
                """, 2, in -> {
            Deque<Character> st = new ArrayDeque<>();
            for (char c : in.trim().toCharArray()) {
                if ("([{".indexOf(c) >= 0) st.push(c);
                else {
                    if (st.isEmpty()) return "false";
                    char o = st.pop();
                    if ("([{".indexOf(o) != ")]}".indexOf(c)) return "false";
                }
            }
            return String.valueOf(st.isEmpty());
        }, "{[()]}", "([)]", "()[]{}", "((", "]", "{{{{[[[[(((())))]]]]}}}}", "(((((((((((((((((((())))))))))))))))))))");

        add("Maximum Subarray", Difficulty.MEDIUM, "array,dp", 2000, """
                Find the contiguous sub-array with the largest sum and print that sum.

                ## Input
                - Line 1: integer `n`
                - Line 2: `n` integers

                ## Constraints
                - `1 <= n <= 2 * 10^5`
                - `-10^4 <= a[i] <= 10^4`
                - An `O(n^2)` solution will time out on the large tests.

                ## Example
                ```
                Input:
                9
                -2 1 -3 4 -1 2 1 -5 4

                Output:
                6
                ```
                """, 2, in -> {
            String[] lines = in.strip().split("\n");
            long best = Long.MIN_VALUE, cur = 0;
            for (String t : lines[1].trim().split("\\s+")) {
                long v = Long.parseLong(t);
                cur = Math.max(v, cur + v);
                best = Math.max(best, cur);
            }
            return String.valueOf(best);
        }, "9\n-2 1 -3 4 -1 2 1 -5 4", "1\n1", "5\n-3 -2 -5 -1 -4", "8\n5 4 -1 7 8 -20 3 3", bigArray(200000, 20000, -10000, 7));

        add("Longest Common Subsequence", Difficulty.MEDIUM, "dp,string", 2000, """
                Given two strings, print the length of their longest common subsequence
                (characters in the same order, not necessarily next to each other).

                ## Input
                Two lines: string `a` and string `b` (length `1..1000`).

                ## Example
                ```
                Input:
                abcde
                ace

                Output:
                3
                ```
                """, 2, in -> {
            String[] l = in.strip().split("\n");
            String a = l[0].trim(), b = l[1].trim();
            int[][] dp = new int[a.length() + 1][b.length() + 1];
            for (int i = 1; i <= a.length(); i++)
                for (int j = 1; j <= b.length(); j++)
                    dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
            return String.valueOf(dp[a.length()][b.length()]);
        }, "abcde\nace", "abc\nabc", "abc\ndef", "AGGTAB\nGXTXAYB", randomString(900, "abc", 1) + "\n" + randomString(900, "abc", 2),
                randomString(1000, "abcdefghij", 3) + "\n" + randomString(1000, "abcdefghij", 4));

        add("Trapping Rain Water", Difficulty.HARD, "two-pointers,stack,array", 2000, """
                Given `n` non-negative integers representing an elevation map (each bar has width 1),
                compute how many units of water it can trap after raining.

                ## Input
                - Line 1: integer `n`
                - Line 2: `n` heights

                ## Constraints
                - `1 <= n <= 10^5`
                - `0 <= height <= 1000`
                - Aim for `O(n)` time.

                ## Example
                ```
                Input:
                12
                0 1 0 2 1 0 1 3 2 1 2 1

                Output:
                6
                ```
                """, 2, in -> {
            String[] lines = in.strip().split("\n");
            String[] t = lines[1].trim().split("\\s+");
            int[] h = new int[t.length];
            for (int i = 0; i < h.length; i++) h[i] = Integer.parseInt(t[i]);
            int l = 0, r = h.length - 1, lm = 0, rm = 0;
            long water = 0;
            while (l < r) {
                if (h[l] < h[r]) { lm = Math.max(lm, h[l]); water += lm - h[l]; l++; }
                else { rm = Math.max(rm, h[r]); water += rm - h[r]; r--; }
            }
            return String.valueOf(water);
        }, "12\n0 1 0 2 1 0 1 3 2 1 2 1", "6\n4 2 0 3 2 5", "1\n5", "5\n3 0 0 0 3", bigArray(100000, 1001, 0, 11));

        log.info("Seeded {} problems", problems.count());
    }

    // ------------------------------------------------------------------ helpers
    private static Function<String, String> sum() {
        return in -> {
            String[] p = in.trim().split("\\s+");
            return String.valueOf(Long.parseLong(p[0]) + Long.parseLong(p[1]));
        };
    }

    private static String bigArray(int n, int range, int offset, long seed) {
        Random r = new Random(seed);
        StringBuilder sb = new StringBuilder().append(n).append('\n');
        for (int i = 0; i < n; i++) sb.append(r.nextInt(range) + offset).append(i + 1 < n ? " " : "");
        return sb.toString();
    }

    private static String randomString(int len, String alphabet, long seed) {
        Random r = new Random(seed);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append(alphabet.charAt(r.nextInt(alphabet.length())));
        return sb.toString();
    }

    /** Adds a problem whose expected outputs are produced by a reference solution. First `samples` tests are shown to users. */
    private void add(String title, Difficulty d, String tags, int timeMs, String description, int samples,
                     Function<String, String> reference, String... inputs) {
        String[][] pairs = new String[inputs.length][];
        for (int i = 0; i < inputs.length; i++) {
            String in = inputs[i].endsWith("\n") ? inputs[i] : inputs[i] + "\n";
            String out = reference.apply(in);
            pairs[i] = new String[]{in, out.endsWith("\n") ? out : out + "\n"};
        }
        addRaw(title, d, tags, timeMs, description, samples, pairs);
    }

    private void addRaw(String title, Difficulty d, String tags, int timeMs, String description, int samples, String[][] tests) {
        Problem p = new Problem();
        p.setSlug(SlugUtil.slugify(title));
        p.setTitle(title);
        p.setDifficulty(d);
        p.setDescription(description.strip());
        p.setTimeLimitMs(timeMs);
        p.setMemoryLimitMb(256);
        for (String t : tags.split(",")) p.getTags().add(t.trim());
        for (int i = 0; i < tests.length; i++) {
            TestCase tc = new TestCase();
            tc.setProblem(p);
            tc.setInput(tests[i][0]);
            tc.setExpectedOutput(tests[i][1]);
            tc.setSample(i < samples);
            tc.setOrderIndex(i);
            p.getTestCases().add(tc);
        }
        problems.save(p);
    }
}
