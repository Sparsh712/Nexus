"use client";

import { useEffect, useState, useCallback } from "react";
import useUser from "@/lib/authClient";
import AIDostModal from "../components/AIDostModal";
import AIReportModal from "../components/AIReportModal";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";
import Link from "next/link";

export default function PortfolioPage() {
  const { user, isSignedIn, isLoading } = useUser();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAIDost, setShowAIDost] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  const [riskVolatility, setRiskVolatility] = useState({});
  const [monteCarlo, setMonteCarlo] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");

  // Preview modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Share portfolio state
  const [shareLink, setShareLink] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Function to calculate aggregate portfolio metrics
  const calculatePortfolioMetrics = useCallback(async () => {
    if (!portfolioItems.length) return;

    try {
      const totalRisk = portfolioItems.reduce(
        (acc, item) => acc + (item.risk_volatility?.annualized_volatility || 0),
        0
      );
      const avgVolatility = totalRisk / portfolioItems.length;

      const totalReturn = portfolioItems.reduce(
        (acc, item) => acc + (item.risk_volatility?.annualized_return || 0),
        0
      );
      const avgReturn = totalReturn / portfolioItems.length;

      setRiskVolatility({
        annualized_volatility: avgVolatility,
        annualized_return: avgReturn,
        sharpe_ratio: (avgReturn - 0.05) / avgVolatility,
      });

      setMonteCarlo({
        expected_nav: portfolioItems.reduce((acc, item) => acc + (item.nav || 0), 0),
        probability_positive_return: avgReturn > 0 ? 75 : 45,
        lower_bound_5th_percentile: avgReturn * 0.95,
        upper_bound_95th_percentile: avgReturn * 1.05,
      });
    } catch (error) {
      console.error("Error calculating portfolio metrics:", error);
    }
  }, [portfolioItems]);

  useEffect(() => {
    calculatePortfolioMetrics();
  }, [calculatePortfolioMetrics]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (isLoading) {
        return;
      }

      if (!isSignedIn || !user) {
        setError("Please sign in to view your portfolio");
        setLoading(false);
        return;
      }

      try {
        const userId = encodeURIComponent(user.sub || "");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch portfolio");
        }

        const items = await response.json();

        const itemsWithMetrics = await Promise.all(
          items.map(async (item) => {
            try {
              let riskResponse, navResponse;
              if (item.item_type === "stock") {
                riskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/risk-volatility/${item.symbol}`);
                navResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/quote/${item.symbol}`);
              } else if (item.item_type === "crypto") {
                riskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/risk-volatility/${item.symbol}`);
                navResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${item.symbol}`);
              } else {
                riskResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mutual/risk-volatility/${item.symbol}`);
                navResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mutual/scheme-details/${item.symbol}`);
              }

              const risk = await riskResponse.json();
              const nav = await navResponse.json();

              let currentPrice;
              if (item.item_type === "stock") {
                currentPrice = nav?.price;
              } else if (item.item_type === "crypto") {
                // Crypto coins search returns array, find matching coin
                const coinData = Array.isArray(nav) ? nav.find(c => c.symbol === item.symbol) : nav;
                currentPrice = coinData?.price;
              } else {
                currentPrice = nav?.nav;
              }

              return {
                ...item,
                risk_volatility: risk,
                nav: currentPrice,
              };
            } catch (error) {
              console.error(`Error fetching metrics for ${item.symbol}:`, error);
              return item;
            }
          })
        );

        // Sort items by type: stock, mutual_fund, crypto
        const sortedItems = itemsWithMetrics.sort((a, b) => {
          const order = { stock: 1, mutual_fund: 2, crypto: 3 };
          return (order[a.item_type] || 99) - (order[b.item_type] || 99);
        });

        setPortfolioItems(sortedItems);
      } catch (err) {
        console.error("Error fetching portfolio:", err);
        setError("Failed to fetch your portfolio. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [isSignedIn, user, isLoading]);

  const handleRemoveItem = async (itemId) => {
    if (!isSignedIn || !user) {
      alert("Please sign in to remove items");
      return;
    }

    try {
      const userId = encodeURIComponent(user.sub || "");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      setPortfolioItems((items) => items.filter((item) => item.id !== itemId));
      alert("Item removed successfully!");
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item. Please try again.");
    }
  };

  // Stats cards data
  const stocksCount = portfolioItems.filter(i => i.item_type === 'stock').length;
  const mfCount = portfolioItems.filter(i => i.item_type === 'mutual_fund').length;
  const cryptoCount = portfolioItems.filter(i => i.item_type === 'crypto').length;

  // Handle opening preview modal
  const handleOpenPreview = async (item) => {
    setSelectedItem(item);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      let detailsUrl, historyUrl;
      if (item.item_type === 'stock') {
        detailsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stock/extended-quote/${item.symbol}`;
        historyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stock/history/${item.symbol}?period=1mo`;
      } else if (item.item_type === 'crypto') {
        detailsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${item.symbol}`;
        historyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/crypto/historical-price/${item.symbol}?days=30`;
      } else {
        detailsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/scheme-details/${item.symbol}`;
        historyUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/mutual/nav-history/${item.symbol}`;
      }

      const [detailsRes, historyRes] = await Promise.all([
        fetch(detailsUrl),
        fetch(historyUrl)
      ]);

      let details = await detailsRes.json();
      const history = await historyRes.json();

      // For crypto, extract the matching coin from the search results
      if (item.item_type === 'crypto' && Array.isArray(details)) {
        details = details.find(c => c.symbol === item.symbol) || details[0] || {};
      }

      setPreviewData({ details, history: Array.isArray(history) ? history.slice(-30) : [] });
    } catch (err) {
      console.error('Error fetching preview data:', err);
      setPreviewData({ details: {}, history: [] });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setSelectedItem(null);
    setPreviewData(null);
  };

  // Handle sharing portfolio
  const handleSharePortfolio = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in to share your portfolio");
      return;
    }

    setShareLoading(true);
    try {
      const userId = encodeURIComponent(user.sub || "");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/share/create/${userId}`, {
        method: "POST"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create share link");
      }

      const data = await response.json();
      // Construct full URL using current window location origin
      const fullUrl = `${window.location.origin}${data.share_url}`;
      setShareLink(fullUrl);
      setShowShareModal(true);
    } catch (err) {
      console.error("Error creating share link:", err);
      alert("Failed to create share link: " + err.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard!");
    }
  };

  if (!isSignedIn && !isLoading) {
    return (
      <div className="min-h-screen bg-[#030014] text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

        <Navbar />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-gray-400 text-lg">You need to be signed in to view your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0 translate-x-1/3 -translate-y-1/3"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/15 blur-[100px] rounded-full pointer-events-none z-0 -translate-x-1/3 translate-y-1/3"></div>
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-indigo-900/10 blur-[80px] rounded-full pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2"></div>

      <Navbar />

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300 mb-4 tracking-tight">
            My Portfolio
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Track and manage your investments in one place
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setShowAIDost(true)}
            className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            NexBôt Analysis
          </button>
          <button
            onClick={() => setShowAIReport(true)}
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center gap-2 border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate AI Report
          </button>
          <button
            onClick={handleSharePortfolio}
            disabled={shareLoading || portfolioItems.length === 0}
            className="group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {shareLoading ? "Creating..." : "Share Portfolio"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div
            onClick={() => setActiveFilter("all")}
            className={`group cursor-pointer bg-white/5 border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 ${activeFilter === "all" ? "border-cyan-500 bg-white/10" : "border-white/10 hover:bg-white/10 hover:border-cyan-500/30"
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Holdings</p>
                <p className="text-2xl font-bold text-white">{portfolioItems.length}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter("stock")}
            className={`group cursor-pointer bg-white/5 border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 ${activeFilter === "stock" ? "border-green-500 bg-white/10" : "border-white/10 hover:bg-white/10 hover:border-green-500/30"
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Stocks</p>
                <p className="text-2xl font-bold text-white">{stocksCount}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter("mutual_fund")}
            className={`group cursor-pointer bg-white/5 border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 ${activeFilter === "mutual_fund" ? "border-purple-500 bg-white/10" : "border-white/10 hover:bg-white/10 hover:border-purple-500/30"
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Mutual Funds</p>
                <p className="text-2xl font-bold text-white">{mfCount}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter("crypto")}
            className={`group cursor-pointer bg-white/5 border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 ${activeFilter === "crypto" ? "border-orange-500 bg-white/10" : "border-white/10 hover:bg-white/10 hover:border-orange-500/30"
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.001 2a10 10 0 100 20 10 10 0 000-20zm1.008 4.5h2.002v1.5h-1.002v1h1.002v1.5h-2.002v1h2.002v1.5h-2.002v3h1.002v1.5H11.01v-1.5H9.008V14.5h1.002v-3H8.008V10h2.002V8.5H9.008V7h2.002V4.5h2.002z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Crypto</p>
                <p className="text-2xl font-bold text-white">{cryptoCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Holdings Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Your Holdings</h2>
            <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-1"></div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          ) : portfolioItems.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your portfolio is empty</h3>
              <p className="text-gray-400 mb-6">Start building your portfolio by adding stocks, mutual funds, or crypto</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/dashboard" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-green-900/20">
                  Browse Stocks
                </Link>
                <Link href="/mf" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-900/20">
                  Explore Mutual Funds
                </Link>
                <Link href="/crypto" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-orange-900/20">
                  Browse Crypto
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {portfolioItems
                .filter(item => activeFilter === "all" || item.item_type === activeFilter)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenPreview(item)}
                    className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer"
                  >
                    {/* Type Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.item_type === 'stock'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : item.item_type === 'crypto'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                      >
                        {item.item_type === 'stock' ? 'Stock' : item.item_type === 'crypto' ? 'Crypto' : 'Mutual Fund'}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center shadow-lg ${item.item_type === 'stock'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'
                      : item.item_type === 'crypto'
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20'
                        : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                      }`}>
                      {item.item_type === 'stock' ? (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : item.item_type === 'crypto' ? (
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.001 2a10 10 0 100 20 10 10 0 000-20zm1.008 4.5h2.002v1.5h-1.002v1h1.002v1.5h-2.002v1h2.002v1.5h-2.002v3h1.002v1.5H11.01v-1.5H9.008V14.5h1.002v-3H8.008V10h2.002V8.5H9.008V7h2.002V4.5h2.002z" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono mb-4">{item.symbol}</p>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <span className="text-xs text-gray-500">
                        Added {new Date(item.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1 rounded-lg text-sm font-medium transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClosePreview}
          />

          {/* Modal */}
          <div className="relative bg-[#0a0a14] border border-white/20 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-lg w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className={`p-6 border-b border-white/10 ${selectedItem.item_type === 'stock'
              ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/20'
              : selectedItem.item_type === 'crypto'
                ? 'bg-gradient-to-r from-orange-900/30 to-amber-900/20'
                : 'bg-gradient-to-r from-purple-900/30 to-pink-900/20'
              }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${selectedItem.item_type === 'stock'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'
                    : selectedItem.item_type === 'crypto'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20'
                      : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                    }`}>
                    {selectedItem.item_type === 'stock' ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : selectedItem.item_type === 'crypto' ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.001 2a10 10 0 100 20 10 10 0 000-20zm1.008 4.5h2.002v1.5h-1.002v1h1.002v1.5h-2.002v1h2.002v1.5h-2.002v3h1.002v1.5H11.01v-1.5H9.008V14.5h1.002v-3H8.008V10h2.002V8.5H9.008V7h2.002V4.5h2.002z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                    <p className="text-sm text-gray-400 font-mono">{selectedItem.symbol}</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {previewLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
                </div>
              ) : previewData ? (
                <div className="space-y-6">
                  {/* Price Section */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      {selectedItem.item_type === 'stock' ? 'Current Price' : selectedItem.item_type === 'crypto' ? 'Current Price' : 'Current NAV'}
                    </p>
                    {(() => {
                      const shownPrice = previewData.details?.current_price ?? previewData.details?.price ?? previewData.details?.nav;
                      const symbol = selectedItem.item_type === 'crypto' ? '$' : '₹';
                      return (
                        <p className="text-3xl font-bold text-white">
                          {shownPrice == null ? '--' : `${symbol}${shownPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                        </p>
                      );
                    })()}
                    {previewData.details?.dayChangePercent !== undefined && (
                      <p className={`text-sm font-medium ${previewData.details.dayChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {previewData.details.dayChangePercent >= 0 ? '▲' : '▼'} {Math.abs(previewData.details.dayChangePercent).toFixed(2)}% today
                      </p>
                    )}
                  </div>

                  {/* Mini Chart */}
                  {previewData.history?.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-3">30-Day Trend</p>
                      <div className="h-24 flex items-end gap-0.5">
                        {previewData.history.map((point, i) => {
                          const values = previewData.history.map(p => p.close || p.nav || p.price || 0);
                          const min = Math.min(...values);
                          const max = Math.max(...values);
                          const priceValue = point.close || point.nav || point.price || 0;
                          const height = max > min ? (priceValue - min) / (max - min) * 100 : 50;
                          const isUp = i > 0 && priceValue >= (previewData.history[i - 1]?.close || previewData.history[i - 1]?.nav || previewData.history[i - 1]?.price || 0);
                          const currencySymbol = selectedItem.item_type === 'crypto' ? '$' : '₹';
                          const formattedDate = point.date || `Day ${i + 1}`;
                          const formattedPrice = priceValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-t transition-all cursor-pointer hover:opacity-100 ${isUp ? 'bg-green-500/60 hover:bg-green-500' : 'bg-red-500/60 hover:bg-red-500'}`}
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${formattedDate}\n${currencySymbol}${formattedPrice}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.item_type === 'stock' ? (
                      <>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">52W High</p>
                          <p className="text-white font-semibold">₹{previewData.details?.fiftyTwoWeekHigh?.toLocaleString() || '--'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">52W Low</p>
                          <p className="text-white font-semibold">₹{previewData.details?.fiftyTwoWeekLow?.toLocaleString() || '--'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">P/E Ratio</p>
                          <p className="text-white font-semibold">{previewData.details?.peRatio?.toFixed(2) || '--'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">Market Cap</p>
                          <p className="text-white font-semibold">
                            {previewData.details?.marketCap
                              ? (previewData.details.marketCap >= 1e12
                                ? `₹${(previewData.details.marketCap / 1e12).toFixed(2)}T`
                                : previewData.details.marketCap >= 1e9
                                  ? `₹${(previewData.details.marketCap / 1e9).toFixed(2)}B`
                                  : `₹${(previewData.details.marketCap / 1e6).toFixed(0)}M`)
                              : '--'}
                          </p>
                        </div>
                      </>
                    ) : selectedItem.item_type === 'crypto' ? (
                      <>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">24h Change</p>
                          <p className={`font-semibold ${(previewData.details?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {previewData.details?.price_change_percentage_24h
                              ? `${previewData.details.price_change_percentage_24h >= 0 ? '+' : ''}${previewData.details.price_change_percentage_24h.toFixed(2)}%`
                              : '--'}
                          </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">Market Cap</p>
                          <p className="text-white font-semibold">
                            {previewData.details?.market_cap
                              ? (previewData.details.market_cap >= 1e12
                                ? `$${(previewData.details.market_cap / 1e12).toFixed(2)}T`
                                : previewData.details.market_cap >= 1e9
                                  ? `$${(previewData.details.market_cap / 1e9).toFixed(2)}B`
                                  : `$${(previewData.details.market_cap / 1e6).toFixed(0)}M`)
                              : '--'}
                          </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">24h Volume</p>
                          <p className="text-white font-semibold">
                            {previewData.details?.total_volume
                              ? (previewData.details.total_volume >= 1e9
                                ? `$${(previewData.details.total_volume / 1e9).toFixed(2)}B`
                                : `$${(previewData.details.total_volume / 1e6).toFixed(0)}M`)
                              : '--'}
                          </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">Symbol</p>
                          <p className="text-white font-semibold">{selectedItem.symbol}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">Scheme Type</p>
                          <p className="text-white font-semibold text-sm">{previewData.details?.scheme_type || '--'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <p className="text-xs text-gray-500">Category</p>
                          <p className="text-white font-semibold text-sm">{previewData.details?.scheme_category || '--'}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2">
                          <p className="text-xs text-gray-500">Fund House</p>
                          <p className="text-white font-semibold text-sm">{previewData.details?.fund_house || '--'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link
                      href={selectedItem.item_type === 'stock'
                        ? `/dashboard/${selectedItem.symbol}`
                        : selectedItem.item_type === 'crypto'
                          ? `/crypto/${selectedItem.symbol.toLowerCase()}`
                          : `/mf/${selectedItem.symbol}`
                      }
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-semibold text-center transition-all hover:scale-[1.02] shadow-lg"
                    >
                      View Full Details →
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveItem(selectedItem.id); handleClosePreview(); }}
                      className="px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Failed to load preview data
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Modals */}
      <AIDostModal
        isOpen={showAIDost}
        onClose={() => setShowAIDost(false)}
        fundData={{
          meta: {
            portfolio_size: portfolioItems.length,
            stocks_count: stocksCount,
            mutual_funds_count: mfCount,
            last_added: portfolioItems[0]?.added_at
          },
          riskVolatility,
          monteCarlo,
          portfolioItems
        }}
      />

      <AIReportModal
        isOpen={showAIReport}
        onClose={() => setShowAIReport(false)}
        fundData={{
          meta: {
            portfolio_size: portfolioItems.length,
            stocks_count: stocksCount,
            mutual_funds_count: mfCount,
            last_added: portfolioItems[0]?.added_at
          },
          riskVolatility,
          monteCarlo,
          portfolioItems
        }}
      />

      {/* Share Portfolio Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-[#0a0a14] border border-white/20 rounded-2xl shadow-2xl shadow-green-500/20 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🔗</span> Share Your Portfolio
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Share your portfolio snapshot with anyone. They&apos;ll see a read-only view of your current holdings.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Share Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink || ""}
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (shareLink) {
                    window.open(shareLink, '_blank');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-semibold transition-all"
              >
                Open Preview →
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}
