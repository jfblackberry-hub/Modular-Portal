import { config } from '../lib/public-runtime';

function getNormalizedBrandingStylesheetHref() {
  const stylesheetUrl = new URL(
    '/public/platform-branding/custom.css',
    config.serviceEndpoints.api
  );

  if (stylesheetUrl.hostname === '127.0.0.1') {
    stylesheetUrl.hostname = 'localhost';
  }

  return stylesheetUrl.toString();
}

export function PlatformBrandingStylesheet() {
  return (
    <link
      rel="stylesheet"
      href={getNormalizedBrandingStylesheetHref()}
    />
  );
}
