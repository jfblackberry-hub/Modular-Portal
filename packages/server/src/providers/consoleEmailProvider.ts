import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { EmailProvider } from './emailProvider.js';

function getDevLogPath() {
  return process.env.EMAIL_DEV_LOG_PATH
    ? path.resolve(process.env.EMAIL_DEV_LOG_PATH)
    : path.resolve(process.cwd(), '.local', 'email-dev.log');
}

export const consoleEmailProvider: EmailProvider = {
  async sendEmail(to, subject, body) {
    const payload = [
      `[${new Date().toISOString()}]`,
      `to=${to}`,
      `subject=${subject}`,
      'body<<',
      body,
      '>>',
      ''
    ].join('\n');

    console.log('[email] outbound', {
      to,
      subject
    });

    const logPath = getDevLogPath();
    await mkdir(path.dirname(logPath), { recursive: true });
    await appendFile(logPath, `${payload}\n`, 'utf8');
  }
};

export function getConsoleEmailLogPath() {
  return getDevLogPath();
}
