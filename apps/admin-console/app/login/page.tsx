import { AdminLoginForm } from './admin-login-form';

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-admin-bg px-6 py-12 text-admin-text">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-admin-border bg-white p-10 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Admin Access
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-admin-text">
            Sign in to the administrative console.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-admin-muted">
            Use the local shorthand accounts to switch between tenant and platform
            administration without editing environment variables.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['tenant', 'Tenant admin'],
              ['admin', 'Platform admin'],
              ['maria', 'Portal member']
            ].map(([username, label]) => (
              <article
                key={username}
                className="rounded-2xl border border-admin-border bg-slate-50 p-5"
              >
                <p className="text-sm font-semibold text-admin-text">{label}</p>
                <p className="mt-2 font-mono text-sm text-admin-muted">{username}</p>
                <p className="mt-2 text-xs text-admin-muted">
                  Any non-empty password works locally.
                </p>
              </article>
            ))}
          </div>
        </section>

        <AdminLoginForm />
      </div>
    </main>
  );
}
