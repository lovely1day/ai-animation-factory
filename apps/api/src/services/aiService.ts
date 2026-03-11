// Legacy demo service — kept for backward compatibility.
// Production logic lives in the individual service files (script-writer, image-generation, etc.)

export interface ProjectData {
  id: string;
  title: string;
  idea: string;
  genre: string;
  type: string;
  language: 'ar' | 'en';
}

export interface ScriptScene {
  sceneNumber: number;
  description: string;
  dialogue: string;
  cameraAngle: string;
  duration: number;
}

export interface GeneratedContent {
  script: {
    title: string;
    scenes: ScriptScene[];
    totalDuration: number;
  };
  images: string[];
  audio: string[];
  video: string | null;
}

export class AIService {
  async generateScript(project: ProjectData): Promise<GeneratedContent['script']> {
    console.log(`Generating script for: ${project.title}`);

    const scenes: ScriptScene[] = [];
    for (let i = 1; i <= 5; i++) {
      scenes.push({
        sceneNumber: i,
        description:
          project.language === 'ar'
            ? `\u0645\u0634\u0647\u062F ${i}: ${project.idea.substring(0, 50)}...`
            : `Scene ${i}: ${project.idea.substring(0, 50)}...`,
        dialogue:
          project.language === 'ar'
            ? '\u0645\u0631\u062D\u0628\u0627\u064B! \u0647\u0630\u0627 \u0645\u0634\u0647\u062F \u062A\u062C\u0631\u064A\u0628\u064A.'
            : 'Hello! This is a demo scene.',
        cameraAngle:
          project.language === 'ar' ? '\u0644\u0642\u0637\u0629 \u0648\u0627\u0633\u0639\u0629' : 'Wide shot',
        duration: 10 + i * 2,
      });
    }

    return {
      title: project.title,
      scenes,
      totalDuration: scenes.reduce((acc, s) => acc + s.duration, 0),
    };
  }

  async generateImages(
    project: ProjectData,
    script: GeneratedContent['script']
  ): Promise<string[]> {
    console.log(`Generating images for: ${project.title}`);
    const images: string[] = [];
    for (let i = 0; i < script.scenes.length; i++) {
      images.push(`https://picsum.photos/1024/1024?random=${project.id}-${i}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return images;
  }

  async generateAudio(
    project: ProjectData,
    script: GeneratedContent['script']
  ): Promise<string[]> {
    console.log(`Generating audio for: ${project.title}`);
    const audio: string[] = [];
    for (let i = 0; i < script.scenes.length; i++) {
      audio.push(`https://storage.example.com/audio/${project.id}-${i}.mp3`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return audio;
  }

  async generateVideo(
    project: ProjectData,
    _images: string[],
    _audio: string[]
  ): Promise<string> {
    console.log(`Generating video for: ${project.title}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return `https://storage.example.com/videos/${project.id}.mp4`;
  }

  async processProject(project: ProjectData): Promise<GeneratedContent> {
    const result: GeneratedContent = {
      script: { title: '', scenes: [], totalDuration: 0 },
      images: [],
      audio: [],
      video: null,
    };
    try {
      result.script = await this.generateScript(project);
      result.images = await this.generateImages(project, result.script);
      result.audio = await this.generateAudio(project, result.script);
      result.video = await this.generateVideo(project, result.images, result.audio);
    } catch (error) {
      console.error('processProject error:', error);
    }
    return result;
  }
}

export const aiService = new AIService();
