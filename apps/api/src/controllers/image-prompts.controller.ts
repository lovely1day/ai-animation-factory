import { Request, Response } from "express";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3";

interface Scene {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  dialogue: string;
  action: string;
  camera: string;
  imagePrompt: string;
}

interface ImagePromptCollection {
  workId: string;
  workTitle: string;
  scriptId: string;
  versionName: string;
  scenes: Scene[];
}

// توليد برومبتات صور محسّنة من السكربت
export async function generateImagePrompts(req: Request, res: Response) {
  try {
    const { scripts, model = DEFAULT_MODEL } = req.body;

    if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
      return res.status(400).json({ error: "At least one script is required" });
    }

    const collections: ImagePromptCollection[] = [];

    for (const scriptData of scripts) {
      const { workId, workTitle, scriptId, versionName, scenes: inputScenes } = scriptData;

      const enhancedScenes: Scene[] = [];

      for (const scene of inputScenes) {
        const prompt = `You are an expert AI Image Prompt Engineer specializing in animation and cinematic visuals.

Scene Information:
- Scene Number: ${scene.sceneNumber}
- Location: ${scene.location}
- Time of Day: ${scene.timeOfDay}
- Action: ${scene.action}
- Dialogue Context: ${scene.dialogue}
- Camera Angle: ${scene.camera}

Your task: Create a DETAILED image generation prompt for Stable Diffusion/ComfyUI.

The prompt should include:
1. Subject: Main characters/objects with detailed descriptions
2. Environment: Detailed setting description
3. Lighting: Specific lighting conditions (golden hour, dramatic shadows, soft ambient, etc.)
4. Camera: Shot type (close-up, wide, medium, aerial, etc.) and lens specifications
5. Style: Art style (Pixar, Disney, anime, realistic, etc.)
6. Quality tags: 8k, highly detailed, cinematic, masterpiece, etc.
7. Mood/Atmosphere: Emotional tone of the scene

Format your response as:

MAIN PROMPT: [Detailed description for image generation]

NEGATIVE PROMPT: [What to avoid]

COMFYUI SETTINGS:
- Sampler: [Recommended sampler]
- Steps: [Number of steps]
- CFG Scale: [Guidance scale]
- Resolution: [Recommended resolution]

Write the response in English as image generation prompts work best in English.`;

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data = await response.json() as { response: string };
        const generatedPrompt = data.response;

        enhancedScenes.push({
          sceneNumber: scene.sceneNumber,
          location: scene.location,
          timeOfDay: scene.timeOfDay,
          dialogue: scene.dialogue,
          action: scene.action,
          camera: scene.camera,
          imagePrompt: generatedPrompt,
        });
      }

      collections.push({
        workId,
        workTitle,
        scriptId,
        versionName,
        scenes: enhancedScenes,
      });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      collections,
      model,
    });
  } catch (error) {
    console.error("Error generating image prompts:", error);
    res.status(500).json({
      error: "Failed to generate image prompts",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
