package com.codejudge.dto;

import com.codejudge.domain.*;
import com.codejudge.dto.Dto.*;
import java.time.Instant;
import java.util.List;

public final class Mappers {
    private Mappers() {}

    public static UserDto user(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getEmail(), u.getRole().name(), u.getCreatedAt());
    }

    public static SubmissionDto submission(Submission s, boolean withCode) {
        return new SubmissionDto(s.getId(), s.getUser().getUsername(), s.getProblem().getSlug(), s.getProblem().getTitle(),
                s.getLanguage().name(), s.getVerdict().name(), s.getRuntimeMs(), s.getPassedCount(), s.getTotalCount(),
                s.getMessage(), withCode ? s.getCode() : null, s.getCreatedAt(), s.getContestId());
    }

    public static List<String> tags(Problem p) { return List.copyOf(p.getTags()); }

    public static String contestStatus(Contest c) {
        Instant now = Instant.now();
        if (now.isBefore(c.getStartTime())) return "UPCOMING";
        if (now.isAfter(c.getEndTime())) return "ENDED";
        return "RUNNING";
    }

    public static double percent(long part, long total) {
        return total == 0 ? 0 : Math.round(part * 1000.0 / total) / 10.0;
    }
}
