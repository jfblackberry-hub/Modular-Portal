import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { readProcessEnv } from '@payer-portal/config';

import { createStructuredLogger } from '../observability/logger.js';
import type { EmailProvider } from './emailProvider.js';

const emailLogger = createStructuredLogger({
  observability: {
    capabilityId: 'platform.notifications',
    failureType: 'none',
    tenantId: 'platform'
  },
  serviceName: 'server'
});

function getDevLogPath() {
  const configuredPath = readProcessEnv('EMAIL_DEV_LOG_PATH');

  return configuredPath
    ? path.resolve(configuredPath)
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

    emailLogger.info('email outbound', {
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
