import { portalWebRuntimeConfig } from './runtime-config';

const runtimeModel = portalWebRuntimeConfig.runtimeModel;

export const config = {
  apiBaseUrl: runtimeModel.origins.apiPublic,
  serviceEndpoints: {
    admin: runtimeModel.origins.adminConsolePublic,
    api: runtimeModel.origins.apiPublic,
    auth: runtimeModel.origins.apiPublic,
    portal: runtimeModel.origins.portalPublic
  }
} as const;

export const portalPublicOrigin = config.serviceEndpoints.portal;
export const adminConsolePublicOrigin = config.serviceEndpoints.admin;
export const apiPublicOrigin = config.serviceEndpoints.api;
export const portalNodeEnv = portalWebRuntimeConfig.nodeEnv;
