"use client";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">
            AGM Meeting Tracker
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Not signed in
            </span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Portfolio colour legend placeholder */}
        <div className="mb-8 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Portfolios
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            No portfolios yet. Create one to get started.
          </p>
        </div>

        {/* Calendar placeholder */}
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-indigo-50 p-4 mb-4">
              <svg
                className="h-8 w-8 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Your AGM Calendar
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
              Your upcoming AGM meetings will appear here once you
              add holdings to your portfolios and the daily scraper
              has fetched the latest data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}