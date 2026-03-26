import { config } from '../lib/public-runtime';

export function PlatformBrandingStylesheet() {
  return (
    <link
      rel="stylesheet"
      href={`${config.serviceEndpoints.api}/public/platform-branding/custom.css`}
    />
  );
}
