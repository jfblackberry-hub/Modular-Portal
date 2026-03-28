'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AutoLoginAudienceKey = 'admin' | 'payer' | 'provider';

type AutoLoginUser = {
  id: string;
  label: string;
  email: string;
  persona: string;
  personaLabel: string;
};

type AutoLoginPersona = {
  key: string;
  label: string;
  users: AutoLoginUser[];
};

type AutoLoginCompany = {
  key: string;
  tenantId: string | null;
  tenantTypeCode: string;
  name: string;
  personas: AutoLoginPersona[];
};

type AutoLoginAudience = {
  key: AutoLoginAudienceKey;
  label: string;
  companies: AutoLoginCompany[];
};

type CatalogPayload = {
  audiences: AutoLoginAudience[];
};

function findPrefilledUser(
  audiences: AutoLoginAudience[],
  identifier: string
) {
  const normalized = identifier.trim().toLowerCase();

  for (const audience of audiences) {
    for (const company of audience.companies) {
      for (const persona of company.personas) {
        const matchedUser = persona.users.find((user) => user.email.toLowerCase() === normalized);
        if (matchedUser) {
          return {
            audienceKey: audience.key,
            companyKey: company.key,
            personaKey: persona.key,
            userId: matchedUser.id
          };
        }
      }
    }
  }

  return null;
}

function humanizeAudience(audienceKey: AutoLoginAudienceKey) {
  if (audienceKey === 'admin') {
    return 'Admin';
  }

  if (audienceKey === 'payer') {
    return 'Payer';
  }

  return 'Clinic';
}

