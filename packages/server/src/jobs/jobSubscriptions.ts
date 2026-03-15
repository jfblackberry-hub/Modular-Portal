import { subscribe } from '../events/eventBus.js';
import { enqueueJob } from './jobQueue.js';
import { registerDefaultJobHandlers } from './jobRegistry.js';

let subscriptionsRegistered = false;

export function registerJobEventSubscriptions() {
  if (subscriptionsRegistered) {
    return;
  }

  subscriptionsRegistered = true;
  registerDefaultJobHandlers();

  subscribe('document.uploaded', async (event) => {
    await enqueueJob({
      type: 'document.process',
      tenantId: event.tenantId,
      payload: {
        documentId: event.payload.documentId,
        uploadedByUserId: event.payload.uploadedByUserId ?? null
      }
    });

    await enqueueJob({
      type: 'search.index',
      tenantId: event.tenantId,
      payload: {
        entityType: 'document',
        entityId: event.payload.documentId,
        sourceEvent: event.type
      }
    });
  });
}
