function normalizeOrigin(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isLoopbackOrigin(value) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '::1'
    );
  } catch {
    return false;
  }
}

export function isLocalDevReleaseValidation(env = process.env) {
  if (env.RELEASE_LOCAL_DEV?.trim() === 'true') {
    return true;
  }

  if (env.CI?.trim() === 'true') {
    return false;
  }

  if (env.NODE_ENV?.trim() === 'production') {
    return false;
  }

  return true;
}

export function resolveReleaseOrigins(env = process.env) {
  const configuredOrigins = {
    portal: normalizeOrigin(env.PORTAL_PUBLIC_ORIGIN),
    admin: normalizeOrigin(env.ADMIN_CONSOLE_PUBLIC_ORIGIN),
    api: normalizeOrigin(env.API_PUBLIC_ORIGIN)
  };

  if (isLocalDevReleaseValidation(env)) {
    return {
      portal: configuredOrigins.portal ?? 'http://127.0.0.1:3000',
      admin: configuredOrigins.admin ?? 'http://127.0.0.1:3003',
      api: configuredOrigins.api ?? 'http://127.0.0.1:3002'
    };
  }

  const missingVariables = Object.entries({
    PORTAL_PUBLIC_ORIGIN: configuredOrigins.portal,
    ADMIN_CONSOLE_PUBLIC_ORIGIN: configuredOrigins.admin,
    API_PUBLIC_ORIGIN: configuredOrigins.api
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    throw new Error(
      `Release validation requires explicit public origins outside local-dev mode: ${missingVariables.join(', ')}`
    );
  }

  const loopbackVariables = Object.entries({
    PORTAL_PUBLIC_ORIGIN: configuredOrigins.portal,
    ADMIN_CONSOLE_PUBLIC_ORIGIN: configuredOrigins.admin,
    API_PUBLIC_ORIGIN: configuredOrigins.api
  })
    .filter(([, value]) => isLoopbackOrigin(value))
    .map(([name]) => name);

  if (loopbackVariables.length > 0) {
    throw new Error(
      `Release validation cannot use localhost or loopback origins outside local-dev mode: ${loopbackVariables.join(', ')}`
    );
  }

  return configuredOrigins;
}
