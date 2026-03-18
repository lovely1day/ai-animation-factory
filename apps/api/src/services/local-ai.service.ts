import axios from "axios";

export class LocalAIService {

  private ollamaUrl = "http://localhost:11434/api/generate";

  async generateScript(prompt: string) {
    const response = await axios.post(this.ollamaUrl, {
      model: "llama3",
      prompt: prompt,
      stream: false
    });

    return response.data.response;
  }

  async generatePrompt(sceneDescription: string) {
    const prompt = `
Convert the following scene description into a cinematic AI image prompt.

Scene:
${sceneDescription}

Style:
cinematic lighting, ultra detailed, animation film frame
`;

    const response = await axios.post(this.ollamaUrl, {
      model: "llama3",
      prompt: prompt,
      stream: false
    });

    return response.data.response;
  }

}