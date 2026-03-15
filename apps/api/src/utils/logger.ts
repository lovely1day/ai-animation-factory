import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV
  }
});

interface RequestInfo {
  method: string;
  url: string;
  get: (header: string) => string | undefined;
}

interface ResponseInfo {
  statusCode: number;
}

export function logRequest(req: RequestInfo, res: ResponseInfo, duration: number) {
  logger.info({
    req: {
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent')
    },
    res: {
      statusCode: res.statusCode
    },
    duration
  }, 'Request completed');
}
