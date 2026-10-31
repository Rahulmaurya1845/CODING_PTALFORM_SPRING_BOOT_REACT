package com.codejudge.repository;

import com.codejudge.domain.*;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    @Query("select s from Submission s join fetch s.problem join fetch s.user where s.id = :id")
    Optional<Submission> findDetailed(@Param("id") Long id);

    @Query(value = "select s from Submission s join fetch s.problem join fetch s.user where s.user.id = :uid order by s.createdAt desc",
           countQuery = "select count(s) from Submission s where s.user.id = :uid")
    Page<Submission> mine(@Param("uid") Long uid, Pageable pageable);

    @Query(value = "select s from Submission s join fetch s.problem join fetch s.user where s.user.id = :uid and s.problem.slug = :slug order by s.createdAt desc",
           countQuery = "select count(s) from Submission s where s.user.id = :uid and s.problem.slug = :slug")
    Page<Submission> mineForProblem(@Param("uid") Long uid, @Param("slug") String slug, Pageable pageable);

    @EntityGraph(attributePaths = {"problem", "user"})
    List<Submission> findTop8ByUserIdOrderByCreatedAtDesc(Long userId);

    List<Submission> findByVerdictIn(Collection<Verdict> verdicts);
    long countByUserIdAndCreatedAtAfter(Long userId, Instant since);
    long countByUserId(Long userId);
    long countByUserIdAndVerdict(Long userId, Verdict verdict);
    void deleteByProblemId(Long problemId);

    @Query("select distinct s.problem.id from Submission s where s.user.id = :uid and s.verdict = com.codejudge.domain.Verdict.ACCEPTED")
    List<Long> solvedIds(@Param("uid") Long uid);

    @Query("select distinct s.problem.id from Submission s where s.user.id = :uid")
    List<Long> attemptedIds(@Param("uid") Long uid);

    @Query("select s.problem.id, count(s), sum(case when s.verdict = com.codejudge.domain.Verdict.ACCEPTED then 1 else 0 end) from Submission s where s.problem.id in :ids group by s.problem.id")
    List<Object[]> stats(@Param("ids") Collection<Long> ids);

    @Query("select s from Submission s join fetch s.user join fetch s.problem where s.contestId = :cid order by s.createdAt asc")
    List<Submission> forContest(@Param("cid") Long cid);

    @Query("select s.createdAt from Submission s where s.user.id = :uid and s.createdAt > :since")
    List<Instant> timesForUser(@Param("uid") Long uid, @Param("since") Instant since);

    @Query("select s.createdAt from Submission s where s.createdAt > :since")
    List<Instant> timesSince(@Param("since") Instant since);

    @Query("select s.user.id, count(distinct s.problem.id) from Submission s where s.verdict = com.codejudge.domain.Verdict.ACCEPTED group by s.user.id order by count(distinct s.problem.id) desc, s.user.id asc")
    List<Object[]> ranking(Pageable pageable);

    @Query("select s.problem.difficulty, count(distinct s.problem.id) from Submission s where s.user.id = :uid and s.verdict = com.codejudge.domain.Verdict.ACCEPTED group by s.problem.difficulty")
    List<Object[]> solvedByDifficulty(@Param("uid") Long uid);

    @Query("select s.language, count(s) from Submission s where s.user.id = :uid group by s.language")
    List<Object[]> languagesForUser(@Param("uid") Long uid);

    @Query("select s.verdict, count(s) from Submission s group by s.verdict")
    List<Object[]> verdictCounts();

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("update Submission s set s.verdict = :v where s.id = :id")
    void setVerdict(@Param("id") Long id, @Param("v") Verdict v);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("update Submission s set s.verdict = :v, s.runtimeMs = :rt, s.passedCount = :p, s.totalCount = :t, s.message = :m where s.id = :id")
    void updateResult(@Param("id") Long id, @Param("v") Verdict v, @Param("rt") Long rt,
                      @Param("p") int p, @Param("t") int t, @Param("m") String m);
}
