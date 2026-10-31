package com.codejudge.service;

import com.codejudge.domain.*;
import com.codejudge.dto.Dto.*;
import com.codejudge.dto.Mappers;
import com.codejudge.exception.ApiException;
import com.codejudge.repository.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {
    private final UserRepository users;
    private final ProblemRepository problems;
    private final SubmissionRepository subs;
    private final ContestRepository contests;

    public StatsService(UserRepository users, ProblemRepository problems, SubmissionRepository subs, ContestRepository contests) {
        this.users = users; this.problems = problems; this.subs = subs; this.contests = contests;
    }

    public PublicStats publicStats() {
        return new PublicStats(problems.countByPublishedTrue(), users.count(), subs.count(), contests.count());
    }

    @Transactional(readOnly = true)
    public List<GlobalRank> ranking(int size) {
        List<Object[]> rows = subs.ranking(PageRequest.of(0, Math.min(Math.max(size, 1), 100)));
        Map<Long, User> byId = users.findAllById(rows.stream().map(r -> (Long) r[0]).toList()).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        List<GlobalRank> out = new ArrayList<>();
        int rank = 1;
        for (Object[] r : rows) out.add(new GlobalRank(rank++, byId.get((Long) r[0]).getUsername(), ((Number) r[1]).intValue()));
        return out;
    }

    @Transactional(readOnly = true)
    public Profile profile(String username) {
        User u = users.findByUsernameIgnoreCase(username).orElseThrow(() -> ApiException.notFound("User"));
        Long uid = u.getId();

        Map<String, Long> solved = new LinkedHashMap<>(), available = new LinkedHashMap<>();
        for (Difficulty d : Difficulty.values()) { solved.put(d.name(), 0L); available.put(d.name(), 0L); }
        for (Object[] r : subs.solvedByDifficulty(uid)) solved.put(((Difficulty) r[0]).name(), (Long) r[1]);
        for (Object[] r : problems.countByDifficulty()) available.put(((Difficulty) r[0]).name(), (Long) r[1]);
        long totalSolved = solved.values().stream().mapToLong(Long::longValue).sum();

        Integer rank = null;
        List<Object[]> ranking = subs.ranking(PageRequest.of(0, 5000));
        for (int i = 0; i < ranking.size(); i++) if (uid.equals(ranking.get(i)[0])) { rank = i + 1; break; }

        long total = subs.countByUserId(uid), accepted = subs.countByUserIdAndVerdict(uid, Verdict.ACCEPTED);
        Map<String, Long> langs = new LinkedHashMap<>();
        for (Object[] r : subs.languagesForUser(uid)) langs.put(((Language) r[0]).name(), (Long) r[1]);

        Instant since = Instant.now().minus(Duration.ofDays(365));
        TreeMap<LocalDate, Integer> days = new TreeMap<>();
        for (Instant t : subs.timesForUser(uid, since)) days.merge(t.atZone(ZoneOffset.UTC).toLocalDate(), 1, Integer::sum);
        Map<String, Integer> heat = new LinkedHashMap<>();
        days.forEach((d, c) -> heat.put(d.toString(), c));

        int[] streaks = streaks(days.keySet());
        List<SubmissionDto> recent = subs.findTop8ByUserIdOrderByCreatedAtDesc(uid).stream().map(s -> Mappers.submission(s, false)).toList();
        return new Profile(u.getUsername(), u.getCreatedAt(), rank, totalSolved, solved, available, total, accepted,
                Mappers.percent(accepted, total), streaks[0], streaks[1], langs, heat, recent);
    }

    /** returns {current streak, longest streak} */
    private static int[] streaks(Set<LocalDate> dates) {
        if (dates.isEmpty()) return new int[]{0, 0};
        List<LocalDate> sorted = new ArrayList<>(new TreeSet<>(dates));
        int longest = 1, run = 1;
        for (int i = 1; i < sorted.size(); i++) {
            run = sorted.get(i - 1).plusDays(1).equals(sorted.get(i)) ? run + 1 : 1;
            longest = Math.max(longest, run);
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate cur = dates.contains(today) ? today : today.minusDays(1);
        int current = 0;
        while (dates.contains(cur)) { current++; cur = cur.minusDays(1); }
        return new int[]{current, longest};
    }

    @Transactional(readOnly = true)
    public AdminStats adminStats() {
        Map<String, Long> verdicts = new LinkedHashMap<>();
        for (Object[] r : subs.verdictCounts()) verdicts.put(((Verdict) r[0]).name(), (Long) r[1]);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<String, Long> last7 = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) last7.put(today.minusDays(i).toString(), 0L);
        for (Instant t : subs.timesSince(today.minusDays(6).atStartOfDay(ZoneOffset.UTC).toInstant()))
            last7.merge(t.atZone(ZoneOffset.UTC).toLocalDate().toString(), 1L, Long::sum);
        return new AdminStats(users.count(), problems.count(), subs.count(), contests.count(), verdicts, last7);
    }
}
