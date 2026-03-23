import { portalWebRuntimeConfig } from './runtime-config';

const runtimeModel = portalWebRuntimeConfig.runtimeModel;

export const apiInternalOrigin = runtimeModel.origins.apiInternal;
export const apiPublicOrigin = runtimeModel.origins.apiPublic;
export const portalPublicOrigin = runtimeModel.origins.portalPublic;
export const adminConsolePublicOrigin = runtimeModel.origins.adminConsolePublic;
export const portalWebSecurityConfig = portalWebRuntimeConfig.security;
