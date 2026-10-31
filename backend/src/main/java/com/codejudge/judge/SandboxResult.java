package com.codejudge.judge;

public record SandboxResult(int exitCode, String stdout, String stderr, long timeMs, boolean timedOut) {}
