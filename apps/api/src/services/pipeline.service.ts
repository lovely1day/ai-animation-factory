import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { supabase } from "../config/supabase";
import { logger } from "../utils/logger";

// Lazy queue getters — created only on first use so the server can start without Redis.
let _scriptQueue:    Queue | null = null;
let _voiceQueue:     Queue | null = null;
let _musicQueue:     Queue | null = null;
let _imageQueue:     Queue | null = null;
let _animationQueue: Queue | null = null;
let _assemblyQueue:  Queue | null = null;
let _subtitleQueue:  Queue | null = null;

const q = {
  script:    () => (_scriptQueue    ??= new Queue("script",    { connection: redisConnection })),
  voice:     () => (_voiceQueue     ??= new Queue("voice",     { connection: redisConnection })),
  music:     () => (_musicQueue     ??= new Queue("music",     { connection: redisConnection })),
  image:     () => (_imageQueue     ??= new Queue("image",     { connection: redisConnection })),
  animation: () => (_animationQueue ??= new Queue("animation", { connection: redisConnection })),
  assembly:  () => (_assemblyQueue  ??= new Queue("assembly",  { connection: redisConnection })),
  subtitle:  () => (_subtitleQueue  ??= new Queue("subtitle",  { connection: redisConnection })),
};

export class PipelineService {
  /**
   * Kick off the full pipeline for a new episode.
   * Dispatches a script job — the workers chain the rest automatically.
   */
  static async run(episode: {
    id: string;
    title: string;
    description?: string;
    idea?: string;
    genre?: string;
    target_audience?: string;
    approval_steps?: string[];
    scene_count?: number;
  }): Promise<void> {
    logger.info({ episode_id: episode.id }, "Pipeline: starting");

    await supabase
      .from("episodes")
      .update({
        status: "generating",
        workflow_step: "script",
        workflow_status: "processing",
        workflow_progress: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", episode.id);

    await q.script().add("write-script", episode, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });

    logger.info({ episode_id: episode.id }, "Pipeline: script job dispatched");
  }

  /**
   * Dispatch image generation jobs for all scenes of an episode.
   */
  static async dispatchImages(episodeId: string): Promise<void> {
    const { data: scenes, error } = await supabase
      .from("scenes")
      .select("id, scene_number, visual_prompt, dialogue, narration, duration_seconds")
      .eq("episode_id", episodeId)
      .order("scene_number");

    if (error || !scenes || scenes.length === 0) {
      logger.warn({ episode_id: episodeId }, "No scenes found for image dispatch");
      return;
    }

    await supabase
      .from("episodes")
      .update({ workflow_step: "images", workflow_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", episodeId);

    for (const scene of scenes) {
      await q.image().add("generate-image", {
        episode_id: episodeId,
        scene_number: scene.scene_number,
        visual_prompt: scene.visual_prompt,
        dialogue: scene.dialogue,
        narration: scene.narration,
        genre: "",
        target_audience: "",
      }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    }

    logger.info({ episode_id: episodeId, count: scenes.length }, "Pipeline: image jobs dispatched");
  }

  /**
   * Dispatch animation jobs for all approved scenes of an episode.
   */
  static async dispatchAnimations(episodeId: string): Promise<void> {
    const { data: scenes, error } = await supabase
      .from("scenes")
      .select("id, scene_number, image_url, visual_prompt, duration_seconds")
      .eq("episode_id", episodeId)
      .order("scene_number");

    if (error || !scenes || scenes.length === 0) {
      logger.warn({ episode_id: episodeId }, "No scenes found for animation dispatch");
      return;
    }

    await supabase
      .from("episodes")
      .update({ workflow_step: "animation", workflow_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", episodeId);

    for (const scene of scenes) {
      await q.animation().add("animate-scene", {
        episode_id: episodeId,
        scene_id: scene.id,
        scene_number: scene.scene_number,
        image_url: scene.image_url,
        prompt: scene.visual_prompt,
        duration_seconds: scene.duration_seconds || 8,
      }, {
        attempts: 2,
        backoff: { type: "fixed", delay: 10000 },
      });
    }

    logger.info({ episode_id: episodeId, count: scenes.length }, "Pipeline: animation jobs dispatched");
  }

  /**
   * Dispatch voice jobs for all scenes with dialogue/narration.
   */
  static async dispatchVoice(episodeId: string): Promise<void> {
    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, scene_number, dialogue, narration")
      .eq("episode_id", episodeId)
      .order("scene_number");

    if (!scenes) return;

    for (const scene of scenes) {
      const text = scene.dialogue || scene.narration;
      if (text?.trim()) {
        await q.voice().add("generate-voice", {
          episode_id: episodeId,
          scene_id: scene.id,
          text,
        }, { attempts: 3, backoff: { type: "exponential", delay: 3000 } });
      }
    }

    logger.info({ episode_id: episodeId }, "Pipeline: voice jobs dispatched");
  }

  /**
   * Dispatch music job for an episode.
   */
  static async dispatchMusic(episodeId: string, genre: string, durationSeconds: number): Promise<void> {
    await q.music().add("generate-music", {
      episode_id: episodeId,
      genre,
      mood: genre,
      duration: durationSeconds,
    }, { attempts: 2 });

    logger.info({ episode_id: episodeId }, "Pipeline: music job dispatched");
  }

  /**
   * Dispatch assembly job directly (used after manual approval).
   */
  static async dispatchAssembly(episodeId: string): Promise<void> {
    const { data: scenes } = await supabase
      .from("scenes")
      .select("id, scene_number, animation_url, image_url, voice_url, duration_seconds")
      .eq("episode_id", episodeId)
      .order("scene_number");

    const { data: episode } = await supabase
      .from("episodes")
      .select("music_url")
      .eq("id", episodeId)
      .single();

    await q.assembly().add("assemble-episode", {
      episode_id: episodeId,
      scenes: scenes || [],
      music_url: episode?.music_url || "",
    });

    logger.info({ episode_id: episodeId }, "Pipeline: assembly job dispatched");
  }

  /**
   * Dispatch subtitle job directly.
   */
  static async dispatchSubtitles(episodeId: string): Promise<void> {
    await q.subtitle().add("generate-subtitles", { episode_id: episodeId, scenes: [] });
    logger.info({ episode_id: episodeId }, "Pipeline: subtitle job dispatched");
  }
}
