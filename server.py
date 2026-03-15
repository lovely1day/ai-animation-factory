// apps/api/src/services/python/PythonService.ts
export class PythonService {
  private baseUrl = 'http://localhost:5000';

  async runAgent(agentName: string, data: any) {
    const res = await fetch(`${this.baseUrl}/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: agentName, data }),
    });
    return res.json();
  }

  async processVideo(videoData: any) {
    const res = await fetch(`${this.baseUrl}/video/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData),
    });
    return res.json();
  }
}