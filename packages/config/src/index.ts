export type EnvValue = string | undefined;

export type EnvSource = Record<string, EnvValue>;

export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface BaseConfig {
  appName: string;
  nodeEnv: AppEnvironment;
  port?: number;
}

export interface RuntimeModel {
  apiBaseUrl: string;
  host: string;
  nodeEnv: AppEnvironment;
  ports: {
    adminConsole: number;
    api: number;
    apiGateway: number;
    portalWeb: number;
    postgres: number;
  };
  origins: {
    adminConsolePublic: string;
    apiInternal: string;
    apiGatewayPublic: string;
    apiPublic: string;
    portalPublic: string;
  };
  serviceEndpoints: ServiceEndpoints;
}

export interface ServiceEndpoints {
  admin: string;
  api: string;
  auth: string;
  portal: string;
}

export interface SharedSecretsConfig {
  adminConsoleSession: string;
  apiAuthToken: string;
  apiGatewayJwt: string;
  portalSession: string;
  session: string;
}

export interface PlatformConfig extends RuntimeModel {
  security: ServiceSecurityConfig;
  secrets: SharedSecretsConfig;
}

export interface NextRuntimeConfig {
  distDir: string;
}

export interface ApiServiceConfig extends BaseConfig {
  apiBaseUrl: string;
  apiAuthTokenSecret: string;
  databaseUrl: string;
  host: string;
  nodeEnv: AppEnvironment;
  observability: ObservabilityConfig;
  portalCatalogDatabaseUrl?: string;
  publicOrigin: string;
  runtimeModel: RuntimeModel;
  security: ServiceSecurityConfig;
  serviceEndpoints: ServiceEndpoints;
}

export interface PortalWebServiceConfig extends BaseConfig {
  apiBaseUrl: string;
  host: string;
  publicOrigin: string;
  portalSessionSecret: string;
  runtimeModel: RuntimeModel;
  security: ServiceSecurityConfig;
  serviceEndpoints: ServiceEndpoints;
}

export interface AdminConsoleServiceConfig extends BaseConfig {
  apiBaseUrl: string;
  defaultAdminUserId: string;
  host: string;
  publicOrigin: string;
  runtimeModel: RuntimeModel;
  serviceEndpoints: ServiceEndpoints;
  sessionSecret: string;
  security: ServiceSecurityConfig;
}

export interface JobWorkerServiceConfig extends BaseConfig {
  databaseUrl: string;
  jobWorkerPollIntervalMs: number;
  nodeEnv: AppEnvironment;
  observability: ObservabilityConfig;
  runtimeModel: RuntimeModel;
}

export interface PortalSessionConfig {
  nodeEnv: AppEnvironment;
  portalSessionSecret: string;
  security: ServiceSecurityConfig;
}

export interface ApiGatewayConfig extends BaseConfig {
  apiBaseUrl: string;
  apiGatewayJwtSecret: string;
  host: string;
  jwtTtlSeconds: number;
  publicOrigin: string;
  runtimeModel: RuntimeModel;
  serviceEndpoints: ServiceEndpoints;
  databaseUrl?: string;
}

export type StorageProvider = 'local' | 's3';

export interface StorageConfig {
  bucket?: string;
  localBackupDir: string;
  localPublicAssetBasePath: string;
  localPublicAssetDir: string;
  localStorageDir: string;
  provider: StorageProvider;
  region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
}

export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace';

export interface ServiceSecurityConfig {
  allowInsecurePublicOrigins: boolean;
  portalSessionCookieDomain?: string;
  portalSessionCookieSameSite: 'lax' | 'strict' | 'none';
  secureCookies: boolean;
  trustProxy: boolean;
}

export interface ObservabilityConfig {
  logLevel: LogLevel;
  prometheusHost: string;
  prometheusPath: string;
  prometheusPort: number;
  serviceName: string;
}

const DEFAULT_PORTS = {
  adminConsole: 3003,
  api: 3002,
  apiGateway: 3010,
  portalWeb: 3000,
  postgres: 5432
} as const;

