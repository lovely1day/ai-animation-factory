# Ollama Warm Instance Architecture

## Overview

Upgraded from **per-request start/stop** to **warm instance with auto-shutdown**.

## Comparison

| Aspect | Old (Per-Request) | New (Warm Instance) |
|--------|-------------------|---------------------|
| **First Request** | Start → Generate → Stop (60s+) | Start → Generate → Keep Warm |
| **Second Request** | Start → Generate → Stop (60s+) | **Reuse** (instant) |
| **Idle Behavior** | Always stopped | Auto-shutdown after 2min |
| **Memory Usage** | Low (process stops) | Medium (process stays) |
| **Response Time** | Slow (60s+ startup) | **Fast** (instant reuse) |

## State Management

```typescript
let ollamaProcess: ChildProcess | null = null;  // Running process
let isStarting = false;                          // Prevent duplicate spawn
let startPromise: Promise<void> | null = null;   // Share start between requests
let lastUsed = 0;                                // Timestamp for idle check
let shutdownTimer: NodeJS.Timeout | null = null; // Auto-shutdown timer
```

## Flow Diagram

### First Request

```
User ──► generateScript()
           │
           ▼
    ensureOllamaRunning()
           │
           ├──► isRunning? ──No──► isStarting? ──No──► spawn()
           │       │                      │
           │      Yes                     Yes
           │       │                      │
           │       ▼                      ▼
           │    return              wait for startPromise
           │                          │
           ▼                          ▼
    poll /api/version ◄──────────────┘
           │
           ▼
    console.log("[Ollama] ready")
    lastUsed = Date.now()
    scheduleShutdown() ──► setTimeout(2min)
           │
           ▼
    POST /api/generate
           │
           ▼
    scheduleShutdown() // reset timer
    return result
```

### Second Request (Within 2 Minutes)

```
User ──► generateScript()
           │
           ▼
    ensureOllamaRunning()
           │
           ├──► isRunning? ──Yes──► console.log("[Ollama] reusing instance")
           │                            │
           │◄───────────────────────────┘
           │
           ▼
    lastUsed = Date.now() // update timestamp
           │
           ▼
    POST /api/generate (instant, no startup delay!)
           │
           ▼
    scheduleShutdown() // reset timer
    return result
```

### Auto-Shutdown (After 2 Min Idle)

```
scheduleShutdown()
    │
    ▼
setTimeout(2min)
    │
    ▼
if (Date.now() - lastUsed >= 2min)
    │
    ▼
console.log("[Ollama] shutting down (idle)")
stopOllama()
    │
    ▼
ollamaProcess = null
```

## API Compatibility

### Existing Code (Still Works)

```typescript
import { generateScript } from "./services/ollama";

const result = await generateScript(prompt, model);
```

### New Capabilities

```typescript
import { 
  ensureOllamaRunning,  // Pre-warm for faster response
  checkOllamaStatus,     // Check if running/warm
  forceShutdown,         // Manual shutdown
  stopOllama            // Legacy, still works
} from "./services/ollama";

// Pre-warm before user requests
await ensureOllamaRunning();

// Check status
const status = await checkOllamaStatus();
console.log(status);
// { running: true, warm: true, idleTime: 30000, version: "0.3.0" }

// Force shutdown
await forceShutdown();
```

## Logging Output

```
[Ollama] starting...          # First request
[Ollama] ready                # Startup complete
[Ollama] reusing instance     # Second request (fast!)
[Ollama] shutting down (idle) # After 2min idle
[Ollama] stopped              # Cleanup complete
```

## Safety Features

1. **Duplicate Spawn Prevention**: `isStarting` flag + `startPromise`
2. **Concurrent Request Handling**: Multiple requests share the same startup
3. **Race Condition Protection**: Double-check idle time before shutdown
4. **Orphan Prevention**: SIGINT/SIGTERM/exit handlers
5. **Port Conflict**: Checks for external Ollama instances
6. **Force Kill Fallback**: SIGTERM → SIGKILL → taskkill

## Configuration

```typescript
const IDLE_SHUTDOWN_MS = 2 * 60 * 1000;  // 2 minutes
const START_TIMEOUT = 60000;              // 60 seconds
const GENERATION_TIMEOUT = 300000;        // 5 minutes
```

## Testing

### Test 1: First Request
```typescript
const start = Date.now();
await generateScript("test prompt");
console.log(`First request: ${Date.now() - start}ms`);
// Expected: ~60000ms (startup time)
```

### Test 2: Immediate Reuse
```typescript
const start = Date.now();
await generateScript("test prompt 2");
console.log(`Second request: ${Date.now() - start}ms`);
// Expected: ~1000ms (no startup, just generation)
```

### Test 3: Idle Restart
```typescript
await generateScript("test");  // Start
await new Promise(r => setTimeout(r, 130000)); // Wait 2min+
await generateScript("test 2"); // Should restart
```
