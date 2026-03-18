/**
 * Voice Generation Service
 *
 * Priority order:
 *   1. MediaVoice Studio  (local, free — edge-tts / XTTS v2 via smart router)
 *   2. ElevenLabs direct  (cloud fallback if MediaVoice is unavailable)
 */

import { VoiceGenerationInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface VoiceGenerationResult {
  voice_url: string;
  file_key: string;
  duration_seconds: number;
  engine?: string;
}

// ── MediaVoice helpers ────────────────────────────────────────────────────────

const MEDIAVORICE_BASE = env.MEDIAVORICE_URL || 'http://localhost:8000';

async function isMediaVoiceRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${MEDIAVORICE_BASE}/`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Call MediaVoice /api/tts/smart (Form data) → fetch audio bytes.
 * Returns: audio Buffer (mp3)
 */
async function generateViaMediaVoice(
  text: string,
  voiceProfile?: string,
  language = 'en'
): Promise<{ buffer: Buffer; engine: string }> {
  // Build form data
  const form = new FormData();
  form.append('text', text);
  form.append('engine', 'auto');
  form.append('language', language);
  if (voiceProfile) form.append('voice_profile', voiceProfile);

  const smartRes = await fetch(`${MEDIAVORICE_BASE}/api/tts/smart`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!smartRes.ok) {
    const err = await smartRes.text();
    throw new Error(`MediaVoice TTS error: ${smartRes.status} — ${err}`);
  }

  const data = await smartRes.json() as { url: string; engine: string };

  // Fetch the actual audio file from MediaVoice static server
  const audioRes = await fetch(`${MEDIAVORICE_BASE}${data.url}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!audioRes.ok) throw new Error(`MediaVoice audio fetch failed: ${audioRes.status}`);

  return {
    buffer: Buffer.from(await audioRes.arrayBuffer()),
    engine: `mediavorice/${data.engine}`,
  };
}

// ── ElevenLabs fallback ───────────────────────────────────────────────────────

async function generateViaElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error: ${res.status} — ${err}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// ── Service ───────────────────────────────────────────────────────────────────

export class VoiceGenerationService {
  async generate(input: VoiceGenerationInput): Promise<VoiceGenerationResult> {
    const text = input.text.trim();
    if (!text) throw new Error('Empty text provided for voice generation');

    logger.info({ episode_id: input.episode_id, scene_id: input.scene_id }, 'Generating voice');

    let buffer: Buffer;
    let engine: string;

    // ── Stage 1: try MediaVoice (local, free) ──
    if (await isMediaVoiceRunning()) {
      try {
        const result = await generateViaMediaVoice(text, input.voice_id);
        buffer = result.buffer;
        engine = result.engine;
        logger.info({ episode_id: input.episode_id, engine }, 'Voice generated via MediaVoice');
      } catch (err) {
        logger.warn({ err }, 'MediaVoice failed — falling back to ElevenLabs');
        buffer = await generateViaElevenLabs(
          text,
          input.voice_id || env.ELEVENLABS_DEFAULT_VOICE_ID,
          env.ELEVENLABS_API_KEY
        );
        engine = 'elevenlabs-fallback';
      }
    } else {
      // ── Stage 2: ElevenLabs direct (cloud) ──
      logger.warn('MediaVoice not running — using ElevenLabs directly');
      buffer = await generateViaElevenLabs(
        text,
        input.voice_id || env.ELEVENLABS_DEFAULT_VOICE_ID,
        env.ELEVENLABS_API_KEY
      );
      engine = 'elevenlabs';
    }

    const fileKey = `episodes/${input.episode_id}/scenes/${input.scene_id}/voice.mp3`;
    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'audio/mpeg');

    // Estimate duration (~16KB per second for 128 kbps mp3)
    const estimatedDuration = Math.max(1, Math.round(buffer.byteLength / 16_000));

    logger.info(
      { episode_id: input.episode_id, file_key: fileKey, duration: estimatedDuration, engine },
      'Voice generated and uploaded'
    );

    return {
      voice_url: uploadedUrl,
      file_key: fileKey,
      duration_seconds: estimatedDuration,
      engine,
    };
  }

  /** List available voices from MediaVoice (edge-tts profiles), or ElevenLabs as fallback */
  async listVoices(): Promise<Array<{ id: string; name: string; description: string }>> {
    if (await isMediaVoiceRunning()) {
      try {
        const res = await fetch(`${MEDIAVORICE_BASE}/api/voices`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json() as { voices: Array<{ id: string; description: string; voice: string }> };
          return data.voices.map((v) => ({
            id: v.id,
            name: v.id.replace(/_/g, ' '),
            description: `${v.description} (${v.voice})`,
          }));
        }
      } catch {
        // fall through to ElevenLabs
      }
    }

    // ElevenLabs fallback
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY },
    });
    if (!res.ok) throw new Error(`ElevenLabs voices list failed: ${res.status}`);
    const data = await res.json() as {
      voices: Array<{ voice_id: string; name: string; description?: string }>;
    };
    return data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      description: v.description ?? '',
    }));
  }
}

export const voiceGenerationService = new VoiceGenerationService();
