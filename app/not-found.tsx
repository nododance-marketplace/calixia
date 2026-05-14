import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-wider text-text-secondary">404</p>
      <h1 className="mt-2 text-2xl text-text-primary">Page not found.</h1>
      <Link href="/" className="mt-6 text-accent hover:text-accent-hover">
        Back to home
      </Link>
    </main>
  );
}
