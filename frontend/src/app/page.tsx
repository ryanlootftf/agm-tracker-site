import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page p-8">
      <main className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
          AGM Meeting Tracker
        </h1>
        <p className="mt-6 text-lg leading-8 text-secondary">
          Never miss an AGM again. Track your stock portfolio,
          monitor upcoming meetings, and stay on top of important
          corporate events — all in one place.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-accent-bg px-6 py-3 text-sm font-semibold text-accent-text shadow-sm hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-card px-6 py-3 text-sm font-semibold text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-elevated transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-sm text-secondary">
        AGM Meeting Tracker &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}