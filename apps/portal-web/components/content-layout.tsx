export function ContentLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section
      id="main-content"
      className="min-w-0 space-y-5 rounded-[24px] sm:p-1"
    >
      {children}
    </section>
  );
}
