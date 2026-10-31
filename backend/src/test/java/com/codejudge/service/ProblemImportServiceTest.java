package com.codejudge.service;

import static org.junit.jupiter.api.Assertions.*;

import com.codejudge.domain.Difficulty;
import com.codejudge.domain.Problem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ProblemImportServiceTest {
    private final ObjectMapper om = new ObjectMapper();

    private JsonNode item(String extra) throws Exception {
        return om.readTree("""
            {"row_idx":0,"truncated_cells":[],"row":{
              "id":"4/A","contest_id":4,"index":"A","title":"Watermelon","rating":800,"time_limit":1.0,"memory_limit":64.0,
              "description":"Divide $$$w$$$ kilos.","input_format":"One integer $$$w$$$.","output_format":"YES or NO.",
              "examples":[{"input":"8\\n","output":"YES\\n"}],
              "official_tests":[{"input":"8\\n","output":"YES\\n"},{"input":"3\\n","output":"NO\\n"}],
              "official_tests_complete":true,"executable":true,"input_mode":"stdio","tags":["math"] %s }}
            """.formatted(extra));
    }

    @Test void convertsSuitableProblem() throws Exception {
        Problem p = ProblemImportService.toProblem(item(""), 800, 1600);
        assertNotNull(p);
        assertEquals("cf-4a", p.getSlug());
        assertEquals(Difficulty.EASY, p.getDifficulty());
        assertEquals(2, p.getTestCases().size());
        assertTrue(p.getTestCases().get(0).isSample());
        assertFalse(p.getTestCases().get(1).isSample());
        assertTrue(p.getDescription().contains("$w$") && !p.getDescription().contains("$$$"));
        assertTrue(p.getTags().contains("codeforces") && p.getTags().contains("math"));
        assertEquals(256, p.getMemoryLimitMb());
    }

    @Test void skipsProblemsWithCheckerOrOutOfRange() throws Exception {
        assertNull(ProblemImportService.toProblem(item(",\"generated_checker\":\"print(1)\""), 800, 1600));
        assertNull(ProblemImportService.toProblem(item(""), 1000, 1600));
    }
}
