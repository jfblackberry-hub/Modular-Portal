export function prefixPreviewHref(routePrefix: string | undefined, href: string) {
  if (!routePrefix || !href) {
    return href;
  }

  if (
    href.startsWith(routePrefix) ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#') ||
    href.startsWith('/api/')
  ) {
    return href;
  }

  if (!href.startsWith('/')) {
    return href;
  }

  return `${routePrefix}${href}`;
}

export function stripPreviewHref(routePrefix: string | undefined, pathname: string) {
  if (!routePrefix || !pathname.startsWith(routePrefix)) {
    return pathname;
  }

  const stripped = pathname.slice(routePrefix.length);
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}
