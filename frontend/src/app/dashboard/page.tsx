"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

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
    }

    setLoading(false);
  }, [router]);

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
    if (!confirm(`Remove ${symbol} from this portfolio?`)) return;
    await supabase.from("holdings").delete().eq("id", selectedHolding.id);
    handleCloseHoldingModal();
    fetchData();
  };

  // ---------- Portfolio CRUD ----------
  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
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

  const handleDeletePortfolio = async (id: string, name: string) => {
    if (!confirm(`Delete portfolio "${name}" and all its holdings?`)) return;
    await supabase.from("holdings").delete().eq("portfolio_id", id);
    await supabase.from("portfolios").delete().eq("id", id);
    fetchData();
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  // ---------- Render ----------
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
              {profile?.name ?? profile?.email ?? "Signed in"}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
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
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Portfolios
            </h2>
            <button
              onClick={() => setShowAddPortfolio(true)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              + Add Portfolio
            </button>
          </div>

          {portfolios.length === 0 && (
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-400">
                No portfolios yet. Create one to get started.
              </p>
            </div>
          )}

          {portfolios.map((pf) => (
            <div
              key={pf.id}
              className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: pf.colour }}
                  />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {pf.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAddPortfolioId(pf.id);
                      setShowAddStock(true);
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    + Add Stock
                  </button>
                  <button
                    onClick={() => handleDeletePortfolio(pf.id, pf.name)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Delete portfolio"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Holdings */}
              {(!holdingsMap[pf.id] || holdingsMap[pf.id].length === 0) && (
                <p className="text-xs text-gray-400 ml-7">
                  No holdings yet.
                </p>
              )}

              {holdingsMap[pf.id]?.length > 0 && (
                <div className="ml-7 space-y-1">
                  {holdingsMap[pf.id].map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <button
                        onClick={() => handleOpenHoldingModal(h)}
                        className="flex items-center gap-2 text-left hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                      >
                        <span className="font-medium text-gray-900">
                          {h.stocks?.symbol ?? h.stock_code}
                        </span>
                        <span className="text-gray-500">
                          {h.stocks?.company_name ?? ""}
                        </span>
                      </button>
                      <span className="text-gray-400 text-xs">
                        {h.shares != null ? `${h.shares} shares` : "0 shares"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
              Your upcoming AGM meetings will appear here once you add holdings
              to your portfolios and the daily scraper has fetched the latest
              data.
            </p>
          </div>
        </div>
      </main>

      {/* ---------- Add Portfolio Modal ---------- */}
      {showAddPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Portfolio
            </h3>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio name
            </label>
            <input
              type="text"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreatePortfolio(); }}
              placeholder="e.g. Retirement Fund"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
              Colour
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLOURS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewPortfolioColour(c)}
                  className={`h-8 w-8 rounded-full transition-all ${
                    newPortfolioColour === c
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label
                className={`h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 cursor-pointer flex items-center justify-center text-xs text-gray-500 hover:scale-110 transition-all ${
                  !PRESET_COLOURS.includes(newPortfolioColour)
                    ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
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
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePortfolio}
                disabled={!newPortfolioName.trim()}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Manage Holding Modal ---------- */}
      {selectedHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Holding
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">Symbol:</span>{" "}
                <span className="text-gray-900">{selectedHolding.stocks?.symbol ?? selectedHolding.stock_code}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Company:</span>{" "}
                <span className="text-gray-900">{selectedHolding.stocks?.company_name ?? "—"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Stock Code:</span>{" "}
                <span className="text-gray-900">{selectedHolding.stock_code}</span>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-5 mb-1">
              Number of shares
            </label>
            <input
              type="number"
              min="1"
              value={modalShares}
              onChange={(e) => setModalShares(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleDeleteHoldingModal}
                className="rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseHoldingModal}
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSharesModal}
                  disabled={!modalShares}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Stock to Portfolio
            </h3>

            {/* Search */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Results */}
            <div className="mt-2 max-h-48 overflow-y-auto">
              {searching && (
                <p className="text-xs text-gray-400 py-2">Searching…</p>
              )}
              {!searching && searchTerm && searchResults.length === 0 && (
                <p className="text-xs text-gray-400 py-2">No results.</p>
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
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-indigo-50 transition-colors ${
                    selectedStock?.stock_code === stock.stock_code
                      ? "bg-indigo-50 ring-1 ring-indigo-300"
                      : ""
                  }`}
                >
                  <span className="font-bold text-gray-900">
                    {stock.symbol}
                  </span>
                  <span className="ml-2 text-gray-400 text-xs">
                    {stock.stock_code}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {stock.company_name}
                  </span>
                </button>
              ))}
            </div>

            {/* Shares */}
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Number of shares
            </label>
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="e.g. 1000"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHolding}
                disabled={!selectedStock || !shares}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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