package com.codejudge.repository;

import com.codejudge.domain.Contest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findAllByOrderByStartTimeDesc();

    @Query("select c from Contest c join c.problems p where p.id = :pid")
    List<Contest> findByProblemId(@Param("pid") Long pid);

    @Query("select count(c) from Contest c join c.participants u where c.id = :cid and u.id = :uid")
    long countParticipant(@Param("cid") Long cid, @Param("uid") Long uid);

    @Query("select count(c) from Contest c join c.problems p where c.id = :cid and p.id = :pid")
    long countProblem(@Param("cid") Long cid, @Param("pid") Long pid);

    default boolean isParticipant(Long cid, Long uid) { return countParticipant(cid, uid) > 0; }
    default boolean hasProblem(Long cid, Long pid) { return countProblem(cid, pid) > 0; }
}