const PORTAL_PUBLIC_ORIGIN_KEYS = [
  'PORTAL_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_PORTAL_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_PORTAL_BASE_URL'
] as const;

const ADMIN_PUBLIC_ORIGIN_KEYS = [
  'ADMIN_PUBLIC_ORIGIN',
  'ADMIN_CONSOLE_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_ADMIN_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_ADMIN_CONSOLE_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_ADMIN_CONSOLE_URL'
] as const;

const API_PUBLIC_ORIGIN_KEYS = [
  'API_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_API_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_API_BASE_URL'
] as const;

const API_INTERNAL_ORIGIN_KEYS = [
  'API_INTERNAL_ORIGIN',
  'API_BASE_URL',
  ...API_PUBLIC_ORIGIN_KEYS
] as const;

const SESSION_SECRET_KEYS = ['SESSION_SECRET'] as const;

function shouldSkipRuntimeConfigValidation(source: EnvSource) {
  return readOptionalBoolean(source, 'SKIP_RUNTIME_CONFIG_VALIDATION') === true;
}

function shouldRequireExplicitRuntimeConfig(source: EnvSource) {
  const nodeEnv = normalizeNodeEnv(source.NODE_ENV);
  return !isDevelopmentLike(nodeEnv) && !shouldSkipRuntimeConfigValidation(source);
}

