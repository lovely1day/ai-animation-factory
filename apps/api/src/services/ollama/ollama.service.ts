/**
 * Ollama Warm Instance Service
 * 
 * Architecture: Start once → Reuse → Auto shutdown after idle
 * 
 * Previous: Start → Generate → Stop (per request)
 * Current:  Start once → Reuse → Auto shutdown after 2min idle
 */

import { spawn, ChildProcess } from "child_process";
import { logger } from "../../utils/logger";

const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const OLLAMA_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;

// Timeouts
const START_TIMEOUT = 60000; // 60 seconds to start
const POLL_INTERVAL = 1000; // 1 second polling
const IDLE_SHUTDOWN_MS = 2 * 60 * 1000; // 2 minutes idle before shutdown
const GENERATION_TIMEOUT = 300000; // 5 minutes for generation

// State management
let ollamaProcess: ChildProcess | null = null;
let isStarting = false;
let startPromise: Promise<void> | null = null;
let lastUsed = 0;
let shutdownTimer: NodeJS.Timeout | null = null;
let isShuttingDown = false;

/**
 * Check if Ollama server is ready
 */
async function isOllamaReady(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/version`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for Ollama to be ready with polling
 */
async function waitForOllamaReady(maxWaitMs: number = START_TIMEOUT): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    if (await isOllamaReady()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
  
  return false;
}

/**
 * Ensure Ollama is running (warm instance pattern)
 * - If running → return immediately (fast reuse)
 * - If starting → wait until ready
 * - Else → start new instance
 */
export async function ensureOllamaRunning(): Promise<void> {
  // Fast path: already running
  if (ollamaProcess && !ollamaProcess.killed && await isOllamaReady()) {
    console.log("[Ollama] reusing instance");
    lastUsed = Date.now();
    return;
  }

  // Another request is already starting it → wait for that
  if (isStarting && startPromise) {
    console.log("[Ollama] waiting for existing start...");
    await startPromise;
    return;
  }

  // Need to start
  console.log("[Ollama] starting...");
  isStarting = true;

  startPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      isStarting = false;
      startPromise = null;
      stopOllama().catch(() => {});
      reject(new Error(`Ollama failed to start within ${START_TIMEOUT}ms`));
    }, START_TIMEOUT);

    const cleanup = () => {
      clearTimeout(timeout);
      isStarting = false;
      startPromise = null;
    };

    try {
      // Check if already externally running
      isOllamaReady().then((ready) => {
        if (ready) {
          console.log("[Ollama] external instance detected, reusing");
          cleanup();
          lastUsed = Date.now();
          scheduleShutdown();
          resolve();
          return;
        }

        // Spawn Ollama process
        ollamaProcess = spawn("ollama", ["serve"], {
          detached: false,
          windowsHide: true,
          env: {
            ...process.env,
            OLLAMA_HOST: OLLAMA_HOST,
            OLLAMA_PORT: OLLAMA_PORT.toString(),
          },
        });

        // Handle process errors
        ollamaProcess.on("error", (error) => {
          cleanup();
          logger.error({ error: error.message }, "Ollama process error");
          reject(new Error(`Failed to start Ollama: ${error.message}`));
        });

        // Handle unexpected exit
        ollamaProcess.on("exit", (code, signal) => {
          if (!isShuttingDown && code !== 0 && code !== null) {
            logger.error({ code, signal }, "Ollama process exited unexpectedly");
          }
          ollamaProcess = null;
        });

        // Wait for Ollama to be ready
        waitForOllamaReady()
          .then((ready) => {
            if (ready) {
              console.log("[Ollama] ready");
              cleanup();
              lastUsed = Date.now();
              scheduleShutdown();
              resolve();
            } else {
              cleanup();
              stopOllama().catch(() => {});
              reject(new Error("Ollama failed to become ready"));
            }
          })
          .catch((error) => {
            cleanup();
            stopOllama().catch(() => {});
            reject(error);
          });
      });

    } catch (error: any) {
      cleanup();
      reject(new Error(`Failed to spawn Ollama: ${error.message}`));
    }
  });

  await startPromise;
}

/**
 * Schedule automatic shutdown after idle period
 * Clears existing timer and sets new one
 */
function scheduleShutdown(): void {
  // Clear existing timer
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
    shutdownTimer = null;
  }

  // Set new shutdown timer
  shutdownTimer = setTimeout(() => {
    const idleTime = Date.now() - lastUsed;
    
    // Double-check still idle (race condition protection)
    if (idleTime >= IDLE_SHUTDOWN_MS) {
      console.log("[Ollama] shutting down (idle)");
      stopOllama().catch((error) => {
        logger.error({ error: error.message }, "Failed to shutdown idle Ollama");
      });
    } else {
      // Was used recently, reschedule
      scheduleShutdown();
    }
  }, IDLE_SHUTDOWN_MS);
}

/**
 * Stop Ollama server
 * Safe shutdown with cleanup
 */
export async function stopOllama(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("[Ollama] stopping...");
  logger.info("Stopping Ollama server");

  // Clear shutdown timer
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
    shutdownTimer = null;
  }

  try {
    // Try graceful process termination first
    if (ollamaProcess && !ollamaProcess.killed) {
      ollamaProcess.kill("SIGTERM");
      
      // Wait briefly for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      if (!ollamaProcess.killed) {
        ollamaProcess.kill("SIGKILL");
      }
    }

    // Force kill any remaining ollama.exe processes (Windows)
    if (process.platform === "win32") {
      await new Promise<void>((resolve) => {
        const killProcess = spawn("taskkill", ["/IM", "ollama.exe", "/F"], {
          windowsHide: true,
          detached: false,
        });
        
        killProcess.on("close", () => resolve());
        killProcess.on("error", () => resolve());
        setTimeout(() => resolve(), 3000);
      });
    }

    // Wait to ensure port is released
    let attempts = 0;
    while (await isOllamaReady() && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    console.log("[Ollama] stopped");
    logger.info("Ollama server stopped");

  } catch (error: any) {
    logger.error({ error: error.message }, "Error stopping Ollama");
  } finally {
    ollamaProcess = null;
    isShuttingDown = false;
    isStarting = false;
    startPromise = null;
    lastUsed = 0;
  }
}

/**
 * Generate script using Ollama (warm instance)
 * 
 * Flow:
 * 1. Ensure Ollama is running (reuse if warm)
 * 2. Update lastUsed timestamp
 * 3. Send generation request
 * 4. Schedule shutdown
 * 5. Return result
 */
export interface GenerateResult {
  success: boolean;
  text?: string;
  error?: string;
}

export async function generateScript(
  prompt: string, 
  model: string = "llama3"
): Promise<GenerateResult> {
  try {
    // Step 1: Ensure Ollama is running (fast reuse if warm)
    await ensureOllamaRunning();

    // Step 2: Update usage timestamp
    lastUsed = Date.now();

    // Step 3: Send generation request
    logger.info({ model, promptLength: prompt.length }, "Sending generation request");

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { response?: string; error?: string };

    if (data.error) {
      throw new Error(`Ollama generation error: ${data.error}`);
    }

    const generatedText = data.response || "";
    
    logger.info({ 
      model, 
      inputLength: prompt.length,
      outputLength: generatedText.length 
    }, "Script generated");

    // Step 4: Schedule shutdown after idle
    scheduleShutdown();

    // Step 5: Return result
    return {
      success: true,
      text: generatedText,
    };

  } catch (error: any) {
    logger.error({ error: error.message }, "Script generation failed");
    
    // Still schedule shutdown on error
    scheduleShutdown();
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check Ollama status without affecting state
 */
export async function checkOllamaStatus(): Promise<{
  running: boolean;
  warm: boolean;
  idleTime?: number;
  version?: string;
}> {
  const ready = await isOllamaReady();
  
  if (!ready) {
    return { running: false, warm: false };
  }

  try {
    const response = await fetch(`${OLLAMA_URL}/api/version`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json() as { version?: string };
    
    return {
      running: true,
      warm: ollamaProcess !== null,
      idleTime: lastUsed ? Date.now() - lastUsed : undefined,
      version: data.version,
    };
  } catch {
    return { running: true, warm: ollamaProcess !== null };
  }
}

/**
 * Force immediate shutdown (for manual control)
 */
export async function forceShutdown(): Promise<void> {
  console.log("[Ollama] force shutdown requested");
  await stopOllama();
}

// ============================================
// PROCESS LIFECYCLE MANAGEMENT
// ============================================

/**
 * Cleanup on process exit
 */
process.on("exit", () => {
  if (ollamaProcess && !ollamaProcess.killed) {
    ollamaProcess.kill("SIGKILL");
  }
});

process.on("SIGINT", async () => {
  console.log("\n[Ollama] SIGINT received, cleaning up...");
  await stopOllama();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Ollama] SIGTERM received, cleaning up...");
  await stopOllama();
  process.exit(0);
});

// Handle uncaught exceptions to prevent orphan processes
process.on("uncaughtException", async (error) => {
  logger.error({ error }, "Uncaught exception, shutting down Ollama");
  await stopOllama().catch(() => {});
  process.exit(1);
});
