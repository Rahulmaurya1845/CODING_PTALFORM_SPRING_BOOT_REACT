package com.codejudge.repository;

import com.codejudge.domain.TestCase;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByProblemIdOrderByOrderIndexAsc(Long problemId);
    List<TestCase> findByProblemIdAndSampleTrueOrderByOrderIndexAsc(Long problemId);

    @Query("select t.problem.id, count(t) from TestCase t group by t.problem.id")
    List<Object[]> countPerProblem();
}