function AutoLoginPickerContent({
  initialAudience
}: {
  initialAudience?: AutoLoginAudienceKey;
}) {
  const searchParams = useSearchParams();
  const selectedUserIdentifier = searchParams.get('user')?.trim() ?? '';
  const requestedRedirect = searchParams.get('redirect')?.trim();
  const autoLogin = searchParams.get('auto') === '1';
  const [catalog, setCatalog] = useState<AutoLoginAudience[]>([]);
  const [audienceKey, setAudienceKey] = useState<AutoLoginAudienceKey>(initialAudience ?? 'payer');
  const [companyKey, setCompanyKey] = useState('');
  const [personaKey, setPersonaKey] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoLoginHandledRef = useRef(false);

  const audienceOptions = catalog;
  const selectedAudience = useMemo(
    () => audienceOptions.find((audience) => audience.key === audienceKey) ?? null,
    [audienceKey, audienceOptions]
  );
  const companyOptions = selectedAudience?.companies ?? [];
  const selectedCompany = companyOptions.find((company) => company.key === companyKey) ?? null;
  const personaOptions = selectedCompany?.personas ?? [];
  const selectedPersona = personaOptions.find((persona) => persona.key === personaKey) ?? null;
  const userOptions = selectedPersona?.users ?? [];

  const confirmSessionEstablished = useCallback(async function confirmSessionEstablished() {
    const attempts = 5;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        const payload = (await response.json()) as { sessionEstablished?: boolean };
        if (payload.sessionEstablished === true) {
          return true;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 120));
    }

    return false;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/auth/login/catalog', {
          cache: 'no-store'
        });

        const payload = (await response.json()) as CatalogPayload & { message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? 'Unable to load login options.');
        }

        if (!mounted) {
          return;
        }

        setCatalog(payload.audiences);
      } catch (nextError) {
        if (!mounted) {
          return;
        }

        setCatalog([]);
        setError(nextError instanceof Error ? nextError.message : 'Unable to load login options.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (catalog.length === 0) {
      return;
    }

    const preferredAudience =
      (searchParams.get('audience')?.trim().toLowerCase() as AutoLoginAudienceKey | undefined) ??
      initialAudience;
    const availableAudienceKeys = new Set(catalog.map((audience) => audience.key));

    if (preferredAudience && availableAudienceKeys.has(preferredAudience)) {
      setAudienceKey(preferredAudience);
      return;
    }

    if (!availableAudienceKeys.has(audienceKey)) {
      setAudienceKey(catalog[0]!.key);
    }
  }, [audienceKey, catalog, initialAudience, searchParams]);

  useEffect(() => {
    if (companyOptions.length === 0) {
      setCompanyKey('');
      return;
    }

    if (!companyOptions.some((company) => company.key === companyKey)) {
      setCompanyKey(companyOptions[0]!.key);
    }
  }, [companyKey, companyOptions]);

  useEffect(() => {
    if (personaOptions.length === 0) {
      setPersonaKey('');
      return;
    }

    const preferredPersona = searchParams.get('persona')?.trim();
    if (
      preferredPersona &&
      personaOptions.some((persona) => persona.key === preferredPersona) &&
      personaKey !== preferredPersona
    ) {
      setPersonaKey(preferredPersona);
      return;
    }

    if (!personaOptions.some((persona) => persona.key === personaKey)) {
      setPersonaKey(personaOptions[0]!.key);
    }
  }, [personaKey, personaOptions, searchParams]);

  useEffect(() => {
    if (userOptions.length === 0) {
      setUserId('');
      return;
    }

    if (!userOptions.some((user) => user.id === userId)) {
      setUserId(userOptions[0]!.id);
    }
  }, [userId, userOptions]);

  useEffect(() => {
    if (!selectedUserIdentifier || catalog.length === 0) {
      return;
    }

    const matched = findPrefilledUser(catalog, selectedUserIdentifier);
    if (!matched) {
      return;
    }

    setAudienceKey(matched.audienceKey);
    setCompanyKey(matched.companyKey);
    setPersonaKey(matched.personaKey);
    setUserId(matched.userId);
  }, [catalog, selectedUserIdentifier]);

  const handleAutoLogin = useCallback(async function handleAutoLogin() {
    if (!selectedAudience || !selectedCompany || !selectedPersona || !userId) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audience: selectedAudience.key,
          tenantId: selectedCompany.tenantId,
          persona: selectedPersona.key,
          userId
        })
      });

      const payload = (await response.json()) as {
        sessionEstablished?: boolean;
        sessionHandoff?: boolean;
        handoffUrl?: string;
        message?: string;
        user?: {
          landingContext?:
            | 'member'
            | 'provider'
            | 'broker'
            | 'employer'
            | 'tenant_admin'
            | 'platform_admin';
          session?: {
            type?: 'tenant_admin' | 'end_user' | 'platform_admin';
          };
        };
      };

      if (!response.ok) {
        throw new Error(payload.message ?? 'Unable to sign in with the selected user.');
      }

      if (payload.sessionHandoff && payload.handoffUrl) {
        window.location.assign(payload.handoffUrl);
        return;
      }

      if (payload.sessionEstablished !== true || !payload.user) {
        throw new Error(payload.message ?? 'Unable to sign in with the selected user.');
      }

      const sessionConfirmed = await confirmSessionEstablished();
      if (!sessionConfirmed) {
        throw new Error('Sign-in state is still initializing. Please try again.');
      }

      if (requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')) {
        window.location.assign(requestedRedirect);
        return;
      }

      if (payload.user.session?.type === 'platform_admin' || payload.user.session?.type === 'tenant_admin') {
        throw new Error('Admin sign-in handoff did not complete. Please try again.');
        return;
      }

      if (payload.user.landingContext === 'provider') {
        window.location.assign('/provider/dashboard');
        return;
      }

      if (payload.user.landingContext === 'employer') {
        window.location.assign('/dashboard/billing-enrollment');
        return;
      }

      if (payload.user.landingContext === 'broker') {
        window.location.assign('/broker');
        return;
      }

      window.location.assign('/dashboard');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    confirmSessionEstablished,
    requestedRedirect,
    selectedAudience,
    selectedCompany,
    selectedPersona,
    userId
  ]);

  useEffect(() => {
    if (
      autoLogin &&
      !autoLoginHandledRef.current &&
      !isLoading &&
      selectedAudience &&
      selectedCompany &&
      selectedPersona &&
      userId
    ) {
      autoLoginHandledRef.current = true;
      void handleAutoLogin();
    }
  }, [
    autoLogin,
    handleAutoLogin,
    isLoading,
    selectedAudience,
    selectedCompany,
    selectedPersona,
    userId
  ]);

  return (
    <section className="averra-platform-card p-8 sm:p-10">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--averra-blue)]">
        Unified sign-in
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-white">
        Open the right workspace without hunting for a separate login page
      </h2>
      <p className="averra-platform-text-muted mt-3 text-sm leading-6">
        Choose tenant type, company, persona, and an active user from the live platform database. Newly added active users appear here automatically.
      </p>

      <div className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-white">Tenant type</span>
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--averra-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--averra-blue)]"
            value={audienceKey}
            onChange={(event) => setAudienceKey(event.target.value as AutoLoginAudienceKey)}
            disabled={isLoading || isSubmitting || audienceOptions.length === 0}
          >
            {audienceOptions.map((audience) => (
              <option key={audience.key} value={audience.key}>
                {audience.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-white">Company</span>
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--averra-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--averra-blue)]"
            value={companyKey}
            onChange={(event) => setCompanyKey(event.target.value)}
            disabled={isLoading || isSubmitting || companyOptions.length === 0}
          >
            {companyOptions.map((company) => (
              <option key={company.key} value={company.key}>
                {company.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-white">Persona</span>
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--averra-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--averra-blue)]"
            value={personaKey}
            onChange={(event) => setPersonaKey(event.target.value)}
            disabled={isLoading || isSubmitting || personaOptions.length === 0}
          >
            {personaOptions.map((persona) => (
              <option key={persona.key} value={persona.key}>
                {persona.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-white">Active user</span>
          <select
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--averra-border)] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--averra-blue)]"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            disabled={isLoading || isSubmitting || userOptions.length === 0}
          >
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>
                {user.label} · {user.email}
              </option>
            ))}
          </select>
        </label>

        {selectedAudience ? (
          <div className="rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.05)] px-4 py-4">
            <p className="text-sm font-semibold text-white">
              {humanizeAudience(selectedAudience.key)} access
            </p>
            <p className="averra-platform-text-muted mt-2 text-sm leading-6">
              {selectedAudience.key === 'admin'
                ? 'Platform and tenant administration paths, including control center access.'
                : selectedAudience.key === 'payer'
                  ? 'Payer-facing personas such as member, provider, employer, and broker.'
                  : 'Clinic personas such as office manager, practice manager, billing, and eligibility staff.'}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-[rgba(251,113,133,0.34)] bg-[rgba(127,29,29,0.22)] px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleAutoLogin()}
          disabled={isLoading || isSubmitting || !selectedAudience || !selectedCompany || !selectedPersona || !userId}
          className="averra-platform-button averra-platform-button--primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Opening workspace...' : 'Continue'}
        </button>
      </div>
    </section>
  );
}

export function AutoLoginPicker({
  initialAudience
}: {
  initialAudience?: AutoLoginAudienceKey;
}) {
  return (
    <Suspense fallback={<section className="averra-platform-card min-h-[28rem] p-8 sm:p-10" />}>
      <AutoLoginPickerContent initialAudience={initialAudience} />
    </Suspense>
  );
}
