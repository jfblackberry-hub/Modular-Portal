export type EnvValue = string | undefined;

export type EnvSource = Record<string, EnvValue>;

export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface BaseConfig {
  appName: string;
  nodeEnv: AppEnvironment;
  port?: number;
}

function readRequired(source: EnvSource, key: string) {
  const value = source[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readOptionalNumber(source: EnvSource, key: string) {
  const value = source[key];

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
}

export function loadBaseConfig(source: EnvSource = process.env): BaseConfig {
  return {
    appName: readRequired(source, 'APP_NAME'),
    nodeEnv: (source.NODE_ENV as AppEnvironment | undefined) ?? 'development',
    port: readOptionalNumber(source, 'PORT')
  };
}

export function getEnv(source: EnvSource, key: string, fallback?: string) {
  return source[key] ?? fallback;
}
