import { portalWebRuntimeConfig } from './runtime-config';

const runtimeModel = portalWebRuntimeConfig.runtimeModel;

export const config = {
  apiBaseUrl: portalWebRuntimeConfig.apiBaseUrl,
  security: portalWebRuntimeConfig.security,
  serviceEndpoints: {
    ...portalWebRuntimeConfig.serviceEndpoints
  }
} as const;

export const apiInternalOrigin = config.serviceEndpoints.api;
export const apiPublicOrigin = runtimeModel.origins.apiPublic;
export const portalPublicOrigin = config.serviceEndpoints.portal;
export const adminConsolePublicOrigin = config.serviceEndpoints.admin;
export const portalWebSecurityConfig = portalWebRuntimeConfig.security;
