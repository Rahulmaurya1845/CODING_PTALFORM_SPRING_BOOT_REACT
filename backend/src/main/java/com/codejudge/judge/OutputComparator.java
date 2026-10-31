package com.codejudge.judge;

/** Compares program output to the expected output, ignoring trailing spaces and trailing blank lines. */
public final class OutputComparator {
    private OutputComparator() {}

    public static boolean same(String expected, String actual) {
        return normalize(expected).equals(normalize(actual));
    }

    static String normalize(String s) {
        if (s == null) return "";
        String[] lines = s.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (String l : lines) sb.append(l.stripTrailing()).append('\n');
        return sb.toString().stripTrailing();
    }
}
