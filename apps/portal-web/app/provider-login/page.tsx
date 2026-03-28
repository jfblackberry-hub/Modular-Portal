import { redirect } from 'next/navigation';

export default function ProviderLoginPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  params.set('audience', 'provider');

  return Promise.resolve(searchParams).then((resolved) => {
    if (resolved) {
      for (const [key, value] of Object.entries(resolved)) {
        if (key === 'audience' || value === undefined) {
          continue;
        }

        if (Array.isArray(value)) {
          for (const entry of value) {
            params.append(key, entry);
          }
        } else {
          params.set(key, value);
        }
      }
    }

    redirect(`/login?${params.toString()}`);
  });
}
