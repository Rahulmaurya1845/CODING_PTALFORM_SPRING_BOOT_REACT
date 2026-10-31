package com.codejudge.repository;

import com.codejudge.domain.Problem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProblemRepository extends JpaRepository<Problem, Long>, JpaSpecificationExecutor<Problem> {
    Optional<Problem> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Problem> findByPublishedTrueOrderByIdAsc();
    long countByPublishedTrue();

    @Query("select distinct t from Problem p join p.tags t where p.published = true order by t")
    List<String> allTags();

    @Query("select p.difficulty, count(p) from Problem p where p.published = true group by p.difficulty")
    List<Object[]> countByDifficulty();
}
