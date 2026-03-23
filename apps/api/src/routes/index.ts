import type { FastifyInstance } from 'fastify';

import { adminOperationsRoutes } from './admin-operations';
import { apiCatalogRoutes } from './api-catalog';
import { auditRoutes } from './audit';
import { authRoutes } from './auth';
import { billingEnrollmentRoutes } from './billing-enrollment';
import { brandingRoutes } from './branding';
import { canonicalRoutes } from './canonical';
import { connectorRoutes } from './connectors';
import { documentRoutes } from './documents';
import { featureFlagRoutes } from './feature-flags';
import { healthRoutes } from './health';
import { jobRoutes } from './jobs';
import { memberRoutes } from './member';
import { metricsRoutes } from './metrics';
import { previewSessionRoutes } from './preview-sessions';
import { roleRoutes } from './roles';
import { searchRoutes } from './search';
import { tenantAdminRoutes } from './tenant-admin';
import { tenantRoutes } from './tenants';

export function registerRoutes(app: FastifyInstance) {
  app.register(adminOperationsRoutes);
  app.register(apiCatalogRoutes);
  app.register(auditRoutes);
  app.register(authRoutes);
  app.register(billingEnrollmentRoutes);
  app.register(brandingRoutes);
  app.register(canonicalRoutes);
  app.register(connectorRoutes);
  app.register(documentRoutes);
  app.register(featureFlagRoutes);
  app.register(healthRoutes);
  app.register(jobRoutes);
  app.register(memberRoutes);
  app.register(metricsRoutes);
  app.register(previewSessionRoutes);
  app.register(roleRoutes);
  app.register(searchRoutes);
  app.register(tenantAdminRoutes);
  app.register(tenantRoutes);
}
