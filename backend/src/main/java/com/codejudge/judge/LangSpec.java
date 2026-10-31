package com.codejudge.judge;

import com.codejudge.domain.Language;
import java.util.List;
import java.util.function.IntFunction;

/** How each language is compiled and run inside its Docker image. */
public record LangSpec(String image, String fileName, List<String> compile, IntFunction<List<String>> run, int extraMemoryMb) {

    public static LangSpec of(Language l) {
        return switch (l) {
            case PYTHON -> new LangSpec("python:3.12-alpine", "main.py", null,
                    m -> List.of("python", "main.py"), 0);
            case JAVA -> new LangSpec("eclipse-temurin:21-jdk-alpine", "Main.java",
                    List.of("javac", "-encoding", "UTF-8", "Main.java"),
                    m -> List.of("java", "-Xmx" + (int) (m * 0.7) + "m", "-Xss64m", "-XX:+UseSerialGC", "Main"), 128);
            case CPP -> new LangSpec("gcc:14", "main.cpp",
                    List.of("g++", "-O2", "-std=c++17", "-o", "main", "main.cpp"),
                    m -> List.of("./main"), 0);
            case JAVASCRIPT -> new LangSpec("node:22-alpine", "main.js", null,
                    m -> List.of("node", "main.js"), 0);
        };
    }
}
