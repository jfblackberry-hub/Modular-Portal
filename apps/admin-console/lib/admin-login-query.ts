export function isReturnToPortalRequest(searchParams: URLSearchParams) {
  return searchParams.get('returnToPortal') === '1';
}
