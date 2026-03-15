import { redirect } from 'next/navigation';

import { SearchResultsView } from '../../../components/search-results-view';
import { searchPlatformContent } from '../../../lib/platform-search';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function MemberSearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  const { q } = await searchParams;
  const result = await searchPlatformContent(user.id, q ?? '');

  return <SearchResultsView result={result} searchBasePath="/member/search" />;
}
