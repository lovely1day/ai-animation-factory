import { env } from './env';

const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';
const KIMI_MODEL = 'moonshot-v1-32k';

export function isKimiConfigured(): boolean {
  return !!env.KIMI_API_KEY;
}

async function kimiChat(messages: { role: string; content: string }[], jsonMode = false): Promise<string> {
  if (!env.KIMI_API_KEY) throw new Error('KIMI_API_KEY is not configured');

  const allMessages = jsonMode
    ? [{ role: 'system', content: 'You are a helpful assistant that responds only with valid JSON objects. Never include text, markdown, or explanation outside the JSON.' }, ...messages]
    : messages;

  const body: Record<string, any> = {
    model: KIMI_MODEL,
    messages: allMessages,
    temperature: 0.7,
    max_tokens: 4096,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.KIMI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kimi error ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '';
}

export async function kimiText(prompt: string): Promise<string> {
  return kimiChat([{ role: 'user', content: prompt }], false);
}

export async function kimiTextJSON(prompt: string): Promise<string> {
  return kimiChat([{ role: 'user', content: prompt }], true);
}
