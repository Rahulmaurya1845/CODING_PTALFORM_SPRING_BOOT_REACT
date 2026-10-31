package com.codejudge.judge;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class OutputComparatorTest {
    @Test void ignoresTrailingWhitespaceAndBlankLines() {
        assertTrue(OutputComparator.same("1\n2\n3\n", "1 \r\n2\r\n3\n\n\n"));
    }
    @Test void detectsDifferences() {
        assertFalse(OutputComparator.same("1 2", "1  2"));
        assertFalse(OutputComparator.same("abc", "abd"));
    }
    @Test void handlesEmpty() {
        assertTrue(OutputComparator.same("", "\n"));
    }
}
