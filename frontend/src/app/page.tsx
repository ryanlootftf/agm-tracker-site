import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
      {/* ---------- Decorative background blobs ---------- */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[600px] w-[600px] rounded-full bg-accent-bg/20 blur-3xl" />
        <div className="absolute -bottom-40 left-[-10%] h-[500px] w-[500px] rounded-full bg-accent-bg/10 blur-3xl" />
      </div>

      {/* ---------- Nav bar ---------- */}
      <nav className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          AGM Tracker
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-accent-bg px-4 py-2 text-sm font-semibold text-accent-text hover:brightness-110 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-12 sm:px-10">
        <div className="flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl">
              AGM{" "}
              <span className="bg-gradient-to-r from-accent-text to-purple-400 bg-clip-text text-transparent">
                Meeting Tracker
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-secondary lg:text-xl">
              Never miss an AGM again. Create portfolios, track your stock holdings, and
              monitor upcoming corporate meetings — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/login"
                className="rounded-lg bg-accent-bg px-7 py-3.5 text-sm font-bold text-accent-text shadow-sm hover:brightness-110 transition-all active:scale-[0.97]"
              >
                Get Started Free
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-card px-7 py-3.5 text-sm font-bold text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-elevated transition-all active:scale-[0.97]"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Right: illustration */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Calendar + chart SVG */}
              <svg
                width="280"
                height="240"
                viewBox="0 0 280 240"
                fill="none"
                className="h-auto w-64 sm:w-72 lg:w-80"
              >
                {/* Calendar body */}
                <rect x="40" y="50" width="200" height="160" rx="16" className="fill-card stroke-border" strokeWidth="2" />
                {/* Calendar header bar */}
                <rect x="40" y="50" width="200" height="40" rx="16" className="fill-accent-bg" />
                <rect x="40" y="74" width="200" height="16" className="fill-accent-bg" />
                {/* Month label */}
                <text x="140" y="75" textAnchor="middle" className="fill-accent-text text-sm" fontWeight="700">
                  MAY 2026
                </text>
                {/* Date grid dots */}
                <circle cx="68" cy="112" r="6" className="fill-accent-text/60" />
                <circle cx="100" cy="112" r="6" className="fill-accent-text/60" />
                <circle cx="132" cy="112" r="6" className="fill-accent-text/60" />
                <circle cx="164" cy="112" r="6" className="fill-accent-text/60" />
                <circle cx="196" cy="112" r="6" className="fill-accent-text/60" />
                <circle cx="68" cy="144" r="6" className="fill-accent-text/60" />
                <circle cx="100" cy="144" r="6" className="fill-accent-text/60" />
                <circle cx="132" cy="144" r="6" className="fill-accent-text/60" />
                <circle cx="164" cy="144" r="6" className="fill-accent-text/60" />
                <circle cx="196" cy="144" r="6" className="fill-accent-text/60" />
                <circle cx="68" cy="176" r="6" className="fill-accent-text/60" />
                <circle cx="100" cy="176" r="6" className="fill-accent-text/60" />
                <circle cx="132" cy="176" r="6" className="fill-accent-text/60" />
                <circle cx="164" cy="176" r="6" className="fill-accent-text/60" />
                <circle cx="196" cy="176" r="6" className="fill-accent-text/60" />
                {/* Highlighted date (today) */}
                <circle cx="132" cy="144" r="8" className="fill-accent-text" />
                <text x="132" y="148" textAnchor="middle" className="fill-white text-[10px]" fontWeight="bold">
                  15
                </text>
                {/* Little chart line on the side */}
                <polyline points="228,120 240,110 252,130 264,100 276,105" className="stroke-accent-text/40" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="bg-card/60 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">
            Everything you need to stay on top of meetings
          </h2>
          <p className="mt-3 text-center text-secondary">
            Simple tools to manage your portfolio and track AGMs.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-bg text-xl">
                📊
              </div>
              <h3 className="text-lg font-bold text-primary">Portfolio Tracker</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Built-in portfolio management. Create colour-coded portfolios, add stocks,
                and track your holdings in one place.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-bg text-xl">
                📅
              </div>
              <h3 className="text-lg font-bold text-primary">Meeting Calendar</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                View all upcoming AGMs and EGMs at a glance. Filter by portfolio and see
                which stocks have meetings on each day.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-bg text-xl">
                🔗
              </div>
              <h3 className="text-lg font-bold text-primary">Meeting Links</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Hybrid meetings include direct join links so you can participate virtually
                without searching for the details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How It Works ---------- */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-center text-secondary">
            Get started in three simple steps.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-lg font-bold text-accent-text">
                1
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">Sign In</h3>
              <p className="mt-2 text-sm text-secondary">
                Sign in with your Google account. No registration forms needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-lg font-bold text-accent-text">
                2
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">Add Stocks</h3>
              <p className="mt-2 text-sm text-secondary">
                Create portfolios and add stocks by searching the Bursa Malaysia listing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-lg font-bold text-accent-text">
                3
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">Track Meetings</h3>
              <p className="mt-2 text-sm text-secondary">
                View your calendar and never miss an AGM or EGM again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-sm font-medium text-secondary">
            &copy; {new Date().getFullYear()} AGM Meeting Tracker
          </p>
          <p className="text-xs text-secondary/60">
            Data sourced from i3investor &middot; Bursa Malaysia
          </p>
        </div>
      </footer>
    </div>
  );
}