// Simple utilities without Node.js dependencies
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (Date.now() - start >= ms) {
        resolve();
      } else {
        // Use setTimeout from global if available, otherwise busy wait
        if (typeof setTimeout !== 'undefined') {
          setTimeout(resolve, ms);
        } else {
          // Fallback for environments without setTimeout
          const end = Date.now() + ms;
          while (Date.now() < end) { /* busy wait */ }
          resolve();
        }
      }
    };
    check();
  });
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
