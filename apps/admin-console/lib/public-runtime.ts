import { adminConsoleRuntimeConfig } from './runtime-config';

const runtimeModel = adminConsoleRuntimeConfig.runtimeModel;

export const apiPublicOrigin = runtimeModel.origins.apiPublic;
export const portalPublicOrigin = runtimeModel.origins.portalPublic;
export const adminConsolePublicOrigin = runtimeModel.origins.adminConsolePublic;
export const defaultAdminUserId = adminConsoleRuntimeConfig.defaultAdminUserId;
