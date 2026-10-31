package com.codejudge.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "submissions", indexes = {
        @Index(name = "idx_sub_user", columnList = "user_id,createdAt"),
        @Index(name = "idx_sub_problem", columnList = "problem_id"),
        @Index(name = "idx_sub_contest", columnList = "contestId")})
public class Submission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "problem_id")
    private Problem problem;
    private Long contestId;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Language language;
    @Column(columnDefinition = "MEDIUMTEXT", nullable = false)
    private String code;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private Verdict verdict = Verdict.PENDING;
    private Long runtimeMs;
    @Column(nullable = false)
    private int passedCount;
    @Column(nullable = false)
    private int totalCount;
    @Column(columnDefinition = "TEXT")
    private String message;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }
    public Long getContestId() { return contestId; }
    public void setContestId(Long contestId) { this.contestId = contestId; }
    public Language getLanguage() { return language; }
    public void setLanguage(Language language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }
    public Long getRuntimeMs() { return runtimeMs; }
    public void setRuntimeMs(Long runtimeMs) { this.runtimeMs = runtimeMs; }
    public int getPassedCount() { return passedCount; }
    public void setPassedCount(int passedCount) { this.passedCount = passedCount; }
    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
