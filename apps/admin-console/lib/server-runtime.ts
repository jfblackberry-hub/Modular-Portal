import { adminConsoleRuntimeConfig } from './runtime-config';

const runtimeModel = adminConsoleRuntimeConfig.runtimeModel;

export const config = {
  apiBaseUrl: adminConsoleRuntimeConfig.apiBaseUrl,
  security: adminConsoleRuntimeConfig.security,
  serviceEndpoints: {
    ...adminConsoleRuntimeConfig.serviceEndpoints
  }
} as const;

export const apiInternalOrigin = config.serviceEndpoints.api;
export const apiPublicOrigin = runtimeModel.origins.apiPublic;
export const portalPublicOrigin = config.serviceEndpoints.portal;
export const adminConsolePublicOrigin = config.serviceEndpoints.admin;
export const adminConsoleSecurityConfig = adminConsoleRuntimeConfig.security;
