import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <main className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          AGM Meeting Tracker
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Never miss an AGM again. Track your stock portfolio,
          monitor upcoming meetings, and stay on top of important
          corporate events — all in one place.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-400">
        AGM Meeting Tracker &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}