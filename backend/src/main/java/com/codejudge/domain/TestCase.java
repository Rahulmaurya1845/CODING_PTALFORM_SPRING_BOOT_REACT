package com.codejudge.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "test_cases")
public class TestCase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "problem_id")
    private Problem problem;
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String input;
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String expectedOutput;
    @Column(name = "is_sample", nullable = false)
    private boolean sample;
    @Column(nullable = false)
    private int orderIndex;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Problem getProblem() { return problem; }
    public void setProblem(Problem problem) { this.problem = problem; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
    public boolean isSample() { return sample; }
    public void setSample(boolean sample) { this.sample = sample; }
    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
