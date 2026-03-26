import path from 'node:path';

import type { MultipartFile } from '@fastify/multipart';
import {
  getPublicAssetStorageService,
  logAdminAction
} from '@payer-portal/server';

const PLATFORM_BRANDING_CSS_KEY = 'platform/branding/platform-custom.css';

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string;
  userAgent?: string;
  tenantId: string;
};

function shouldWriteAuditLog(tenantId: string) {
  return tenantId !== 'platform';
}

function isCssUpload(file: MultipartFile) {
  return (
    file.mimetype === 'text/css' ||
    file.mimetype === 'text/plain' ||
    path.extname(file.filename).toLowerCase() === '.css'
  );
}

export function getPlatformBrandingCssPublicPath() {
  return '/public/platform-branding/custom.css';
}

export async function getPlatformBrandingCssMetadata() {
  const storage = getPublicAssetStorageService();
  const publicStorageUrl = storage.getPublicUrl(PLATFORM_BRANDING_CSS_KEY);

  try {
    const content = await storage.get(PLATFORM_BRANDING_CSS_KEY);

    return {
      hasCustomCss: true,
      cssUrl: getPlatformBrandingCssPublicPath(),
      publicStorageUrl,
      sizeBytes: content.byteLength
    };
  } catch {
    return {
      hasCustomCss: false,
      cssUrl: getPlatformBrandingCssPublicPath(),
      publicStorageUrl,
      sizeBytes: 0
    };
  }
}

export async function getPlatformBrandingCssContent() {
  try {
    return await getPublicAssetStorageService().get(PLATFORM_BRANDING_CSS_KEY);
  } catch {
    return Buffer.from('/* No custom platform branding CSS uploaded. */\n');
  }
}

export async function uploadPlatformBrandingCss(
  file: MultipartFile,
  context: AuditContext
) {
  if (!isCssUpload(file)) {
    throw new Error('Platform theme upload must be a CSS file');
  }

  const buffer = await file.toBuffer();
  const normalizedCss = buffer.toString('utf8').trim();

  if (!normalizedCss) {
    throw new Error('CSS file must not be empty');
  }

  await getPublicAssetStorageService().put(
    PLATFORM_BRANDING_CSS_KEY,
    Buffer.from(`${normalizedCss}\n`, 'utf8'),
    {
      contentType: 'text/css; charset=utf-8'
    }
  );

  if (shouldWriteAuditLog(context.tenantId)) {
    await logAdminAction({
      tenantId: context.tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'platform.branding.css.updated',
      resourceType: 'platform_branding',
      resourceId: 'platform-custom-css',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        fileName: file.filename,
        sizeBytes: buffer.byteLength
      }
    });
  }

  return getPlatformBrandingCssMetadata();
}

export async function deletePlatformBrandingCss(context: AuditContext) {
  await getPublicAssetStorageService().delete(PLATFORM_BRANDING_CSS_KEY);

  if (shouldWriteAuditLog(context.tenantId)) {
    await logAdminAction({
      tenantId: context.tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'platform.branding.css.deleted',
      resourceType: 'platform_branding',
      resourceId: 'platform-custom-css',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
  }

  return getPlatformBrandingCssMetadata();
}
