package com.codejudge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CodeJudgeApplication {
    public static void main(String[] args) {
        SpringApplication.run(CodeJudgeApplication.class, args);
    }
}
