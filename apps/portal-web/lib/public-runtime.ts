import { portalWebRuntimeConfig } from './runtime-config';

const runtimeModel = portalWebRuntimeConfig.runtimeModel;

export const portalPublicOrigin = runtimeModel.origins.portalPublic;
export const adminConsolePublicOrigin = runtimeModel.origins.adminConsolePublic;
export const apiPublicOrigin = runtimeModel.origins.apiPublic;
export const portalNodeEnv = portalWebRuntimeConfig.nodeEnv;
