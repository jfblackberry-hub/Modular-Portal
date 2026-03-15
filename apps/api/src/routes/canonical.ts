import { canonicalFixtures, memberFixture, memberSchema } from '@payer-portal/canonical-model';
import type { FastifyInstance } from 'fastify';

export async function canonicalRoutes(app: FastifyInstance) {
  app.get('/canonical/fixtures', async () => canonicalFixtures);

  app.get('/canonical/member', async () => {
    return memberSchema.parse(memberFixture);
  });
}