function readFirstDefined(source: EnvSource, keys: string[]) {
  for (const key of keys) {
    const value = source[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function hasAnyValue(source: EnvSource, keys: readonly string[]) {
  return readFirstDefined(source, [...keys]) !== undefined;
}

function normalizeNodeEnv(value: string | undefined): AppEnvironment {
  if (
    value === 'development' ||
    value === 'test' ||
    value === 'staging' ||
    value === 'production'
  ) {
    return value;
  }

  return 'development';
}

function isDevelopmentLike(nodeEnv: AppEnvironment) {
  return nodeEnv === 'development' || nodeEnv === 'test';
}

function readRequired(source: EnvSource, key: string) {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readOptionalBoolean(source: EnvSource, key: string) {
  const value = source[key]?.trim().toLowerCase();

  if (!value) {
    return undefined;
  }

  if (['1', 'true', 'yes', 'on'].includes(value)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(value)) {
    return false;
  }

  throw new Error(`Environment variable ${key} must be a boolean`);
}

function readOptionalNumber(source: EnvSource, key: string) {
  const value = source[key]?.trim();

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
}

function readNumberWithFallback(source: EnvSource, keys: string[], fallback: number) {
  for (const key of keys) {
    const parsed = readOptionalNumber(source, key);

    if (parsed !== undefined) {
      return parsed;
    }
  }

  return fallback;
}

function assertValidUrl(key: string, value: string) {
  try {
    const parsed = new URL(value);

    if (!parsed.protocol || !parsed.host) {
      throw new Error('missing protocol or host');
    }
  } catch {
    throw new Error(
      `Environment variable ${key} must be an absolute URL. Received "${value}".`
    );
  }
}

function assertHttpsUrl(key: string, value: string) {
  const parsed = new URL(value);

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Environment variable ${key} must use https outside development/test. Received "${value}".`
    );
  }
}

function isCookieDomainEligible(hostname: string) {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return false;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return false;
  }

  return hostname.includes('.');
}

function readLogLevel(source: EnvSource) {
  const rawLevel = source.LOG_LEVEL?.trim().toLowerCase();

  switch (rawLevel) {
    case 'fatal':
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
    case 'trace':
      return rawLevel;
    case undefined:
    case '':
      return 'info';
    default:
      throw new Error(`Environment variable LOG_LEVEL must be a supported log level`);
  }
}

function readUrlWithFallback(
  source: EnvSource,
  keys: string[],
  fallback: string,
  options: {
    requiredInNonDevelopment?: boolean;
  } = {}
) {
  const resolved = readFirstDefined(source, keys);
  const firstKey = keys[0] ?? 'unknown';

  if (!resolved) {
    if (options.requiredInNonDevelopment) {
      const nodeEnv = normalizeNodeEnv(source.NODE_ENV);

      if (!isDevelopmentLike(nodeEnv)) {
        throw new Error(
          `Missing required environment variable: ${firstKey}. Set ${firstKey} for ${nodeEnv} deployments.`
        );
      }
    }

    assertValidUrl(firstKey, fallback);
    return fallback;
  }

  assertValidUrl(firstKey, resolved);
  return resolved;
}

function readServicePublicOrigin(
  source: EnvSource,
  keys: string[],
  fallback: string
) {
  return readUrlWithFallback(source, [...keys, 'PUBLIC_ORIGIN'], fallback, {
    requiredInNonDevelopment:
      !isDevelopmentLike(normalizeNodeEnv(source.NODE_ENV)) &&
      !shouldSkipRuntimeConfigValidation(source)
  });
}

function validateRequiredRuntimeConfig(source: EnvSource) {
  if (!shouldRequireExplicitRuntimeConfig(source)) {
    return;
  }

  if (!hasAnyValue(source, PORTAL_PUBLIC_ORIGIN_KEYS)) {
    throw new Error(
      'Missing required environment variable: PORTAL_PUBLIC_ORIGIN. Set PORTAL_PUBLIC_ORIGIN outside development/test.'
    );
  }

  if (!hasAnyValue(source, ADMIN_PUBLIC_ORIGIN_KEYS)) {
    throw new Error(
      'Missing required environment variable: ADMIN_PUBLIC_ORIGIN. Set ADMIN_PUBLIC_ORIGIN outside development/test.'
    );
  }

  if (!hasAnyValue(source, SESSION_SECRET_KEYS)) {
    throw new Error(
      'Missing required environment variable: SESSION_SECRET. Set SESSION_SECRET outside development/test.'
    );
  }
}

function validateFrontendServiceConfig(
  source: EnvSource,
  options: {
    publicOriginKeys: string[];
  }
) {
  if (!shouldRequireExplicitRuntimeConfig(source)) {
    return;
  }

  if (!hasAnyValue(source, options.publicOriginKeys)) {
    throw new Error(
      `Missing required environment variable: ${options.publicOriginKeys[0]}. Set ${options.publicOriginKeys[0]} outside development/test.`
    );
  }
}

function createDevelopmentSecret(source: EnvSource, namespace: string) {
  const appName = source.APP_NAME?.trim() || 'payer-portal';
  return `${appName}.${namespace}.development-secret`;
}

function readServiceSecret(
  source: EnvSource,
  keys: string[],
  namespace: string
) {
  const value = readFirstDefined(source, keys);
  const nodeEnv = normalizeNodeEnv(source.NODE_ENV);

  if (value) {
    return value;
  }

  if (isDevelopmentLike(nodeEnv)) {
    return createDevelopmentSecret(source, namespace);
  }

  if (shouldSkipRuntimeConfigValidation(source)) {
    return `${source.APP_NAME?.trim() || 'payer-portal'}.${namespace}.build-placeholder-secret`;
  }

  throw new Error(
    `Missing required environment variable: ${keys[0]}. Set one of ${keys.join(', ')} outside development/test.`
  );
}

function createServiceEndpoints(input: {
  adminBaseUrl: string;
  apiBaseUrl: string;
  authBaseUrl?: string;
  portalBaseUrl: string;
}): ServiceEndpoints {
  return {
    admin: input.adminBaseUrl,
    api: input.apiBaseUrl,
    auth: input.authBaseUrl ?? input.apiBaseUrl,
    portal: input.portalBaseUrl
  };
}

function buildBaseConfig(
  source: EnvSource,
  appNameFallback: string,
  portFallback?: number
): BaseConfig {
  return {
    appName: source.APP_NAME?.trim() || appNameFallback,
    nodeEnv: normalizeNodeEnv(source.NODE_ENV),
    port: readOptionalNumber(source, 'PORT') ?? portFallback
  };
}

export function loadBaseConfig(source: EnvSource = process.env): BaseConfig {
  const runtimeModel = loadRuntimeModel(source);

  return {
    appName: readRequired(source, 'APP_NAME'),
    nodeEnv: normalizeNodeEnv(source.NODE_ENV),
    port: readOptionalNumber(source, 'PORT') ?? runtimeModel.ports.api
  };
}

export function loadRuntimeModel(source: EnvSource = process.env): RuntimeModel {
  const nodeEnv = normalizeNodeEnv(source.NODE_ENV);
  const requireExplicitOrigins = shouldRequireExplicitRuntimeConfig(source);
  validateRequiredRuntimeConfig(source);
  const portalWebPort = readNumberWithFallback(
    source,
    ['PORTAL_WEB_PORT'],
    DEFAULT_PORTS.portalWeb
  );
  const apiPort = readNumberWithFallback(source, ['API_PORT'], DEFAULT_PORTS.api);
  const apiGatewayPort = readNumberWithFallback(
    source,
    ['API_GATEWAY_PORT'],
    DEFAULT_PORTS.apiGateway
  );
  const adminConsolePort = readNumberWithFallback(
    source,
    ['ADMIN_CONSOLE_PORT'],
    DEFAULT_PORTS.adminConsole
  );
  const postgresPort = readNumberWithFallback(
    source,
    ['POSTGRES_PORT'],
    DEFAULT_PORTS.postgres
  );

  const portalPublic = readUrlWithFallback(
    source,
    [...PORTAL_PUBLIC_ORIGIN_KEYS],
    `http://localhost:${portalWebPort}`,
    {
      requiredInNonDevelopment: requireExplicitOrigins
    }
  );
  const adminConsolePublic = readUrlWithFallback(
    source,
    [...ADMIN_PUBLIC_ORIGIN_KEYS],
    `http://localhost:${adminConsolePort}`,
    {
      requiredInNonDevelopment: requireExplicitOrigins
    }
  );
  const apiPublic = readUrlWithFallback(
    source,
    [...API_PUBLIC_ORIGIN_KEYS],
    `http://localhost:${apiPort}`,
    {
      requiredInNonDevelopment: requireExplicitOrigins
    }
  );
  const apiGatewayPublic = readUrlWithFallback(
    source,
    ['API_GATEWAY_PUBLIC_ORIGIN'],
    `http://localhost:${apiGatewayPort}`,
    {
      requiredInNonDevelopment: requireExplicitOrigins
    }
  );
  const apiInternal = readUrlWithFallback(
    source,
    [...API_INTERNAL_ORIGIN_KEYS],
    apiPublic,
    {
      requiredInNonDevelopment: requireExplicitOrigins
    }
  );

  const allowInsecurePublicOrigins =
    readOptionalBoolean(source, 'ALLOW_INSECURE_PUBLIC_ORIGINS') ?? false;

  if (
    !isDevelopmentLike(nodeEnv) &&
    !allowInsecurePublicOrigins &&
    !shouldSkipRuntimeConfigValidation(source)
  ) {
    assertHttpsUrl('PORTAL_PUBLIC_ORIGIN', portalPublic);
    assertHttpsUrl('ADMIN_CONSOLE_PUBLIC_ORIGIN', adminConsolePublic);
    assertHttpsUrl('API_PUBLIC_ORIGIN', apiPublic);
  }

  return {
    apiBaseUrl: apiInternal,
    host: source.HOST?.trim() || '0.0.0.0',
    nodeEnv,
    ports: {
      adminConsole: adminConsolePort,
      api: apiPort,
      apiGateway: apiGatewayPort,
      portalWeb: portalWebPort,
      postgres: postgresPort
    },
    origins: {
      adminConsolePublic,
      apiInternal,
      apiGatewayPublic,
      apiPublic,
      portalPublic
    },
    serviceEndpoints: createServiceEndpoints({
      adminBaseUrl: adminConsolePublic,
      apiBaseUrl: apiInternal,
      authBaseUrl: apiInternal,
      portalBaseUrl: portalPublic
    })
  };
}

export function loadServiceSecurityConfig(
  source: EnvSource = process.env
): ServiceSecurityConfig {
  const nodeEnv = normalizeNodeEnv(source.NODE_ENV);
  const runtimeModel = loadRuntimeModel(source);
  const allowInsecurePublicOrigins =
    readOptionalBoolean(source, 'ALLOW_INSECURE_PUBLIC_ORIGINS') ?? false;
  const secureCookies =
    readOptionalBoolean(source, 'SECURE_COOKIES') ?? !isDevelopmentLike(nodeEnv);
  const trustProxy =
    readOptionalBoolean(source, 'TRUST_PROXY') ?? !isDevelopmentLike(nodeEnv);
  const explicitCookieDomain =
    source.PORTAL_SESSION_COOKIE_DOMAIN?.trim() || undefined;
  const cookieSameSiteRaw =
    source.PORTAL_SESSION_COOKIE_SAME_SITE?.trim().toLowerCase() ?? 'lax';
  const portalHostname = new URL(runtimeModel.origins.portalPublic).hostname;
  const portalSessionCookieDomain =
    explicitCookieDomain ??
    (isCookieDomainEligible(portalHostname) ? portalHostname : undefined);

  if (
    cookieSameSiteRaw !== 'lax' &&
    cookieSameSiteRaw !== 'strict' &&
    cookieSameSiteRaw !== 'none'
  ) {
    throw new Error(
      'Environment variable PORTAL_SESSION_COOKIE_SAME_SITE must be one of: lax, strict, none'
    );
  }

  if (cookieSameSiteRaw === 'none' && !secureCookies) {
    throw new Error(
      'PORTAL_SESSION_COOKIE_SAME_SITE=none requires SECURE_COOKIES=true.'
    );
  }

  return {
    allowInsecurePublicOrigins,
    portalSessionCookieDomain,
    portalSessionCookieSameSite: cookieSameSiteRaw,
    secureCookies,
    trustProxy
  };
}

export function loadObservabilityConfig(
  source: EnvSource = process.env,
  defaultServiceName = source.APP_NAME?.trim() || 'payer-portal-service'
): ObservabilityConfig {
  return {
    logLevel: readLogLevel(source),
    prometheusHost: source.OTEL_PROMETHEUS_HOST?.trim() || '0.0.0.0',
    prometheusPath: source.OTEL_PROMETHEUS_PATH?.trim() || '/metrics',
    prometheusPort: readOptionalNumber(source, 'OTEL_PROMETHEUS_PORT') ?? 9464,
    serviceName: source.OTEL_SERVICE_NAME?.trim() || defaultServiceName
  };
}

export function loadSharedSecretsConfig(
  source: EnvSource = process.env
): SharedSecretsConfig {
  validateRequiredRuntimeConfig(source);

  const session = readServiceSecret(source, ['SESSION_SECRET'], 'session');

  return {
    adminConsoleSession:
      readFirstDefined(source, ['ADMIN_CONSOLE_SESSION_SECRET']) ?? session,
    apiAuthToken: readFirstDefined(source, ['API_AUTH_TOKEN_SECRET']) ?? session,
    apiGatewayJwt: readFirstDefined(source, ['API_GATEWAY_JWT_SECRET']) ?? session,
    portalSession: readFirstDefined(source, ['PORTAL_SESSION_SECRET']) ?? session,
    session
  };
}

export function loadPlatformConfig(source: EnvSource = process.env): PlatformConfig {
  return {
    ...loadRuntimeModel(source),
    security: loadServiceSecurityConfig(source),
    secrets: loadSharedSecretsConfig(source)
  };
}

export function loadNextRuntimeConfig(
  source: EnvSource = process.env
): NextRuntimeConfig {
  return {
    distDir: source.NEXT_DIST_DIR?.trim() || '.next'
  };
}

export function loadApiServiceConfig(
  source: EnvSource = process.env
): ApiServiceConfig {
  const runtimeModel = loadRuntimeModel(source);
  const publicOrigin = readServicePublicOrigin(
    source,
    [
      'API_PUBLIC_ORIGIN',
      'NEXT_PUBLIC_API_PUBLIC_ORIGIN',
      'NEXT_PUBLIC_API_BASE_URL'
    ],
    runtimeModel.origins.apiPublic
  );

  return {
    ...buildBaseConfig(source, 'api', runtimeModel.ports.api),
    apiBaseUrl: runtimeModel.apiBaseUrl,
    apiAuthTokenSecret: readServiceSecret(
      source,
      ['API_AUTH_TOKEN_SECRET', 'SESSION_SECRET'],
      'api-auth-token'
    ),
    databaseUrl: readRequired(source, 'DATABASE_URL'),
    host: source.HOST?.trim() || '0.0.0.0',
    observability: loadObservabilityConfig(source, 'api'),
    portalCatalogDatabaseUrl: source.PORTAL_CATALOG_DATABASE_URL?.trim() || undefined,
    publicOrigin,
    runtimeModel: {
      ...runtimeModel,
      origins: {
        ...runtimeModel.origins,
        apiPublic: publicOrigin
      }
    },
    security: loadServiceSecurityConfig(source),
    serviceEndpoints: createServiceEndpoints({
      adminBaseUrl: runtimeModel.origins.adminConsolePublic,
      apiBaseUrl: runtimeModel.origins.apiInternal,
      authBaseUrl: runtimeModel.origins.apiInternal,
      portalBaseUrl: runtimeModel.origins.portalPublic
    })
  };
}

export function loadPortalWebServiceConfig(
  source: EnvSource = process.env
): PortalWebServiceConfig {
  validateFrontendServiceConfig(source, {
    publicOriginKeys: [...PORTAL_PUBLIC_ORIGIN_KEYS]
  });

  const runtimeModel = loadRuntimeModel(source);
  const secrets = loadSharedSecretsConfig(source);
  const publicOrigin = readServicePublicOrigin(
    source,
    [...PORTAL_PUBLIC_ORIGIN_KEYS],
    runtimeModel.origins.portalPublic
  );

  return {
    ...buildBaseConfig(source, 'portal-web', runtimeModel.ports.portalWeb),
    apiBaseUrl: runtimeModel.apiBaseUrl,
    host: source.HOST?.trim() || runtimeModel.host,
    portalSessionSecret: secrets.portalSession,
    publicOrigin,
    runtimeModel: {
      ...runtimeModel,
      origins: {
        ...runtimeModel.origins,
        portalPublic: publicOrigin
      }
    },
    security: loadServiceSecurityConfig(source),
    serviceEndpoints: runtimeModel.serviceEndpoints
  };
}

export function loadAdminConsoleServiceConfig(
  source: EnvSource = process.env
): AdminConsoleServiceConfig {
  validateFrontendServiceConfig(source, {
    publicOriginKeys: [...ADMIN_PUBLIC_ORIGIN_KEYS]
  });

  const runtimeModel = loadRuntimeModel(source);
  const secrets = loadSharedSecretsConfig(source);
  const publicOrigin = readServicePublicOrigin(
    source,
    [...ADMIN_PUBLIC_ORIGIN_KEYS],
    runtimeModel.origins.adminConsolePublic
  );

  return {
    ...buildBaseConfig(source, 'admin-console', runtimeModel.ports.adminConsole),
    apiBaseUrl: runtimeModel.apiBaseUrl,
    defaultAdminUserId:
      readFirstDefined(source, ['ADMIN_DEFAULT_USER_ID', 'NEXT_PUBLIC_ADMIN_USER_ID']) || '',
    host: source.HOST?.trim() || runtimeModel.host,
    publicOrigin,
    runtimeModel: {
      ...runtimeModel,
      origins: {
        ...runtimeModel.origins,
        adminConsolePublic: publicOrigin
      }
    },
    sessionSecret: secrets.adminConsoleSession,
    security: loadServiceSecurityConfig(source),
    serviceEndpoints: runtimeModel.serviceEndpoints
  };
}

export function loadPortalSessionConfig(
  source: EnvSource = process.env
): PortalSessionConfig {
  const secrets = loadSharedSecretsConfig(source);

  return {
    nodeEnv: normalizeNodeEnv(source.NODE_ENV),
    portalSessionSecret: secrets.portalSession,
    security: loadServiceSecurityConfig(source)
  };
}

export function loadApiGatewayConfig(
  source: EnvSource = process.env
): ApiGatewayConfig {
  const runtimeModel = loadRuntimeModel(source);
  const secrets = loadSharedSecretsConfig(source);
  const publicOrigin = readServicePublicOrigin(
    source,
    ['API_GATEWAY_PUBLIC_ORIGIN'],
    runtimeModel.origins.apiGatewayPublic
  );

  return {
    ...buildBaseConfig(source, 'api-gateway', runtimeModel.ports.apiGateway),
    apiBaseUrl: runtimeModel.apiBaseUrl,
    apiGatewayJwtSecret: secrets.apiGatewayJwt,
    databaseUrl: source.DATABASE_URL?.trim() || undefined,
    host: source.HOST?.trim() || runtimeModel.host,
    jwtTtlSeconds:
      readOptionalNumber(source, 'API_GATEWAY_JWT_TTL_SECONDS') ?? 60 * 60,
    publicOrigin,
    runtimeModel: {
      ...runtimeModel,
      origins: {
        ...runtimeModel.origins,
        apiGatewayPublic: publicOrigin
      }
    },
    serviceEndpoints: runtimeModel.serviceEndpoints
  };
}

export function loadJobWorkerServiceConfig(
  source: EnvSource = process.env
): JobWorkerServiceConfig {
  const runtimeModel = loadRuntimeModel(source);

  return {
    ...buildBaseConfig(source, 'job-worker'),
    databaseUrl: readRequired(source, 'DATABASE_URL'),
    jobWorkerPollIntervalMs:
      readOptionalNumber(source, 'JOB_WORKER_POLL_INTERVAL_MS') ?? 1_000,
    nodeEnv: normalizeNodeEnv(source.NODE_ENV),
    observability: loadObservabilityConfig(source, 'job-worker'),
    runtimeModel
  };
}

export function loadStorageConfig(source: EnvSource = process.env): StorageConfig {
  const providerValue = source.STORAGE_PROVIDER?.trim().toLowerCase();
  const provider: StorageProvider =
    providerValue === 's3' ? 's3' : 'local';
  const nodeEnv = normalizeNodeEnv(source.NODE_ENV);
  const localStorageDir =
    source.LOCAL_STORAGE_DIR?.trim() ||
    source.STORAGE_DIR?.trim() ||
    'storage';
  const localPublicAssetDir =
    source.LOCAL_PUBLIC_ASSET_DIR?.trim() ||
    'apps/portal-web/public/tenant-assets';
  const localPublicAssetBasePath =
    source.LOCAL_PUBLIC_ASSET_BASE_PATH?.trim() || '/tenant-assets';
  const localBackupDir =
    source.BACKUP_STORAGE_DIR?.trim() ||
    source.BACKUP_DIR?.trim() ||
    'backups';
  const bucket = source.S3_BUCKET?.trim() || undefined;
  const region = source.S3_REGION?.trim() || undefined;
  const s3AccessKey = source.S3_ACCESS_KEY?.trim() || undefined;
  const s3SecretKey = source.S3_SECRET_KEY?.trim() || undefined;

  if (provider === 's3' && !isDevelopmentLike(nodeEnv)) {
    if (!bucket) {
      throw new Error(
        'Missing required environment variable: S3_BUCKET. Set S3_BUCKET when STORAGE_PROVIDER=s3.'
      );
    }

    if (!region) {
      throw new Error(
        'Missing required environment variable: S3_REGION. Set S3_REGION when STORAGE_PROVIDER=s3.'
      );
    }
  }

  return {
    provider,
    localStorageDir,
    localPublicAssetDir,
    localPublicAssetBasePath,
    localBackupDir,
    bucket,
    region,
    s3AccessKey,
    s3SecretKey
  };
}

export function getEnv(source: EnvSource, key: string, fallback?: string) {
  return source[key] ?? fallback;
}

export function readProcessEnv(key: string, fallback?: string) {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export const platformConfig = loadPlatformConfig();
