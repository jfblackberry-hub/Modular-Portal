export type PersonaType =
  | 'platform_operator'
  | 'tenant_admin'
  | 'support_analyst'
  | 'auditor';

export type PersonaSession = {
  id: string;
  tenantId: string;
  personaType: PersonaType;
  userId: string;
  createdAt: string;
};

export type PersonaSessionDraft = {
  tenantId: string;
  personaType: PersonaType;
  userId: string;
};

export const LEGACY_PERSONA_SESSION_STORAGE_KEY = 'admin-platform-persona-sessions';
export const LEGACY_ACTIVE_PERSONA_SESSION_STORAGE_KEY =
  'admin-platform-active-persona-session';
export const PERSONA_SESSION_STORAGE_KEY = 'admin_session:persona_sessions';
export const ACTIVE_PERSONA_SESSION_STORAGE_KEY =
  'admin_session:active_persona_session';

function getPersonaSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export const PERSONA_TYPE_OPTIONS: Array<{
  value: PersonaType;
  label: string;
  description: string;
}> = [
  {
    value: 'platform_operator',
    label: 'Platform Operator',
    description: 'Global oversight across tenants and platform operations.'
  },
  {
    value: 'tenant_admin',
    label: 'Tenant Admin',
    description: 'Tenant-scoped configuration, users, and health workflows.'
  },
  {
    value: 'support_analyst',
    label: 'Support Analyst',
    description: 'Investigate incidents without taking admin-only actions.'
  },
  {
    value: 'auditor',
    label: 'Auditor',
    description: 'Review evidence, audit activity, and traceability context.'
  }
];

export function createPersonaSessionId() {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `persona-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPersonaSession(input: PersonaSessionDraft): PersonaSession {
  return {
    id: createPersonaSessionId(),
    tenantId: input.tenantId.trim(),
    personaType: input.personaType,
    userId: input.userId.trim(),
    createdAt: new Date().toISOString()
  };
}

export function readStoredPersonaSessions() {
  if (typeof window === 'undefined') {
    return [] as PersonaSession[];
  }

  const storage = getPersonaSessionStorage();
  if (!storage) {
    return [] as PersonaSession[];
  }

  const rawValue =
    storage.getItem(PERSONA_SESSION_STORAGE_KEY) ??
    storage.getItem(LEGACY_PERSONA_SESSION_STORAGE_KEY);

  if (!rawValue) {
    return [] as PersonaSession[];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [] as PersonaSession[];
    }

    return parsed.filter(isPersonaSession);
  } catch {
    return [] as PersonaSession[];
  }
}

export function storePersonaSessions(sessions: PersonaSession[]) {
  if (typeof window === 'undefined') {
    return;
  }

  getPersonaSessionStorage()?.setItem(
    PERSONA_SESSION_STORAGE_KEY,
    JSON.stringify(sessions)
  );
}

export function readActivePersonaSessionId() {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    getPersonaSessionStorage()?.getItem(ACTIVE_PERSONA_SESSION_STORAGE_KEY) ??
    getPersonaSessionStorage()?.getItem(LEGACY_ACTIVE_PERSONA_SESSION_STORAGE_KEY) ??
    ''
  );
}

export function storeActivePersonaSessionId(sessionId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!sessionId) {
    getPersonaSessionStorage()?.removeItem(ACTIVE_PERSONA_SESSION_STORAGE_KEY);
    getPersonaSessionStorage()?.removeItem(LEGACY_ACTIVE_PERSONA_SESSION_STORAGE_KEY);
    return;
  }

  getPersonaSessionStorage()?.setItem(ACTIVE_PERSONA_SESSION_STORAGE_KEY, sessionId);
}

export function readStoredPersonaSession(sessionId: string) {
  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    return null;
  }

  return (
    readStoredPersonaSessions().find((session) => session.id === normalizedSessionId) ?? null
  );
}

export function resolveStoredPersonaWorkspaceSession(sessionId: string) {
  const session = readStoredPersonaSession(sessionId);

  if (
    !session ||
    !session.id.trim() ||
    !session.tenantId.trim() ||
    !session.userId.trim() ||
    !isPersonaType(session.personaType)
  ) {
    return null;
  }

  return {
    id: session.id.trim(),
    tenantId: session.tenantId.trim(),
    userId: session.userId.trim(),
    personaType: session.personaType,
    createdAt: session.createdAt
  } satisfies PersonaSession;
}

export function getPersonaLabel(personaType: PersonaType) {
  return (
    PERSONA_TYPE_OPTIONS.find((option) => option.value === personaType)?.label ??
    personaType
  );
}

export function isPersonaType(value: string): value is PersonaType {
  return PERSONA_TYPE_OPTIONS.some((option) => option.value === value);
}

function isPersonaSession(value: unknown): value is PersonaSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.tenantId === 'string' &&
    typeof candidate.userId === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.personaType === 'string'
  );
}
