"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

const stocksPerPage = 9;

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function getRandomSubset(arr, count) {
  if (!Array.isArray(arr)) return [];
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Check if Indian stock market is open (Mon-Fri, 9:30 AM - 3:30 PM IST)
function isMarketOpen() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utcOffset = now.getTimezoneOffset() * 60 * 1000;
  const istTime = new Date(now.getTime() + utcOffset + istOffset);

  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Market hours: 9:00 AM (540 min) to 3:30 PM (930 min), Monday to Friday
  const marketOpen = 9 * 60;  // 9:00 AM = 540 minutes
  const marketClose = 15 * 60 + 30; // 3:30 PM = 930 minutes

  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = timeInMinutes >= marketOpen && timeInMinutes <= marketClose;

  return isWeekday && isDuringHours;
}

// Stock card with price fetching
function StockCard({ stock }) {
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/quote/${stock.symbol}`);
        if (res.ok) {
          const data = await res.json();
          setPrice(data.price);
          if (data.previousClose && data.price) {
            const pctChange = ((data.price - data.previousClose) / data.previousClose) * 100;
            setChange(pctChange);
          }
        }
      } catch (e) {
        console.error(`Error fetching price for ${stock.symbol}:`, e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
  }, [stock.symbol]);

  return (
    <Link href={`/dashboard/${stock.symbol}`}>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:bg-white/10 transition-all duration-300 cursor-pointer flex flex-col h-full group hover:shadow-purple-500/10 hover:border-white/20 hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            <span className="text-xl">📈</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-300 font-mono">{stock.symbol}</div>
            {loading ? (
              <div className="text-lg font-bold text-gray-500">Loading...</div>
            ) : price ? (
              <>
                <div className="text-lg font-bold text-white">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                {change !== null && (
                  <div className={`text-xs font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </div>
                )}
              </>
            ) : (
              <div className="text-lg font-bold text-gray-500">N/A</div>
            )}
          </div>
        </div>
        <div className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
          {stock.longName || stock.name || stock.symbol}
        </div>
        <div className="text-sm text-gray-400 mb-6 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-black/30 rounded text-xs border border-white/5">Stock</span>
        </div>
        <button className="mt-auto py-3 px-4 bg-gradient-to-r from-[#9b5cff] to-[#f08bd6] text-white rounded-xl shadow-lg font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-sm flex items-center justify-center gap-2">
          View Details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </Link>
  );
}

export default function StockDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Load random stocks initially (e.g., from backend API)
  useEffect(() => {
    if (debouncedSearch) return; // skip random-load if searching

    const fetchStocks = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/list`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch stock list");
          const arr = await res.json();
          setStocks(getRandomSubset(arr, stocksPerPage));
          setPage(1);
          setError("");
        })
        .catch((e) => {
          setError("Could not fetch stocks.");
          setStocks([]);
        });
    };

    // Initial fetch with loading
    setLoading(true);
    setError("");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/list`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch stock list");
        const arr = await res.json();
        setStocks(getRandomSubset(arr, stocksPerPage));
        setPage(1);
      })
      .catch((e) => {
        setError("Could not fetch stocks.");
        setStocks([]);
      })
      .finally(() => setLoading(false));

    // Poll every 10 seconds ONLY during market hours (Mon-Fri 9:30AM-3:30PM IST)
    // Outside market hours, prices don't change so no need to auto-refresh
    if (isMarketOpen()) {
      const interval = setInterval(fetchStocks, 10000);
      return () => clearInterval(interval);
    }
    // No auto-refresh outside market hours - data only updates on page load
  }, [debouncedSearch]);

  // Load searched stock if a symbol/name is entered
  useEffect(() => {
    if (!debouncedSearch) return;
    setLoading(true);
    setError("");
    // Use search-stocks endpoint for fuzzy search by name or symbol
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/search-stocks?q=${encodeURIComponent(debouncedSearch)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch stock");
        const data = await res.json();
        // The API returns an array of stocks
        setStocks(data);
        setPage(1);
      })
      .catch((e) => {
        console.error(e);
        setError("Could not fetch stock.");
        setStocks([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const currentStocks = stocks.slice((page - 1) * stocksPerPage, page * stocksPerPage);

  return (
    <>
      <Navbar />
      <section className="min-h-screen pt-32 pb-20 px-4 bg-[#030014] flex flex-col relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="text-center mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent blur-3xl -z-10"></div>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300 tracking-tight mb-4">
              Stock Market
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Track your favorite stocks, analyze trends, and get AI-powered insights.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="relative w-full max-w-2xl group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="relative w-full bg-[#0a0a16] text-white px-8 py-4 rounded-full border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg shadow-xl placeholder-gray-500 backdrop-blur-xl"
                placeholder="Search Stocks (e.g. TCS.NS, RELIANCE.NS)..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          <div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <span className="animate-spin border-4 border-purple-500 border-t-transparent rounded-full w-12 h-12 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-300 bg-red-900/10 rounded-xl border border-red-500/20 backdrop-blur-sm max-w-md mx-auto">{error}</div>
            ) : currentStocks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {currentStocks.map((stock) => (
                  <StockCard key={stock.symbol} stock={stock} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl">No stocks found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Chatbot />
    </>
  );
}

