import { adminConsoleRuntimeConfig } from './runtime-config';

const runtimeModel = adminConsoleRuntimeConfig.runtimeModel;

export const config = {
  apiBaseUrl: '/api/proxy',
  serviceEndpoints: {
    admin: runtimeModel.origins.adminConsolePublic,
    api: runtimeModel.origins.apiPublic,
    auth: runtimeModel.origins.apiPublic,
    portal: runtimeModel.origins.portalPublic
  }
} as const;

export const apiPublicOrigin = config.serviceEndpoints.api;
export const portalPublicOrigin = config.serviceEndpoints.portal;
export const adminConsolePublicOrigin = config.serviceEndpoints.admin;
export const defaultAdminUserId = adminConsoleRuntimeConfig.defaultAdminUserId;
