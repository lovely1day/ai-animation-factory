import { VoiceGenerationInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface VoiceGenerationResult {
  voice_url: string;
  file_key: string;
  duration_seconds: number;
}

export class VoiceGenerationService {
  private readonly apiKey = env.ELEVENLABS_API_KEY;
  private readonly defaultVoiceId = env.ELEVENLABS_DEFAULT_VOICE_ID;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  async generate(input: VoiceGenerationInput): Promise<VoiceGenerationResult> {
    logger.info('Generating voice', {
      episode_id: input.episode_id,
      scene_id: input.scene_id,
    });

    const voiceId = input.voice_id || this.defaultVoiceId;
    const text = input.text.trim();

    if (!text) {
      throw new Error('Empty text provided for voice generation');
    }

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fileKey = `episodes/${input.episode_id}/scenes/${input.scene_id}/voice.mp3`;

    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'audio/mpeg');

    // Estimate duration from buffer size (rough approximation: ~16KB per second for 128kbps)
    const estimatedDuration = Math.max(1, Math.round(buffer.byteLength / 16000));

    logger.info('Voice generated and uploaded', {
      episode_id: input.episode_id,
      file_key: fileKey,
      duration: estimatedDuration,
    });

    return {
      voice_url: uploadedUrl,
      file_key: fileKey,
      duration_seconds: estimatedDuration,
    };
  }

  async listVoices(): Promise<Array<{ id: string; name: string; description: string }>> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    if (!response.ok) throw new Error(`ElevenLabs voices list failed: ${response.status}`);
    const data = await response.json() as { voices: Array<{ voice_id: string; name: string; description: string }> };
    return data.voices.map((v) => ({ id: v.voice_id, name: v.name, description: v.description }));
  }
}

export const voiceGenerationService = new VoiceGenerationService();
