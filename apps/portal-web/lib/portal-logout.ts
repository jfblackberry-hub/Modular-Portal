export async function requestPortalLogout(fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl('/api/auth/logout', {
    method: 'POST',
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | {
          message?: string;
        }
      | null;

    throw new Error(payload?.message ?? 'Unable to sign out right now.');
  }
}
