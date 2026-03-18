/**
 * Ollama Warm Instance Service
 * 
 * Architecture: Start once → Reuse → Auto shutdown after 2min idle
 */

export {
  ensureOllamaRunning,
  stopOllama,
  forceShutdown,
  generateScript,
  checkOllamaStatus,
  type GenerateResult,
} from "./ollama.service";
