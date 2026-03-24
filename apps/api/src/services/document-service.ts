import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { MultipartFile } from '@fastify/multipart';
import type { Document, Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import {
  buildTenantDocumentStorageKey,
  getStorageService,
  logSensitiveDataAccess,
  publishInBackground} from '@payer-portal/server';

import { createMockPdfBuffer, isPdfBuffer } from './pdf-utils';

type UploadDocumentInput = {
  file: MultipartFile;
  userId: string;
  status?: string;
  tags?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

type DocumentAccessContext = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

export class DocumentFileNotFoundError extends Error {
  constructor() {
    super('Document file not found');
    this.name = 'DocumentFileNotFoundError';
  }
}

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function sanitizeFileName(fileName: string) {
  const normalized = path.basename(fileName).trim();

  if (!normalized) {
    throw new Error('Filename is required');
  }

  return normalized.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function mapDocument(document: Document) {
  return {
    id: document.id,
    tenantId: document.tenantId,
    uploadedByUserId: document.uploadedByUserId,
    filename: document.filename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    storageKey: document.storageKey,
    tags: document.tags,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

async function getAuthenticatedUser(userId: string) {
  const normalizedUserId = normalizeRequired(userId, 'User');

  const user = await prisma.user.findUnique({
    where: { id: normalizedUserId },
    include: {
      tenant: true
    }
  });

  if (!user) {
    throw new Error('Authenticated user not found');
  }

  if (!user.tenantId || !user.tenant) {
    throw new Error('Tenant-bound user required');
  }

  return {
    ...user,
    tenantId: user.tenantId,
    tenant: user.tenant
  };
}

export async function uploadDocument(input: UploadDocumentInput) {
  const status = normalizeRequired(input.status ?? 'AVAILABLE', 'Status');
  const fileName = sanitizeFileName(input.file.filename);
  const user = await getAuthenticatedUser(input.userId);

  const mimeType = normalizeRequired(input.file.mimetype, 'MIME type');
  const fileBuffer = await input.file.toBuffer();
  const documentId = randomUUID();
  const storageKey = buildTenantDocumentStorageKey({
    tenantId: user.tenantId,
    documentId,
    fileName
  });

  await getStorageService().put(storageKey, fileBuffer, {
    contentType: mimeType
  });

  const document = await prisma.$transaction(async (tx) => {
    const createdDocument = await tx.document.create({
      data: {
        id: documentId,
        tenantId: user.tenantId,
        uploadedByUserId: user.id,
        filename: fileName,
        mimeType,
        sizeBytes: fileBuffer.byteLength,
        storageKey,
        tags: input.tags,
        status
      }
    });

    await logSensitiveDataAccess({
      client: tx,
      tenantId: user.tenantId,
      actorUserId: user.id,
      action: 'document.uploaded',
      resourceType: 'Document',
      resourceId: createdDocument.id,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: {
        fileName,
        mimeType,
        sizeBytes: fileBuffer.byteLength,
        storageKey
      }
    });

    return createdDocument;
  });

  publishInBackground('document.uploaded', {
    id: randomUUID(),
    correlationId: randomUUID(),
    timestamp: new Date(),
    tenantId: document.tenantId,
    type: 'document.uploaded',
    payload: {
      documentId: document.id,
      fileName: document.filename,
      contentType: document.mimeType,
      uploadedByUserId: document.uploadedByUserId
    }
  });

  return mapDocument(document);
}

export async function listDocuments(input: Pick<DocumentAccessContext, 'userId'>) {
  const user = await getAuthenticatedUser(input.userId);

  const documents = await prisma.document.findMany({
    where: {
      tenantId: user.tenantId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return documents.map(mapDocument);
}

export async function downloadDocument(input: DocumentAccessContext & { documentId: string }) {
  const user = await getAuthenticatedUser(input.userId);
  const documentId = normalizeRequired(input.documentId, 'Document');

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = await getStorageService().get(document.storageKey);
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new DocumentFileNotFoundError();
    }

    throw error;
  }

  if (document.mimeType === 'application/pdf' && !isPdfBuffer(fileBuffer)) {
    const placeholderLines = fileBuffer
      .toString('utf8')
      .split(/\r?\n/)
      .filter(Boolean);
    fileBuffer = createMockPdfBuffer(document.filename, placeholderLines);
  }

  await logSensitiveDataAccess({
    tenantId: user.tenantId,
    actorUserId: user.id,
    action: 'document.downloaded',
    resourceType: 'Document',
    resourceId: document.id,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: {
      fileName: document.filename,
      storageKey: document.storageKey
    }
  });

  return {
    document: mapDocument(document),
    fileBuffer
  };
}
