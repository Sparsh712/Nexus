"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

// Debounce utility
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const fetchSchemes = async (search = "") => {
  const url = search
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/schemes?search=${encodeURIComponent(search)}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/schemes`;
  const res = await fetch(url);
  if (!res.ok) return {};
  return await res.json();
};

function getRandomMFs(schemesObj, count = 6) {
  const entries = Object.entries(schemesObj);
  if (entries.length <= count) return entries;
  const shuffled = entries.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function MFDashboardPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState({});
  const [displayedMfs, setDisplayedMfs] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    const fetchAndUpdate = (showLoading = false) => {
      if (showLoading) setLoading(true);
      fetchSchemes(debouncedSearch).then((data) => {
        setSchemes(data);
        if (debouncedSearch) {
          const mfArr = Object.entries(data).slice(0, 8);
          setDisplayedMfs(mfArr);
          setNoResults(mfArr.length === 0);
        } else {
          const mfArr = getRandomMFs(data, 6);
          setDisplayedMfs(mfArr);
          setNoResults(mfArr.length === 0);
        }
        if (showLoading) setLoading(false);
      });
    };

    // Initial fetch with loading
    fetchAndUpdate(true);


  }, [debouncedSearch]);

  const onSearchChange = (e) => setSearch(e.target.value);
  const onClearSearch = () => {
    setSearch("");
    inputRef.current.focus();
  };

  return (
    <>
      <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <Navbar />

        <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-200 mb-4 tracking-tight">
              Mutual Funds Explorer
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Discover top-rated mutual funds, analyze performance, and make informed investment decisions with AI-driven insights.
            </p>
          </div>

          {/* Searchbar */}
          <div className="flex justify-center mb-12 relative z-20">
            <div className="relative w-full max-w-xl group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  value={search}
                  onChange={onSearchChange}
                  type="text"
                  placeholder="Search Mutual Funds directly..."
                  className="w-full px-6 py-4 rounded-full bg-[#0a0a12]/90 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-xl"
                  aria-label="Search Mutual Funds"
                />
                {search ? (
                  <button
                    onClick={onClearSearch}
                    className="absolute right-6 text-gray-400 hover:text-white transition-colors"
                    aria-label="Clear Search"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="absolute right-6 text-gray-500 pointer-events-none">🔍</span>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
          ) : noResults ? (
            <div className="flex flex-col items-center py-20 opacity-60">
              <span className="text-6xl mb-4 grayscale">📉</span>
              <span className="text-gray-400 text-lg">No funds found. Try a different keyword.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedMfs.map(([code, name]) => (
                <div
                  key={code}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl">
                      💰
                    </div>
                    <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded border border-white/5">{code}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-200 mb-2 line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors">
                    {name}
                  </h3>

                  <div className="mt-6">
                    <Link href={`/mf/${code}`}>
                      <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 transition-all active:scale-[0.98]">
                        View Analysis →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Chatbot />
      </div>
    </>
  );
}

