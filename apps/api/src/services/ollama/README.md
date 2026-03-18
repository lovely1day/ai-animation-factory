# Ollama Auto-Start Service

Automatically manages Ollama lifecycle: starts when needed, stops after completion.

## Usage

### Generate Script (Auto-managed)

```typescript
import { generateScript } from "./services/ollama";

const result = await generateScript(
  "Write a 4-scene animation script about a robot learning to paint",
  "llama3"
);

if (result.success) {
  console.log("Generated:", result.text);
} else {
  console.error("Failed:", result.error);
}
```

### Manual Control

```typescript
import { startOllama, stopOllama, checkOllamaStatus } from "./services/ollama";

// Check if running
const status = await checkOllamaStatus();
console.log(status.running); // true/false

// Start manually
await startOllama();

// ... do work ...

// Stop manually
await stopOllama();
```

## API

### `generateScript(prompt, model?)`

Main function - handles full lifecycle automatically.

- **prompt**: Text generation prompt
- **model**: Model name (default: "llama3")
- **Returns**: `{ success, text?, error? }`

### `startOllama()`

Starts Ollama server and waits until ready.

- Polls `/api/version` every 1 second
- Timeout: 60 seconds
- Throws on failure

### `stopOllama()`

Stops Ollama server gracefully, then forcefully if needed.

- Sends SIGTERM first
- Falls back to SIGKILL
- Windows: uses `taskkill /IM ollama.exe /F`

### `checkOllamaStatus()`

Check if Ollama is running without starting it.

## Safety Features

1. **Timeout Protection**: 60s start timeout, 5min generation timeout
2. **Cleanup Guarantee**: `finally` block ensures stop is called
3. **Process Management**: Tracks spawned process, kills on exit
4. **Port Release**: Waits for port to be released after stop
5. **Duplicate Prevention**: Checks if already running before starting

## Error Handling

```typescript
try {
  const result = await generateScript(prompt);
  // result.success indicates success/failure
  // result.error contains message on failure
} catch (error) {
  // Unexpected errors (should not happen due to internal handling)
}
```
