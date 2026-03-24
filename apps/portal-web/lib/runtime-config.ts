import {
  loadPortalSessionConfig,
  loadPortalWebServiceConfig
} from '@payer-portal/config';

export const portalWebRuntimeConfig = loadPortalWebServiceConfig();
export const portalSessionRuntimeConfig = loadPortalSessionConfig();
