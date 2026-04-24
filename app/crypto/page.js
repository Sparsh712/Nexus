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

const fetchCoins = async (search = "") => {
  const url = search
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${encodeURIComponent(search)}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/famous`; // <- NOTE: fetch famous coins for blank search
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
};

export default function CryptoDashboardPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const [displayedCoins, setDisplayedCoins] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    setLoading(true);
    fetchCoins(debouncedSearch).then((data) => {
      setCoins(data);
      // Show up to 8 matching results for queries
      const coinArr = debouncedSearch ? data.slice(0, 8) : data;
      setDisplayedCoins(coinArr);
      setNoResults(coinArr.length === 0);
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching coins:', error);
      setLoading(false);
      setNoResults(true);
    });
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
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none z-0 translate-x-1/2 -translate-y-1/2"></div>
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none z-0 -translate-x-1/2 translate-y-1/2"></div>

        <Navbar />

        <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 mb-4 tracking-tight">
              Crypto Market
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Track real-time prices, analyze trends, and explore the future of decentralized finance.
            </p>
          </div>

          {/* Searchbar */}
          <div className="flex justify-center mb-12 relative z-20">
            <div className="relative w-full max-w-xl group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30 group-hover:opacity-60 transition duration-500 blur"></div>
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  value={search}
                  onChange={onSearchChange}
                  type="text"
                  placeholder="Search Coins (e.g. Bitcoin, ETH)..."
                  className="w-full px-6 py-4 rounded-full bg-[#0a0a12]/90 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-xl"
                  aria-label="Search Cryptocurrencies"
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
              <span className="text-6xl mb-4 grayscale">🌑</span>
              <span className="text-gray-400 text-lg">
                No coins found. Is it a memecoin?
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCoins.map((coin) => (
                <div
                  key={coin.id}
                  className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 p-2">
                      <img
                        src={coin.image ? `/api/proxy-images?url=${encodeURIComponent(coin.image)}` : `https://ui-avatars.com/api/?name=${coin.name}&background=random`}
                        alt={coin.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${coin.name}&background=random&color=fff&size=128`;
                        }}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-300 font-mono">{coin.symbol?.toUpperCase()}</div>
                      {coin.current_price && <div className="text-lg font-bold text-white">${coin.current_price.toLocaleString()}</div>}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-blue-300 transition-colors">
                    {coin.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-6">
                    <div>Market Cap Rank: <span className="text-white">#{coin.market_cap_rank}</span></div>
                  </div>

                  <div className="mt-auto">
                    <Link href={`/crypto/${coin.id}`}>
                      <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 hover:shadow-blue-700/40 transition-all active:scale-[0.98]">
                        View live Charts →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Chatbot />
    </>
  );
}

