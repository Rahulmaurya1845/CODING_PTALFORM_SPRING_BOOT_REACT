package com.codejudge.judge;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Runs untrusted code inside a throw-away Docker container:
 * no network, limited memory/CPU/processes, all capabilities dropped, removed afterwards.
 */
@Component
public class DockerSandbox {
    private static final Logger log = LoggerFactory.getLogger(DockerSandbox.class);
    private static final int STDOUT_CAP = 1_000_000;
    private static final int STDERR_CAP = 100_000;

    private final Set<String> readyImages = ConcurrentHashMap.newKeySet();
    private final ExecutorService io = Executors.newVirtualThreadPerTaskExecutor();

    public boolean dockerAvailable() {
        try {
            Process p = new ProcessBuilder("docker", "version", "--format", "{{.Server.Version}}").redirectErrorStream(true).start();
            p.getInputStream().readAllBytes();
            return p.waitFor(15, TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /** Pulls the image the first time it is needed (not counted in the time limit). */
    public void ensureImage(String image) throws IOException, InterruptedException {
        if (readyImages.contains(image)) return;
        synchronized (image.intern()) {
            if (readyImages.contains(image)) return;
            if (exec(List.of("docker", "image", "inspect", image), 20) != 0) {
                log.info("Pulling sandbox image {} (first run only, this can take a few minutes)...", image);
                if (exec(List.of("docker", "pull", image), 1800) != 0) throw new IOException("Could not pull Docker image " + image);
                log.info("Image {} is ready", image);
            }
            readyImages.add(image);
        }
    }

    private int exec(List<String> cmd, int timeoutSec) throws IOException, InterruptedException {
        Process p = new ProcessBuilder(cmd).redirectErrorStream(true).redirectOutput(ProcessBuilder.Redirect.DISCARD).start();
        if (!p.waitFor(timeoutSec, TimeUnit.SECONDS)) { p.destroyForcibly(); return -1; }
        return p.exitValue();
    }

    /** One-off container (used for compiling). */
    public SandboxResult run(Path mountDir, boolean readOnly, String image, List<String> command, Path stdinFile,
                             long timeoutMs, int memoryMb) throws IOException, InterruptedException {
        String name = "cj-" + UUID.randomUUID().toString().substring(0, 12);
        List<String> a = new ArrayList<>(List.of("docker", "run", "--rm", "-i", "--name", name));
        a.addAll(limits(memoryMb));
        a.addAll(List.of("-v", mountDir.toAbsolutePath() + ":/sandbox" + (readOnly ? ":ro" : ""), "-w", "/sandbox", image));
        a.addAll(command);
        return execute(a, stdinFile, timeoutMs, name);
    }

    /**
     * Starts ONE long-lived (max 10 min) container for a whole submission, so test cases do not each pay the
     * container start-up cost. Always call stopSession() in a finally block.
     */
    public String startSession(Path mountDir, String image, int memoryMb) throws IOException, InterruptedException {
        String name = "cj-" + UUID.randomUUID().toString().substring(0, 12);
        List<String> a = new ArrayList<>(List.of("docker", "run", "-d", "--name", name));
        a.addAll(limits(memoryMb));
        a.addAll(List.of("-v", mountDir.toAbsolutePath() + ":/sandbox:ro", "-w", "/sandbox", image, "sleep", "600"));
        Process p = new ProcessBuilder(a).redirectErrorStream(true).start();
        String out = new String(p.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!p.waitFor(60, TimeUnit.SECONDS) || p.exitValue() != 0) {
            killContainer(name);
            throw new IOException("Could not start the sandbox container: " + out.trim());
        }
        return name;
    }

    public void stopSession(String name) { killContainer(name); }

    /** Runs a command inside a running session container. */
    public SandboxResult exec(String session, List<String> command, Path stdinFile, long timeoutMs)
            throws IOException, InterruptedException {
        List<String> a = new ArrayList<>(List.of("docker", "exec", "-i", session));
        a.addAll(command);
        return execute(a, stdinFile, timeoutMs, session);
    }

    private static List<String> limits(int memoryMb) {
        return List.of("--network", "none", "--memory", memoryMb + "m", "--memory-swap", memoryMb + "m",
                "--cpus", "1", "--pids-limit", "256", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
                "--tmpfs", "/tmp:rw,size=64m", "-e", "HOME=/tmp");
    }

    private SandboxResult execute(List<String> args, Path stdinFile, long timeoutMs, String containerToKill)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(args).redirectInput(ProcessBuilder.Redirect.from(stdinFile.toFile()));
        long t0 = System.nanoTime();
        Process p = pb.start();
        Future<String> out = io.submit(() -> read(p.getInputStream(), STDOUT_CAP));
        Future<String> err = io.submit(() -> read(p.getErrorStream(), STDERR_CAP));

        boolean finished = p.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
        long elapsed = (System.nanoTime() - t0) / 1_000_000;
        if (!finished) {
            killContainer(containerToKill);
            p.destroyForcibly();
            p.waitFor(3, TimeUnit.SECONDS);
        }
        String so = "", se = "";
        try { so = out.get(3, TimeUnit.SECONDS); } catch (Exception ignored) { }
        try { se = err.get(3, TimeUnit.SECONDS); } catch (Exception ignored) { }
        int exit = finished ? p.exitValue() : -1;
        return new SandboxResult(exit, so, se, elapsed, !finished);
    }

    private void killContainer(String name) {
        try { exec(List.of("docker", "rm", "-f", name), 15); } catch (Exception e) { log.warn("Could not remove container {}", name); }
    }

    private static String read(InputStream in, int cap) {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        try (in) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                int room = cap - bo.size();
                if (room > 0) bo.write(buf, 0, Math.min(n, room)); // keep reading (and discarding) so the process never blocks
            }
        } catch (IOException ignored) { }
        return bo.toString(StandardCharsets.UTF_8);
    }
}
