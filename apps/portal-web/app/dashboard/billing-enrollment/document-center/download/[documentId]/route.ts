import { NextResponse } from 'next/server';

import { getEmployerDashboard } from '../../../../../../lib/billing-enrollment-api';
import { getEmployerDocumentByIdForTenant } from '../../../../../../lib/employer-document-center-data';
import { createMockPdfBuffer } from '../../../../../../lib/mock-pdf';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

export async function GET(
  _: Request,
  context: { params: Promise<{ documentId: string }> }
) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { documentId } = await context.params;
  const dashboard = await getEmployerDashboard(user.id).catch(() => null);
  const document = getEmployerDocumentByIdForTenant(
    user.tenant.id,
    documentId,
    dashboard?.documentCenter
  );

  if (!document) {
    return NextResponse.json({ message: 'Document not found.' }, { status: 404 });
  }

  const content = [
    `Document: ${document.name}`,
    `Type: ${document.type}`,
    `Category: ${document.category}`,
    `Uploaded by: ${document.uploadedBy}`,
    `Version: ${document.version}`,
    document.description ? `Description: ${document.description}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  return new NextResponse(createMockPdfBuffer(document.name, content.split('\n')), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${document.name.replaceAll(' ', '_')}.pdf"`
    }
  });
}
