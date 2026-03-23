import { NextResponse } from 'next/server';

import { getEmployerDashboard } from '../../../../../../../lib/billing-enrollment-api';
import {
  type DocumentCategory,
  documentsToCsv,
  getEmployerDocumentsForTenant} from '../../../../../../../lib/employer-document-center-data';
import { getPortalSessionUser } from '../../../../../../../lib/portal-session';

const categorySet = new Set<DocumentCategory>([
  'Plan Documents',
  'Billing Documents',
  'Compliance Documents',
  'Employer Documents',
  'Secure File Exchange'
]);

export async function GET(
  _: Request,
  context: { params: Promise<{ category: string }> }
) {
  const user = await getPortalSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const { category } = await context.params;
  const decodedCategory = decodeURIComponent(category) as DocumentCategory;

  if (!categorySet.has(decodedCategory)) {
    return NextResponse.json({ message: 'Invalid category.' }, { status: 400 });
  }

  const dashboard = await getEmployerDashboard(user.id).catch(() => null);
  const documents = getEmployerDocumentsForTenant(user.tenant.id, dashboard?.documentCenter).filter(
    (document) => document.category === decodedCategory
  );

  if (documents.length === 0) {
    return NextResponse.json({ message: 'No documents available for this category.' }, { status: 404 });
  }

  return new NextResponse(documentsToCsv(documents), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${decodedCategory.replaceAll(' ', '-').toLowerCase()}-documents.csv"`
    }
  });
}
