"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import conferencePhoto from "@/images/landing_1.png";
import laptopPhoto from "@/images/landing_2.png";

/** Shape of a meeting marker */
interface MeetingInfo {
  ticker: string;
  company: string;
  colour: string;
  type: "AGM" | "EGM";
  time: string;
  venue: string;
  hybrid: boolean;
}

/** Sample meeting details for the mockup */
const meetingData: Record<number, MeetingInfo[]> = {
  3:  [{ ticker: "MAYBANK", company: "Malayan Banking Bhd", colour: "#6366F1", type: "AGM", time: "10:00 AM MYT", venue: "Menara Maybank, KL", hybrid: true }],
  12: [{ ticker: "TENAGA", company: "Tenaga Nasional Bhd", colour: "#3B82F6", type: "AGM", time: "2:30 PM MYT", venue: "Bangi Resort Hotel", hybrid: true }],
  22: [{ ticker: "GAMUDA", company: "Gamuda Bhd", colour: "#A855F7", type: "AGM", time: "9:00 AM MYT", venue: "Gamuda HQ, Petaling Jaya", hybrid: false }],
  28: [{ ticker: "MRDIY", company: "MR D.I.Y. Group (M) Bhd", colour: "#10B981", type: "EGM", time: "11:00 AM MYT", venue: "Virtual Only", hybrid: false }],
};

