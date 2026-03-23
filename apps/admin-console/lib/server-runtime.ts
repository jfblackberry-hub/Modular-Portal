import { adminConsoleRuntimeConfig } from './runtime-config';

const runtimeModel = adminConsoleRuntimeConfig.runtimeModel;

export const apiInternalOrigin = runtimeModel.origins.apiInternal;
export const apiPublicOrigin = runtimeModel.origins.apiPublic;
export const portalPublicOrigin = runtimeModel.origins.portalPublic;
export const adminConsolePublicOrigin = runtimeModel.origins.adminConsolePublic;
export const adminConsoleSecurityConfig = adminConsoleRuntimeConfig.security;
