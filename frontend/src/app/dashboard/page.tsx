"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

// ---------- Types ----------
interface Profile {
  id: string;
  email?: string;
  name?: string;
}

interface Stock {
  stock_code: string;
  symbol: string;
  company_name: string;
}

interface Portfolio {
  id: string;
  name: string;
  colour: string;
}

interface Holding {
  id: string;
  stock_code: string;
  shares: number | null;
  stocks?: Stock;
}

interface AGMEvent {
  id: string;
  stock_code: string;
  stock_ticker: string;
  meeting_date: string;
  meeting_time: string | null;
  meeting_type: string;
  meeting_location: string | null;
  venue_type: string;
  meeting_link: string | null;
}

interface HolderInfo {
  colour: string;
  name: string;
}

// ---------- Component ----------
export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [holdingsMap, setHoldingsMap] = useState<Record<string, Holding[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Add stock modal state
  const [showAddStock, setShowAddStock] = useState(false);
  const [addPortfolioId, setAddPortfolioId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [shares, setShares] = useState("");
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Manage holding modal state
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [modalShares, setModalShares] = useState("");

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // AGM calendar state
  const [agmEvents, setAgmEvents] = useState<AGMEvent[]>([]);
  const [holderMap, setHolderMap] = useState<Record<string, HolderInfo[]>>({});
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<AGMEvent | null>(null);
  const [selectedDateList, setSelectedDateList] = useState<string | null>(null);

  // Portfolio collapse state (starts collapsed)
  const [collapsedPfs, setCollapsedPfs] = useState<Set<string>>(new Set());
  const [initialCollapseDone, setInitialCollapseDone] = useState(false);

  // Add portfolio modal state
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioColour, setNewPortfolioColour] = useState("#6366F1");

  const PRESET_COLOURS = [
    "#6366F1", // indigo
    "#3B82F6", // blue
    "#10B981", // green
    "#EAB308", // yellow
    "#F97316", // orange
    "#EF4444", // red
    "#EC4899", // pink
    "#A855F7", // purple
  ];

  // ---------- Data fetching ----------
  const fetchData = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }

    const { data: p } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", authUser.id)
      .single();
    if (p) setProfile(p);

    const { data: pf } = await supabase
      .from("portfolios")
      .select("*")
      .order("created_at");
    if (pf) {
      setPortfolios(pf);
      // collapse portfolios by default on first load
      if (!initialCollapseDone) {
        setCollapsedPfs(new Set(pf.map((p) => p.id)));
        setInitialCollapseDone(true);
      }
      // fetch holdings for each portfolio
      const hMap: Record<string, Holding[]> = {};
      await Promise.all(
        pf.map(async (port) => {
          const { data: h } = await supabase
            .from("holdings")
            .select("id, stock_code, shares")
            .eq("portfolio_id", port.id);
          if (h) {
            // fetch stock details for each holding
            const enriched = await Promise.all(
              h.map(async (holding) => {
                const { data: s } = await supabase
                  .from("stocks")
                  .select("stock_code, symbol, company_name")
                  .eq("stock_code", holding.stock_code)
                  .single();
                return { ...holding, stocks: s ?? undefined };
              })
            );
            hMap[port.id] = enriched;
          } else {
            hMap[port.id] = [];
          }
        })
      );
      setHoldingsMap(hMap);

      // Build colour map: stock_code → which portfolios own it
      const colourMap: Record<string, HolderInfo[]> = {};
      for (const port of pf) {
        const hList = hMap[port.id] ?? [];
        for (const h of hList) {
          if (!colourMap[h.stock_code]) colourMap[h.stock_code] = [];
          if (!colourMap[h.stock_code].some((hi) => hi.colour === port.colour)) {
            colourMap[h.stock_code].push({ colour: port.colour, name: port.name });
          }
        }
      }
      setHolderMap(colourMap);

      // Fetch upcoming AGM events for all held stock codes
      const allCodes = Object.keys(colourMap);
      if (allCodes.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const { data: events } = await supabase
          .from("agm_events")
          .select("*")
          .in("stock_code", allCodes)
          .gte("meeting_date", today)
          .eq("is_active", true)
          .order("meeting_date", { ascending: true });
        if (events) setAgmEvents(events);
      }
    }

    setLoading(false);
  }, [router, initialCollapseDone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Stock search ----------
  useEffect(() => {
    if (!showAddStock || !searchTerm || searchTerm.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const term = `*${searchTerm.toUpperCase()}*`;
      const { data } = await supabase
        .from("stocks")
        .select("stock_code, symbol, company_name")
        .or(`symbol.ilike.${term},company_name.ilike.${term},stock_code.ilike.${term}`)
        .eq("is_active", true)
        .limit(10);
      if (data) setSearchResults(data);
      setSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, showAddStock]);

  // ---------- Manage holding modal ----------
  const handleOpenHoldingModal = (holding: Holding) => {
    setSelectedHolding(holding);
    setModalShares(holding.shares?.toString() ?? "");
  };

  const handleCloseHoldingModal = () => {
    setSelectedHolding(null);
    setModalShares("");
  };

  const handleSaveSharesModal = async () => {
    if (!selectedHolding) return;
    const newShares = parseInt(modalShares, 10);
    if (isNaN(newShares) || newShares < 1) return;
    await supabase.from("holdings").update({ shares: newShares }).eq("id", selectedHolding.id);
    handleCloseHoldingModal();
    fetchData();
  };

  const handleDeleteHoldingModal = async () => {
    if (!selectedHolding) return;
    const symbol = selectedHolding.stocks?.symbol ?? selectedHolding.stock_code;
    setConfirmDialog({
      message: `Remove ${symbol} from this portfolio?`,
      onConfirm: async () => {
        await supabase.from("holdings").delete().eq("id", selectedHolding.id);
        handleCloseHoldingModal();
        fetchData();
      },
    });
  };

  // ---------- Portfolio CRUD ----------
  const usedColours = new Set(portfolios.map((pf) => pf.colour));

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    if (usedColours.has(newPortfolioColour)) {
      alert("That colour is already in use by another portfolio. Please pick a different colour.");
      return;
    }
    await supabase.from("portfolios").insert({
      user_id: profile!.id,
      name: newPortfolioName.trim(),
      colour: newPortfolioColour,
    });
    setShowAddPortfolio(false);
    setNewPortfolioName("");
    setNewPortfolioColour("#6366F1");
    fetchData();
  };

  const handleDeletePortfolio = (id: string, name: string) => {
    setConfirmDialog({
      message: `Delete portfolio "${name}" and all its holdings?`,
      onConfirm: async () => {
        await supabase.from("holdings").delete().eq("portfolio_id", id);
        await supabase.from("portfolios").delete().eq("id", id);
        fetchData();
      },
    });
  };

  // ---------- Add holding ----------
  const handleAddHolding = async () => {
    if (!addPortfolioId || !selectedStock || !shares) return;

    const { error } = await supabase.from("holdings").insert({
      portfolio_id: addPortfolioId,
      stock_code: selectedStock.stock_code,
      shares: parseInt(shares, 10),
    });

    if (!error) {
      setShowAddStock(false);
      setSearchTerm("");
      setSelectedStock(null);
      setShares("");
      fetchData();
    } else {
      console.error("Add holding error:", error.message);
    }
  };

  // ---------- Sign out ----------
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <p className="text-sm text-secondary">Loading…</p>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-page">
      {/* Top navigation bar */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-primary">
            AGM Meeting Tracker
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary hidden sm:inline">
              {profile?.name ?? profile?.email ?? "Signed in"}
            </span>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="rounded-md bg-elevated px-3 py-1.5 text-sm font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-elevated/80 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Portfolios */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-secondary uppercase tracking-wide">
              Portfolios
            </h2>
            <button
              onClick={() => setShowAddPortfolio(true)}
              className="text-base font-medium text-accent-text hover:brightness-110 transition-colors"
            >
              + Add Portfolio
            </button>
          </div>

          {portfolios.length === 0 && (
            <div className="rounded-lg bg-card p-4 shadow-sm ring-1 ring-border">
              <p className="text-sm text-secondary">
                No portfolios yet. Create one to get started.
              </p>
            </div>
          )}

          {portfolios.map((pf) => (
            <div
              key={pf.id}
              className="rounded-lg bg-card p-3 shadow-sm ring-1 ring-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-5 w-5 rounded-full"
                    style={{ backgroundColor: pf.colour }}
                  />
                  <h3 className="text-base font-semibold text-primary">
                    {pf.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {!collapsedPfs.has(pf.id) && (
                    <>
                      <button
                        onClick={() => {
                          setAddPortfolioId(pf.id);
                          setShowAddStock(true);
                          setTimeout(() => searchInputRef.current?.focus(), 100);
                        }}
                        className="text-accent-text hover:brightness-110 transition-colors"
                        title="Add symbol"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                      <span className="text-border select-none text-xs">|</span>
                      <button
                        onClick={() => handleDeletePortfolio(pf.id, pf.name)}
                        className="text-secondary/40 hover:text-red-400 transition-colors"
                        title="Delete portfolio"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      <span className="text-border select-none text-xs ml-1 mr-1">|</span>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setCollapsedPfs((prev) => {
                        const next = new Set(prev);
                        if (next.has(pf.id)) next.delete(pf.id);
                        else next.add(pf.id);
                        return next;
                      });
                    }}
                    className="text-secondary hover:text-primary transition-colors"
                    title={collapsedPfs.has(pf.id) ? "Expand" : "Collapse"}
                  >
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${
                        collapsedPfs.has(pf.id) ? "rotate-0" : "rotate-180"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Holdings */}
              {(!collapsedPfs.has(pf.id) && (!holdingsMap[pf.id] || holdingsMap[pf.id].length === 0)) && (
                <p className="text-sm text-secondary ml-6">
                  No holdings yet.
                </p>
              )}

              {holdingsMap[pf.id]?.length > 0 && (
                <div className={`ml-6 space-y-0.5 ${collapsedPfs.has(pf.id) ? "hidden" : ""}`}>
                  {holdingsMap[pf.id].map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleOpenHoldingModal(h)}
                      className="flex w-full items-center gap-2 text-left hover:bg-elevated rounded px-1 py-0.5 transition-colors"
                    >
                      <span className="text-sm font-medium text-primary">
                        {h.stocks?.symbol ?? h.stock_code}
                      </span>
                      <span className="text-secondary text-sm">
                        {h.stocks?.company_name ?? ""}
                      </span>
                      <span className="ml-auto text-sm text-secondary/50">
                        {h.shares != null ? `${h.shares.toLocaleString()} shares` : "0 shares"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>

        {/* ---------- AGM Calendar ---------- */}
        <div className="rounded-lg bg-card p-6 shadow-sm ring-1 ring-border">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">
              AGM Calendar
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                }}
                className="rounded-md p-1 text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-sm font-medium text-primary min-w-[120px] text-center">
                {new Date(calendarYear, calendarMonth).toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}
                className="rounded-md p-1 text-secondary hover:bg-elevated hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setCalendarMonth(new Date().getMonth());
                  setCalendarYear(new Date().getFullYear());
                }}
                className="rounded-md px-2 py-1 text-xs font-medium text-accent-text hover:brightness-110 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-secondary mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {selectedDateList ? (
            /* ---------- Inline Day List View ---------- */
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setSelectedDateList(null)}
                  className="rounded-md p-1 text-secondary hover:bg-elevated hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-base font-semibold text-primary">
                    {new Date(selectedDateList + "T00:00:00").toLocaleDateString("en-MY", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-xs text-secondary">
                    {(() => {
                      const dayEvents = agmEvents.filter((ev) => ev.meeting_date === selectedDateList);
                      return `${dayEvents.length} meeting${dayEvents.length > 1 ? "s" : ""}`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {agmEvents
                  .filter((ev) => ev.meeting_date === selectedDateList)
                  .map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev);
                      }}
                      className="flex items-start gap-3 w-full text-left rounded-lg p-3 hover:bg-elevated transition-colors ring-1 ring-inset ring-border/50"
                    >
                      {/* Colour dots */}
                      <div className="flex -space-x-1 shrink-0 mt-0.5">
                        {(holderMap[ev.stock_code] ?? []).map((h, i) => (
                          <span
                            key={i}
                            className="inline-block h-3 w-3 rounded-full ring-1 ring-card"
                            style={{ backgroundColor: h.colour }}
                            title={h.name}
                          />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-primary">
                          {ev.stock_ticker}
                        </div>
                        <div className="text-xs text-secondary truncate">
                          {ev.meeting_type}{ev.meeting_time ? ` · ${ev.meeting_time}` : ""}
                        </div>
                        <div className="text-xs text-secondary/60 truncate">
                          {ev.venue_type}{ev.meeting_location ? ` — ${ev.meeting_location}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 text-sm">
                {(() => {
                  const firstDay = new Date(calendarYear, calendarMonth, 1);
                  let startOffset = firstDay.getDay() - 1;
                  if (startOffset < 0) startOffset = 6;
                  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                  const today = new Date().toISOString().split("T")[0];

                  const eventsByDate: Record<string, AGMEvent[]> = {};
                  for (const ev of agmEvents) {
                    const d = ev.meeting_date;
                    if (!eventsByDate[d]) eventsByDate[d] = [];
                    eventsByDate[d].push(ev);
                  }

                  const cells: React.ReactNode[] = [];

                  for (let i = 0; i < startOffset; i++) {
                    cells.push(<div key={`empty-${i}`} className="min-h-[80px] p-1" />);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayEvents = eventsByDate[dateStr] ?? [];
                    const isToday = dateStr === today;

                    cells.push(
                      <div
                        key={day}
                        onClick={() => {
                          if (dayEvents.length > 0) {
                            setSelectedDateList(dateStr);
                          }
                        }}
                        className={`min-h-[80px] p-1 border-t border-l border-border ${
                          isToday ? "bg-today-bg" : ""
                        } ${dayEvents.length > 0 ? "cursor-pointer hover:bg-elevated/50" : ""}`}
                      >
                        <div
                          className={`text-xs font-medium mb-1 ${
                            isToday
                              ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-today-bg text-today-text"
                              : "text-secondary"
                          }`}
                        >
                          {day}
                        </div>
                        {dayEvents.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className="flex items-center gap-0.5 w-full text-left rounded px-0.5 py-0.5 hover:bg-elevated transition-colors mb-0.5"
                          >
                            <div className="flex -space-x-0.5 shrink-0">
                              {(holderMap[ev.stock_code] ?? []).map((h, i) => (
                                <span
                                  key={i}
                                  className="inline-block h-2 w-2 rounded-full ring-1 ring-card"
                                  style={{ backgroundColor: h.colour }}
                                  title={h.name}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-medium text-primary truncate">
                              {ev.stock_ticker}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Empty state */}
              {agmEvents.length === 0 && (
                <p className="mt-4 text-center text-xs text-secondary">
                  No upcoming AGM events for your holdings.
                </p>
              )}
            </>
          )}
        </div>
      </main>


      {/* ---------- Event Detail Popover ---------- */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedEvent(null)}>
          <div
            className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {selectedEvent.stock_ticker}
                </h3>
                <p className="text-sm text-secondary">{selectedEvent.stock_code}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-secondary hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Date</span>
                <span className="text-primary font-medium">
                  {new Date(selectedEvent.meeting_date + "T00:00:00").toLocaleDateString("en-MY", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {selectedEvent.meeting_time && (
                <div className="flex justify-between">
                  <span className="text-secondary">Time</span>
                  <span className="text-primary">{selectedEvent.meeting_time}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-secondary">Type</span>
                <span className="text-primary">{selectedEvent.meeting_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Venue</span>
                <span className="text-primary">{selectedEvent.venue_type}</span>
              </div>
              {selectedEvent.meeting_location && (
                <div className="flex justify-between">
                  <span className="text-secondary">Location</span>
                  <span className="text-primary text-right max-w-[200px]">{selectedEvent.meeting_location}</span>
                </div>
              )}
            </div>

            {/* Portfolios holding this stock */}
            {(holderMap[selectedEvent.stock_code] ?? []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Held by portfolios</p>
                <div className="flex flex-wrap gap-2">
                  {(holderMap[selectedEvent.stock_code] ?? []).map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: h.colour }}
                    >
                      {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent.meeting_link && selectedEvent.venue_type?.toLowerCase() === "hybrid" && (
              <a
                href={selectedEvent.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full rounded-md bg-accent-bg px-4 py-2 text-center text-sm font-medium text-accent-text shadow-sm hover:brightness-110 transition-colors"
              >
                Open Meeting Link
              </a>
            )}
          </div>
        </div>
      )}

      {/* ---------- Confirm Dialog ---------- */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <p className="text-sm text-primary">{confirmDialog.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-md bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:brightness-110 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Add Portfolio Modal ---------- */}
      {showAddPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Create Portfolio
            </h3>

            <label className="block text-sm font-medium text-primary mb-1">
              Portfolio name
            </label>
            <input
              type="text"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreatePortfolio(); }}
              placeholder="e.g. Retirement Fund"
              className="block w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-primary shadow-sm placeholder-secondary/50 focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text"
              autoFocus
            />

            <label className="block text-sm font-medium text-primary mt-4 mb-2">
              Colour
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLOURS.map((c) => {
                const isTaken = usedColours.has(c);
                return (
                  <button
                    key={c}
                    onClick={() => !isTaken && setNewPortfolioColour(c)}
                    disabled={isTaken}
                    className={`h-8 w-8 rounded-full transition-all relative ${
                      isTaken
                        ? "opacity-30 cursor-not-allowed"
                        : newPortfolioColour === c
                          ? "ring-2 ring-offset-2 ring-offset-card ring-border scale-110"
                          : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                    title={isTaken ? "Already in use" : c}
                  >
                    {isTaken && (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
              <label
                className={`h-8 w-8 rounded-full bg-elevated cursor-pointer flex items-center justify-center text-xs text-secondary hover:scale-110 transition-all ${
                  !PRESET_COLOURS.includes(newPortfolioColour)
                    ? "ring-2 ring-offset-2 ring-offset-card ring-border scale-110"
                    : ""
                }`}
              >
                <input
                  type="color"
                  value={newPortfolioColour}
                  onChange={(e) => setNewPortfolioColour(e.target.value)}
                  className="sr-only"
                />
                +
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPortfolio(false);
                  setNewPortfolioName("");
                  setNewPortfolioColour("#6366F1");
                }}
                className="rounded-md bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:brightness-110 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePortfolio}
                disabled={!newPortfolioName.trim()}
                className="rounded-md bg-accent-bg px-4 py-2 text-sm font-medium text-accent-text shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Manage Holding Modal ---------- */}
      {selectedHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Manage Holding
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-secondary">Symbol:</span>{" "}
                <span className="text-primary">{selectedHolding.stocks?.symbol ?? selectedHolding.stock_code}</span>
              </div>
              <div>
                <span className="font-medium text-secondary">Company:</span>{" "}
                <span className="text-primary">{selectedHolding.stocks?.company_name ?? "—"}</span>
              </div>
              <div>
                <span className="font-medium text-secondary">Stock Code:</span>{" "}
                <span className="text-primary">{selectedHolding.stock_code}</span>
              </div>
            </div>

            <label className="block text-sm font-medium text-primary mt-5 mb-1">
              Number of shares
            </label>
            <input
              type="number"
              min="1"
              value={modalShares}
              onChange={(e) => setModalShares(e.target.value)}
              className="block w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-primary shadow-sm placeholder-secondary/50 focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text"
            />

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleDeleteHoldingModal}
                className="rounded-md bg-red-900/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/40 transition-colors"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseHoldingModal}
                  className="rounded-md bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:brightness-110 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSharesModal}
                  disabled={!modalShares}
                  className="rounded-md bg-accent-bg px-4 py-2 text-sm font-medium text-accent-text shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Add Stock Modal ---------- */}
      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl ring-1 ring-border">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Add Stock to Portfolio
            </h3>

            {/* Search */}
            <label className="block text-sm font-medium text-primary mb-1">
              Search by symbol or company name
            </label>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedStock(null);
              }}
              placeholder="e.g. 0001, MAYBANK, or Scomnet"
              className="block w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-primary shadow-sm placeholder-secondary/50 focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text"
            />

            {/* Results */}
            <div className="mt-2 max-h-48 overflow-y-auto">
              {searching && (
                <p className="text-xs text-secondary py-2">Searching…</p>
              )}
              {!searching && searchTerm && searchResults.length === 0 && (
                <p className="text-xs text-secondary py-2">No results.</p>
              )}
              {searchResults.map((stock) => (
                <button
                  key={stock.stock_code}
                  onClick={() => {
                    setSelectedStock(stock);
                    setSearchTerm(
                      `${stock.symbol}`
                    );
                    setSearchResults([]);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedStock?.stock_code === stock.stock_code
                      ? "bg-accent-bg ring-1 ring-accent-text"
                      : "hover:bg-elevated"
                  }`}
                >
                  <span className="font-bold text-primary">
                    {stock.symbol}
                  </span>
                  <span className="ml-2 text-secondary text-xs">
                    {stock.stock_code}
                  </span>
                  <span className="ml-2 text-secondary">
                    {stock.company_name}
                  </span>
                </button>
              ))}
            </div>

            {/* Shares */}
            <label className="block text-sm font-medium text-primary mt-4 mb-1">
              Number of shares
            </label>
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="e.g. 1000"
              className="block w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-primary shadow-sm placeholder-secondary/50 focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text"
            />

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddStock(false);
                  setSearchTerm("");
                  setSelectedStock(null);
                  setShares("");
                }}
                className="rounded-md bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:brightness-110 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHolding}
                disabled={!selectedStock || !shares}
                className="rounded-md bg-accent-bg px-4 py-2 text-sm font-medium text-accent-text shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}