export default function Home() {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingInfo | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const scrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openMeeting = (m: MeetingInfo) => {
    setSelectedMeeting(m);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedMeeting(null), 200); // wait for slide-out
  };

  // Mini calendar grid data — a sample month with a few meeting dots
  const today = new Date();
  const sampleYear = today.getFullYear();
  const sampleMonth = today.getMonth();
  const firstDay = new Date(sampleYear, sampleMonth, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(sampleYear, sampleMonth + 1, 0).getDate();
  const todayDay = today.getDate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-page">
      {/* ---------- Side panel overlay ---------- */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={closePanel}
        />
      )}

      {/* ---------- Side panel (drawer from right) ---------- */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm transform bg-[#151821] shadow-2xl ring-1 ring-white/10 transition-transform duration-200 ease-out ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold text-primary">Meeting Details</h2>
          <button
            onClick={closePanel}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Panel body */}
        {selectedMeeting && (
          <div className="p-5 space-y-5">
            {/* Ticker badge */}
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedMeeting.colour }}
              />
              <span className="text-xl font-extrabold text-primary">
                {selectedMeeting.ticker}
              </span>
              <span
                className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  selectedMeeting.type === "AGM"
                    ? "bg-accent-primary/15 text-accent-primary"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {selectedMeeting.type}
              </span>
            </div>

            {/* Company name */}
            <div>
              <p className="text-xs text-secondary/60 uppercase tracking-wider">Company</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{selectedMeeting.company}</p>
            </div>

            <hr className="border-white/10" />

            {/* Date */}
            <div>
              <p className="text-xs text-secondary/60 uppercase tracking-wider">Date</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">
                {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Time */}
            <div>
              <p className="text-xs text-secondary/60 uppercase tracking-wider">Time</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{selectedMeeting.time}</p>
            </div>

            {/* Venue */}
            <div>
              <p className="text-xs text-secondary/60 uppercase tracking-wider">Venue</p>
              <p className="mt-0.5 text-sm font-semibold text-primary">{selectedMeeting.venue}</p>
            </div>

            {/* Hybrid tag */}
            {selectedMeeting.hybrid && (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-teal-500/30 bg-teal-500/10 px-2.5 py-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-teal-400">
                  <path d="M3.196 12.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 12.87z" />
                  <path d="M3.196 8.87l-.825.483a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.758 0l7.25-4.25a.75.75 0 000-1.294l-.825-.484-5.666 3.322a2.25 2.25 0 01-2.276 0L3.196 8.87z" />
                  <path d="M10.38 1.103a.75.75 0 00-.76 0l-7.25 4.25a.75.75 0 000 1.294l7.25 4.25a.75.75 0 00.76 0l7.25-4.25a.75.75 0 000-1.294l-7.25-4.25z" />
                </svg>
                <span className="text-[11px] font-semibold text-teal-400">Hybrid — Join Online</span>
              </div>
            )}

            <hr className="border-white/10" />

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={closePanel}
                className="flex-1 rounded-lg border border-accent-primary/40 px-4 py-2 text-xs font-bold text-accent-primary transition-colors hover:border-accent-primary/70 hover:bg-accent-primary/5"
              >
                Close
              </button>
              <button className="flex-1 rounded-lg bg-accent-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.97]">
                Add to Calendar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Nav bar ---------- */}
      <nav className="relative z-30 flex items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          AGM Tracker
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-8 sm:px-10">
        {/* Background conference photo with scrim */}
        <div className="absolute inset-0 -z-10">
          <Image
            src={conferencePhoto}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          {/* Dark scrim overlay */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Left gradient fade — photo dissolves into dark background */}
          <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-[#0f1117] via-[#0f1117]/80 to-transparent" />
        </div>

        <div className="flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            {/* Pill / tag */}
            <span className="mb-5 inline-block rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-accent-primary">
              Bursa Malaysia listings
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl" style={{ lineHeight: 1.15 }}>
              AGM{" "}
              <span className="text-accent-primary">
                Meeting Tracker
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "#b0b0b0", lineHeight: 1.65 }}>
              Never miss an AGM again. Create portfolios, track your stock holdings, and
              monitor upcoming corporate meetings — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/login"
                className="rounded-lg bg-accent-primary px-7 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.97]"
              >
                Get Started Free
              </Link>
              <button
                onClick={scrollToHowItWorks}
                className="rounded-lg border border-accent-primary/40 px-7 py-3.5 text-sm font-bold text-accent-primary transition-colors hover:border-accent-primary/70 hover:bg-accent-primary/5"
              >
                See how it works
              </button>
            </div>
          </div>

          {/* Right: floating calendar mockup */}
          <div className="flex-shrink-0">
            <div className="relative w-72 overflow-hidden rounded-xl bg-[#1a1d27] shadow-2xl shadow-black/40 ring-1 ring-white/10 sm:w-80 lg:w-[420px]">
              {/* Mockup browser bar */}
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-3 flex-1 rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/50">
                  agmtracker.app/dashboard
                </span>
              </div>
              {/* Mockup body: calendar */}
              <div className="p-3 sm:p-4">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white/80">
                    {firstDay.toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-white/10" />
                    <span className="h-3 w-3 rounded bg-white/10" />
                    <span className="ml-1 rounded bg-accent-primary/30 px-1.5 py-0.5 text-[8px] font-semibold text-accent-primary">
                      Today
                    </span>
                  </div>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 text-center text-[9px] font-medium text-white/40 mb-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="py-0.5">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 text-xs">
                  {(() => {
                    const cells: React.ReactNode[] = [];
                    for (let i = 0; i < startOffset; i++) {
                      cells.push(<div key={`empty-${i}`} className="min-h-[44px] p-0.5" />);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const markers = meetingData[day] ?? [];
                      const isToday = day === todayDay;
                      cells.push(
                        <div
                          key={day}
                          className={`min-h-[44px] p-0.5 border-t border-l border-white/10 ${
                            isToday ? "bg-white/10" : ""
                          }`}
                        >
                          <div
                            className={`text-[10px] font-medium mb-0.5 ${
                              isToday
                                ? "inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-primary text-white"
                                : "text-white/50"
                            }`}
                          >
                            {day}
                          </div>
                          {markers.map((m, i) => (
                            <button
                              key={i}
                              onClick={() => openMeeting(m)}
                              className="flex w-full items-center gap-0.5 mb-0.5 rounded px-0.5 transition-colors hover:bg-white/5"
                            >
                              <span
                                className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: m.colour }}
                              />
                              <span className="text-[8px] font-bold text-white/70 truncate leading-none">
                                {m.ticker}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
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
          <p className="mt-3 text-center text-secondary" style={{ lineHeight: 1.65 }}>
            Simple tools to manage your portfolio and track AGMs.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 — Portfolio */}
            <div className="group rounded-xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#7c6fff]/15" style={{ color: "#7c6fff" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-primary">Portfolio Tracker</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary" style={{ lineHeight: 1.65 }}>
                Built-in portfolio management. Create colour-coded portfolios, add stocks,
                and track your holdings in one place.
              </p>
            </div>

            {/* Card 2 — Calendar */}
            <div className="group rounded-xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500/15" style={{ color: "#14b8a6" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-primary">Meeting Calendar</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary" style={{ lineHeight: 1.65 }}>
                View all upcoming AGMs and EGMs at a glance — including dates, times,
                venue types, and physical meeting locations.
              </p>
            </div>

            {/* Card 3 — Links */}
            <div className="group rounded-xl bg-card p-6 shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 lg:col-span-1" style={{ transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/15" style={{ color: "#f59e0b" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-primary">Meeting Links</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary" style={{ lineHeight: 1.65 }}>
                Hybrid meetings include direct join links so you can participate virtually
                without searching for the details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Divider band (laptop photo with overlay + quote) ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={laptopPhoto}
            alt=""
            fill
            className="object-cover object-center"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative z-10 flex items-center justify-center px-6 py-24 sm:px-10 sm:py-32">
          <div className="text-center">
            <p className="text-xl font-semibold tracking-tight text-white/90 sm:text-2xl lg:text-3xl" style={{ lineHeight: 1.65 }}>
              &ldquo;Join 2,000+ shareholders tracking AGMs&rdquo;
            </p>
            <p className="mt-3 text-sm text-white/50">
              Stay informed. Never miss a vote.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- How It Works ---------- */}
      <section id="how-it-works" className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-primary sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 text-center text-secondary" style={{ lineHeight: 1.65 }}>
            Get started in three simple steps.
          </p>

          <div className="relative mt-14 grid gap-10 sm:grid-cols-3">
            {/* Horizontal connecting line behind steps */}
            <div aria-hidden className="pointer-events-none absolute left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] top-6 hidden h-px sm:block" style={{ background: "linear-gradient(to right, #7c6fff44, #7c6fff88, #7c6fff44)" }} />

            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-lg font-bold text-white">
                1
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">Sign In</h3>
              <p className="mt-2 text-sm text-secondary" style={{ lineHeight: 1.65 }}>
                Sign in with your Google account. No registration forms needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-lg font-bold text-white">
                2
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">Add Stocks</h3>
              <p className="mt-2 text-sm text-secondary" style={{ lineHeight: 1.65 }}>
                Create portfolios and add stocks by searching the Bursa Malaysia listing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-lg font-bold text-white">
                3
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">Track Meetings</h3>
              <p className="mt-2 text-sm text-secondary" style={{ lineHeight: 1.65 }}>
                View your calendar and never miss an AGM or EGM again — whether it's
                virtual, physical, or hybrid.
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