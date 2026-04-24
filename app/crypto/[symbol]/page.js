"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Area,
  Brush,
} from "recharts";
import Navbar from "../../components/Navbar";
import AIDostModal from "../../components/AIDostModal";
import AIReportModal from "../../components/AIReportModal";
import Chatbot from "../../components/Chatbot";
import useUser from "@/lib/authClient";


// Utility functions
function formatPct(val) {
  return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
}
function formatCurrency(val, symbol = "$") {
  return isNaN(val) ? "--" : symbol + Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatLargeCurrency(val, symbol = "$") {
  if (isNaN(val)) return "--";
  const num = Number(val);
  if (num >= 1e12) return symbol + (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return symbol + (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return symbol + (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return symbol + (num / 1e3).toFixed(2) + "K";
  return symbol + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Custom Heatmap Component using Bar Chart
function PerformanceHeatmap({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No heatmap data available
      </div>
    );
  }

  // Format data for bar chart - take last 12 periods
  const chartData = data.slice(-12).map(item => ({
    month: item.month || item.period || 'N/A',
    value: item.dayChange || item.value || 0,
    displayValue: (item.dayChange || item.value || 0).toFixed(4)
  }));

  // Get color based on performance value
  const getColor = (value) => {
    if (value > 0.15) return "#eab308";  // Yellow for high positive
    if (value > 0.05) return "#84cc16";   // Light green
    if (value > 0) return "#10b981";      // Green
    if (value > -0.05) return "#6366f1";  // Purple/blue
    return "#8b5cf6";                     // Dark purple for negative
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={(val) => (val * 100).toFixed(2) + '%'}
            reversed={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "6px",
              color: "#fff"
            }}
            labelStyle={{ color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={(value) => [(value * 100).toFixed(4) + '%', 'Period Return']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Color Legend */}
      <div className="flex items-center justify-end gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#8b5cf6] rounded"></div>
          <span className="text-gray-400">Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#6366f1] rounded"></div>
          <span className="text-gray-400">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#10b981] rounded"></div>
          <span className="text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#eab308] rounded"></div>
          <span className="text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
}

export default function CryptoDetailsPage() {
  const { symbol } = useParams();
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [riskVolatility, setRiskVolatility] = useState({});
  const [monteCarlo, setMonteCarlo] = useState({});
  const [amount, setAmount] = useState(1000);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [portfolioItemId, setPortfolioItemId] = useState(null);

  // User authentication
  const { user, isSignedIn } = useUser();

  // Prepare Unified Chart Data for Zooming
  const unifiedMonteCarloData = useMemo(() => {
    if (!monteCarlo.historical_predicted && !monteCarlo.simulation_paths) return [];

    const hist = monteCarlo.historical_predicted || [];
    const sims = monteCarlo.simulation_paths || [];
    const dayMap = new Map();

    hist.forEach(d => {
      const item = { day: d.day, historical: d.value };
      dayMap.set(d.day, item);
    });

    sims.forEach((sim, idx) => {
      sim.data.forEach(p => {
        const existing = dayMap.get(p.day) || { day: p.day };
        existing[`sim_${idx}`] = p.value;
        dayMap.set(p.day, existing);
      });
    });

    return Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
  }, [monteCarlo]);


  // AI Modal states
  const [showAIDost, setShowAIDost] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);

  // Compare cryptos state
  const [crypto1Query, setCrypto1Query] = useState("");
  const [crypto2Query, setCrypto2Query] = useState("");
  const [crypto1Suggestions, setCrypto1Suggestions] = useState([]);
  const [crypto2Suggestions, setCrypto2Suggestions] = useState([]);
  const [showCrypto1Dropdown, setShowCrypto1Dropdown] = useState(false);
  const [showCrypto2Dropdown, setShowCrypto2Dropdown] = useState(false);
  const [selectedCrypto1, setSelectedCrypto1] = useState(null);
  const [selectedCrypto2, setSelectedCrypto2] = useState(null);
  const [crypto1Data, setCrypto1Data] = useState(null);
  const [crypto2Data, setCrypto2Data] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setLoading(true);
    // TODO: Replace with actual API calls once your friend provides the endpoints
    // For now, setting empty/mock data
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coin-details/${symbol}`).then(r => r.json()).catch(() => ({})),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/historical-price/${symbol}`).then(r => r.json()).catch(() => []),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/performance-heatmap/${symbol}`).then(r => r.json()).catch(() => []),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/risk-volatility/${symbol}`).then(r => r.json()).catch(() => ({})),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/monte-carlo-prediction/${symbol}`).then(r => r.json()).catch(() => ({})),
    ]).then(([metaData, prices, heat, risk, mc]) => {
      setMeta(metaData);
      setPriceHistory(prices);
      setHeatmap(heat);
      setRiskVolatility(risk);
      setMonteCarlo(mc);
      setLoading(false);
    }).catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  }, [symbol]);

  // Debounced search for crypto 1
  useEffect(() => {
    if (crypto1Query.length < 1) {
      setCrypto1Suggestions([]);
      setShowCrypto1Dropdown(false);
      return;
    }
    setShowCrypto1Dropdown(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${encodeURIComponent(crypto1Query)}`);
        const data = await response.json();
        setCrypto1Suggestions(data || []);
      } catch (error) {
        console.error('Error fetching crypto suggestions:', error);
        setCrypto1Suggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [crypto1Query]);

  // Debounced search for crypto 2
  useEffect(() => {
    if (crypto2Query.length < 1) {
      setCrypto2Suggestions([]);
      setShowCrypto2Dropdown(false);
      return;
    }
    setShowCrypto2Dropdown(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coins?search=${encodeURIComponent(crypto2Query)}`);
        const data = await response.json();
        setCrypto2Suggestions(data || []);
      } catch (error) {
        console.error('Error fetching crypto suggestions:', error);
        setCrypto2Suggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [crypto2Query]);

  // Fetch data for selected crypto 1
  useEffect(() => {
    if (!selectedCrypto1) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coin-details/${selectedCrypto1.id}`);
        const data = await res.json();
        setCrypto1Data({ meta: data });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedCrypto1]);

  // Fetch data for selected crypto 2
  useEffect(() => {
    if (!selectedCrypto2) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crypto/coin-details/${selectedCrypto2.id}`);
        const data = await res.json();
        setCrypto2Data({ meta: data });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedCrypto2]);

  // Calculate future returns
  const estReturn = amount * Math.pow(1 + (riskVolatility.annualized_return || 0), 1);
  const estProfit = estReturn - amount;

  // Handle adding to portfolio
  const handleAddToPortfolio = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in to add items to your portfolio");
      return;
    }

    try {
      setAddingToPortfolio(true);

      const userId = encodeURIComponent(user.sub || '');
      const response = await fetch(`/api/portfolio/add/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: meta?.symbol?.toUpperCase() || symbol.toUpperCase(),
          name: meta?.name || symbol,
          item_type: "crypto"
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (response.status === 400) {
          alert(data.detail || "Crypto already in portfolio");
        } else {
          throw new Error(data.detail || "Failed to add to portfolio");
        }
        return;
      }

      alert("Successfully added to portfolio!");
      setIsInPortfolio(true);
      if (data.id) setPortfolioItemId(data.id);
    } catch (error) {
      console.error("Error adding to portfolio:", error);
      alert(error.message || "Failed to add to portfolio");
    } finally {
      setAddingToPortfolio(false);
    }
  };

  const handleRemoveFromPortfolio = async () => {
    if (!isSignedIn || !user || !portfolioItemId) {
      alert("Please sign in to manage your portfolio");
      return;
    }

    try {
      setAddingToPortfolio(true);
      const userId = encodeURIComponent(user.sub || '');
      const response = await fetch(`/api/portfolio/${userId}/${portfolioItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove from portfolio");
      }

      alert("Successfully removed from portfolio!");
      setIsInPortfolio(false);
      setPortfolioItemId(null);
    } catch (error) {
      console.error("Error removing from portfolio:", error);
      alert(error.message || "Failed to remove from portfolio");
    } finally {
      setAddingToPortfolio(false);
    }
  };

  // Check if item is in portfolio
  useEffect(() => {
    const checkPortfolio = async () => {
      if (!isSignedIn || !user) return;
      try {
        const userId = encodeURIComponent(user.sub || '');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portfolio/${userId}`);
        if (response.ok) {
          const items = await response.json();
          const cryptoSymbol = meta?.symbol?.toUpperCase() || symbol.toUpperCase();
          const existing = items.find(item => item.symbol === cryptoSymbol);
          if (existing) {
            setIsInPortfolio(true);
            setPortfolioItemId(existing.id);
          }
        }
      } catch (error) {
        console.error("Error checking portfolio:", error);
      }
    };
    checkPortfolio();
  }, [isSignedIn, user, symbol, meta]);

  // Handle crypto selection
  const handleCrypto1Select = (crypto) => {
    setSelectedCrypto1(crypto);
    setCrypto1Query(crypto.name);
    setShowCrypto1Dropdown(false);
  };

  const handleCrypto2Select = (crypto) => {
    setSelectedCrypto2(crypto);
    setCrypto2Query(crypto.name);
    setShowCrypto2Dropdown(false);
  };

  return (
    <>
      <Navbar />
      <section className="min-h-screen pt-32 pb-20 px-4 bg-[#030014] text-white relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto grid gap-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <span className="animate-spin border-4 border-cyan-500 border-t-transparent rounded-full w-12 h-12 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></span>
            </div>
          ) : (
            <>


              {/* Crypto Name Display with AI Buttons */}
              <div className="mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center justify-center gap-4 mb-6 relative z-10">
                    {meta?.image && (
                      <div className="p-1 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500">
                        <img
                          src={`/api/proxy-images?url=${encodeURIComponent(meta.image)}`}
                          alt={meta.name}
                          className="w-14 h-14 rounded-full border-2 border-[#030014] object-cover bg-black"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${meta.name}&background=random&color=fff&size=128`;
                          }}
                        />
                      </div>
                    )}
                    <h2 className="text-3xl font-bold text-white text-center">
                      {meta?.name || symbol} {meta?.symbol && <span className="text-gray-400 text-xl font-normal">({meta.symbol.toUpperCase()})</span>}
                    </h2>
                  </div>

                  {meta?.current_price && (
                    <div className="text-center mb-8 relative z-10">
                      <div className="inline-block bg-black/40 border border-white/5 rounded-2xl px-8 py-4 backdrop-blur-sm">
                        <span className="text-4xl font-bold text-white tracking-tight">
                          {formatCurrency(meta.current_price)}
                        </span>
                        {meta?.price_change_percentage_24h !== undefined && (
                          <div className={`mt-1 text-lg font-medium flex items-center justify-center gap-1 ${meta.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <span>{meta.price_change_percentage_24h >= 0 ? '▲' : '▼'}</span>
                            {Math.abs(meta.price_change_percentage_24h).toFixed(2)}% (24h)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Buttons */}
                  <div className="flex gap-4 justify-center relative z-10 flex-wrap">
                    <button
                      onClick={() => setShowAIDost(true)}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 border border-white/10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      NexBôt Analysis
                    </button>
                    <button
                      onClick={() => setShowAIReport(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center gap-2 border border-white/10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate AI Report
                    </button>
                  </div>
                </div>
              </div>

              <AIDostModal isOpen={showAIDost} onClose={() => setShowAIDost(false)} stockData={{ meta, riskVolatility, monteCarlo }} />
              <AIReportModal isOpen={showAIReport} onClose={() => setShowAIReport(false)} stockData={{ meta, riskVolatility, monteCarlo }} />

              {/* Main Grid - 2 columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="h-full flex flex-col gap-6">
                  {/* Crypto Details Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4 flex items-center gap-2">
                      <span className="text-cyan-400">ℹ️</span>
                      Crypto Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Symbol:</span>
                        <span className="text-white font-semibold uppercase">{meta?.symbol || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Market Cap:</span>
                        <span className="text-white font-semibold">{formatLargeCurrency(meta?.market_cap || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">24h Volume:</span>
                        <span className="text-white font-semibold">{formatLargeCurrency(meta?.total_volume || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">All Time High:</span>
                        <span className="text-white font-semibold">{formatCurrency(meta?.ath || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">All Time Low:</span>
                        <span className="text-white font-semibold">{formatCurrency(meta?.atl || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">24h High:</span>
                        <span className="text-white font-semibold">{formatCurrency(meta?.high_24h || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">24h Low:</span>
                        <span className="text-white font-semibold">{formatCurrency(meta?.low_24h || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Circulating Supply:</span>
                        <span className="text-white font-semibold text-right">
                          {meta?.circulating_supply ? Number(meta.circulating_supply).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={isInPortfolio ? handleRemoveFromPortfolio : handleAddToPortfolio}
                      disabled={addingToPortfolio}
                      className={`w-full px-6 py-3 text-base font-semibold mt-6 rounded-lg transition-colors ${isInPortfolio
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                        } ${addingToPortfolio ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {addingToPortfolio
                        ? (isInPortfolio ? 'Removing...' : 'Adding...')
                        : (isInPortfolio ? 'Remove from Portfolio' : 'Add to Portfolio')}
                    </button>
                  </div>

                  {/* Investment Calculator Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Investment Calculator</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-base mb-2">
                          <span className="text-gray-300 font-medium">Investment Amount ($):</span>
                        </label>
                        <input
                          className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                          type="number"
                          min="1"
                          value={amount}
                          onChange={e => setAmount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 text-base border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Coins You&apos;ll Get:</span>
                        <span className="font-bold text-white text-lg">
                          {meta?.current_price ? (amount / meta.current_price).toFixed(8) : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Estimated 1Y Value:</span>
                        <span className="font-bold text-white text-lg">{formatCurrency(estReturn)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Estimated Profit:</span>
                        <span className={`font-bold text-lg ${estProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(estProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Annualized Return:</span>
                        <span className="font-bold text-white text-lg">{formatPct(riskVolatility.annualized_return)}</span>
                      </div>
                      <p className="text-sm opacity-70 mt-4 text-gray-400 italic">
                        *Crypto investments are highly volatile. Past performance doesn&apos;t guarantee future results.
                      </p>
                    </div>
                  </div>

                  {/* Risk & Volatility */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Risk & Volatility</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-base">
                        <span className="text-gray-300 font-medium">Annualized Volatility:</span>
                        <span className="font-bold text-white">{formatPct(riskVolatility.annualized_volatility)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="text-gray-300 font-medium">Annualized Return:</span>
                        <span className="font-bold text-white">{formatPct(riskVolatility.annualized_return)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="text-gray-300 font-medium">Sharpe Ratio:</span>
                        <span className="font-bold text-white">{riskVolatility.sharpe_ratio?.toFixed(2) ?? "--"}</span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-xl h-64 p-2 mt-4">
                      {riskVolatility.returns?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={riskVolatility.returns.slice(-100)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Line
                              type="monotone"
                              dataKey="returns"
                              stroke="#10b981"
                              strokeWidth={1.5}
                              dot={false}
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#9ca3af', fontSize: 9 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              tickFormatter={(val) => (val * 100).toFixed(1) + '%'}
                            />
                            <Tooltip
                              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                              formatter={(value) => [(value * 100).toFixed(4) + '%', 'Daily Return']}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="h-full flex flex-col gap-6">
                  {/* Price History Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                      <h3 className="text-xl font-bold text-white">Historical Price</h3>
                      <div className="flex gap-2">
                        {["1M", "3M", "6M", "1Y"].map((period) => (
                          <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === period
                              ? "bg-purple-600 text-white"
                              : "bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                              }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl h-64 p-2">
                      {priceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceHistory.slice(
                            selectedPeriod === "1Y" ? -365 :
                              selectedPeriod === "6M" ? -180 :
                                selectedPeriod === "3M" ? -90 :
                                  -30
                          )}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="#06b6d4"
                              strokeWidth={2}
                              dot={false}
                            />
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#9ca3af', fontSize: 9 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              tickFormatter={(val) => '$' + val.toFixed(2)}
                            />
                            <Tooltip
                              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                              formatter={(value) => ['$' + value, 'Price']}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>

                  {/* Performance Heatmap */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Performance Heatmap</h3>
                    <div className="h-64">
                      <PerformanceHeatmap data={heatmap} />
                    </div>
                  </div>

                  {/* Monte Carlo Prediction */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-3 text-white border-b border-white/10 pb-2">Monte Carlo Prediction (1 Year)</h3>
                    <div className="space-y-3 mb-4 text-base">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Expected Price:</span>
                        <span className="font-bold text-white">{formatCurrency(monteCarlo.expected_price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Probability of Gain:</span>
                        <span className="font-bold text-white">{formatPct((monteCarlo.probability_positive_return || 0) / 100)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Price Range (5%-95%):</span>
                        <span className="font-bold text-white text-right">
                          {formatCurrency(monteCarlo.lower_bound_5th_percentile)} - {formatCurrency(monteCarlo.upper_bound_95th_percentile)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl h-80 p-2">
                      {unifiedMonteCarloData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={unifiedMonteCarloData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="day"
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 11 }}
                            />
                            <YAxis
                              tick={{ fill: '#9ca3af', fontSize: 10 }}
                              tickFormatter={(val) => '$' + val.toFixed(2)}
                              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip
                              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }}
                              labelStyle={{ color: '#f3f4f6' }}
                              formatter={(val, name) => [
                                '$' + Number(val).toFixed(2),
                                name === 'historical' ? 'Historical' : name
                              ]}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: '11px' }}
                              iconType="line"
                            />

                            <Line
                              type="monotone"
                              dataKey="historical"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={false}
                              name="Historical"
                            />

                            {[0, 1, 2, 3, 4].map((idx) => (
                              <Line
                                key={`sim_${idx}`}
                                type="monotone"
                                dataKey={`sim_${idx}`}
                                stroke={
                                  idx === 0 ? "#10b981" :
                                    idx === 1 ? "#14b8a6" :
                                      idx === 2 ? "#06b6d4" :
                                        "#3b82f6"
                                }
                                strokeWidth={1}
                                dot={false}
                                name={`Sim ${idx + 1}`}
                                opacity={0.6}
                              />
                            ))}

                            <Brush
                              dataKey="day"
                              height={30}
                              stroke="#3b82f6"
                              fill="#0f172a"
                              tickFormatter={(val) => `Day ${val}`}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No prediction data</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compare Cryptos Section - Full Width */}
              <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-md">
                <h3 className="text-2xl font-bold mb-6 text-white">Compare Cryptos</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Crypto 1 Search */}
                  <div className="relative">
                    <label className="block text-base mb-2 text-gray-300 font-medium">First Crypto</label>
                    <input
                      type="text"
                      value={crypto1Query}
                      onChange={(e) => {
                        setCrypto1Query(e.target.value);
                        setSelectedCrypto1(null);
                      }}
                      onFocus={() => crypto1Suggestions.length > 0 && setShowCrypto1Dropdown(true)}
                      onBlur={() => setTimeout(() => setShowCrypto1Dropdown(false), 200)}
                      placeholder="Type to search (e.g., Bitcoin, Ethereum, Solana)..."
                      className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    />
                    {showCrypto1Dropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto backdrop-blur-xl">
                        {crypto1Suggestions.length > 0 ? (
                          crypto1Suggestions.map((crypto) => (
                            <div
                              key={crypto.id}
                              onClick={() => {
                                setShowCrypto1Dropdown(false);
                                handleCrypto1Select(crypto);
                              }}
                              className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
                            >
                              <div className="text-white font-medium text-sm mb-1">{crypto.name}</div>
                              <div className="text-gray-400 text-xs">Symbol: {crypto.symbol?.toUpperCase()}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-gray-400 text-sm">No results found</div>
                        )}
                      </div>
                    )}
                    {selectedCrypto1 && (
                      <div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg">
                        <div className="text-green-400 text-sm font-medium">✓ Selected: {selectedCrypto1.name}</div>
                        <div className="text-gray-400 text-xs mt-1">Symbol: {selectedCrypto1.symbol?.toUpperCase()}</div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                  </div>

                  {/* Crypto 2 Search */}
                  <div className="relative">
                    <label className="block text-base mb-2 text-gray-300 font-medium">Second Crypto</label>
                    <input
                      type="text"
                      value={crypto2Query}
                      onChange={(e) => {
                        setCrypto2Query(e.target.value);
                        setSelectedCrypto2(null);
                      }}
                      onFocus={() => crypto2Suggestions.length > 0 && setShowCrypto2Dropdown(true)}
                      onBlur={() => setTimeout(() => setShowCrypto2Dropdown(false), 200)}
                      placeholder="Type to search (e.g., Bitcoin, Ethereum, Solana)..."
                      className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    />
                    {showCrypto2Dropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto backdrop-blur-xl">
                        {crypto2Suggestions.length > 0 ? (
                          crypto2Suggestions.map((crypto) => (
                            <div
                              key={crypto.id}
                              onClick={() => handleCrypto2Select(crypto)}
                              className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0"
                            >
                              <div className="text-white font-medium text-sm mb-1">{crypto.name}</div>
                              <div className="text-gray-400 text-xs">Symbol: {crypto.symbol?.toUpperCase()}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-gray-400 text-sm">No results found</div>
                        )}
                      </div>
                    )}
                    {selectedCrypto2 && (
                      <div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg">
                        <div className="text-green-400 text-sm font-medium">✓ Selected: {selectedCrypto2.name}</div>
                        <div className="text-gray-400 text-xs mt-1">Symbol: {selectedCrypto2.symbol?.toUpperCase()}</div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                  </div>
                </div>

                {/* Compare Button */}
                {selectedCrypto1 && selectedCrypto2 && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowComparison(true)}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-8 py-4 rounded-lg text-base font-bold transition-all transform hover:scale-105"
                    >
                      Compare
                    </button>
                    <p className="text-gray-400 text-sm mt-3">
                      Click to generate comparison
                    </p>
                  </div>
                )}

                {!selectedCrypto1 && !selectedCrypto2 && (
                  <p className="text-center text-gray-400 text-base">
                    Search and select two cryptocurrencies to compare their performance metrics
                  </p>
                )}
              </div>

              {showComparison && crypto1Data && crypto2Data && (
                <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-md">
                  <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                    <span className="bg-gradient-to-r from-orange-500 to-yellow-500 text-transparent bg-clip-text">🪙</span>
                    Crypto Comparison
                  </h3>

                  {/* Header Cards */}
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 border border-orange-500/30 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        {crypto1Data.meta?.image && (
                          <img src={`/api/proxy-images?url=${encodeURIComponent(crypto1Data.meta.image)}`} alt="" className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                          <h4 className="text-xl font-bold text-white">{crypto1Data.meta?.name || selectedCrypto1.name}</h4>
                          <p className="text-orange-300 font-mono text-sm uppercase">{crypto1Data.meta?.symbol || selectedCrypto1.symbol}</p>
                        </div>
                      </div>
                      <div className="mt-4 text-3xl font-bold text-white">
                        {formatCurrency(crypto1Data.meta?.current_price)}
                        <span className={`text-sm ml-2 ${(crypto1Data.meta?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(crypto1Data.meta?.price_change_percentage_24h || 0) >= 0 ? '▲' : '▼'} {Math.abs(crypto1Data.meta?.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border border-yellow-500/30 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        {crypto2Data.meta?.image && (
                          <img src={`/api/proxy-images?url=${encodeURIComponent(crypto2Data.meta.image)}`} alt="" className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                          <h4 className="text-xl font-bold text-white">{crypto2Data.meta?.name || selectedCrypto2.name}</h4>
                          <p className="text-yellow-300 font-mono text-sm uppercase">{crypto2Data.meta?.symbol || selectedCrypto2.symbol}</p>
                        </div>
                      </div>
                      <div className="mt-4 text-3xl font-bold text-white">
                        {formatCurrency(crypto2Data.meta?.current_price)}
                        <span className={`text-sm ml-2 ${(crypto2Data.meta?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(crypto2Data.meta?.price_change_percentage_24h || 0) >= 0 ? '▲' : '▼'} {Math.abs(crypto2Data.meta?.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden mb-8">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-4 px-6 text-gray-400 font-medium">Metric</th>
                          <th className="text-right py-4 px-6 text-orange-300 font-medium">{crypto1Data.meta?.symbol?.toUpperCase()}</th>
                          <th className="text-right py-4 px-6 text-yellow-300 font-medium">{crypto2Data.meta?.symbol?.toUpperCase()}</th>
                          <th className="text-center py-4 px-6 text-gray-400 font-medium">Winner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Market Cap Rank - Lower is better */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">Market Cap Rank</td>
                          <td className="py-3 px-6 text-right text-white font-medium">#{crypto1Data.meta?.market_cap_rank || 'N/A'}</td>
                          <td className="py-3 px-6 text-right text-white font-medium">#{crypto2Data.meta?.market_cap_rank || 'N/A'}</td>
                          <td className="py-3 px-6 text-center">
                            {crypto1Data.meta?.market_cap_rank && crypto2Data.meta?.market_cap_rank
                              ? (crypto1Data.meta.market_cap_rank < crypto2Data.meta.market_cap_rank
                                ? <span className="text-orange-400">◀</span>
                                : crypto1Data.meta.market_cap_rank > crypto2Data.meta.market_cap_rank
                                  ? <span className="text-yellow-400">▶</span>
                                  : <span className="text-gray-500">=</span>)
                              : <span className="text-gray-500">-</span>}
                          </td>
                        </tr>
                        {/* Market Cap */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">Market Cap</td>
                          <td className="py-3 px-6 text-right text-white font-medium">{formatLargeCurrency(crypto1Data.meta?.market_cap)}</td>
                          <td className="py-3 px-6 text-right text-white font-medium">{formatLargeCurrency(crypto2Data.meta?.market_cap)}</td>
                          <td className="py-3 px-6 text-center">
                            {(crypto1Data.meta?.market_cap || 0) > (crypto2Data.meta?.market_cap || 0)
                              ? <span className="text-orange-400">◀</span>
                              : (crypto1Data.meta?.market_cap || 0) < (crypto2Data.meta?.market_cap || 0)
                                ? <span className="text-yellow-400">▶</span>
                                : <span className="text-gray-500">=</span>}
                          </td>
                        </tr>
                        {/* Current Price */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">Current Price</td>
                          <td className="py-3 px-6 text-right text-white font-medium">{formatCurrency(crypto1Data.meta?.current_price)}</td>
                          <td className="py-3 px-6 text-right text-white font-medium">{formatCurrency(crypto2Data.meta?.current_price)}</td>
                          <td className="py-3 px-6 text-center text-gray-500">-</td>
                        </tr>
                        {/* 24h Change - Higher is better */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">24h Change</td>
                          <td className={`py-3 px-6 text-right font-medium ${(crypto1Data.meta?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(crypto1Data.meta?.price_change_percentage_24h || 0).toFixed(2)}%
                          </td>
                          <td className={`py-3 px-6 text-right font-medium ${(crypto2Data.meta?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(crypto2Data.meta?.price_change_percentage_24h || 0).toFixed(2)}%
                          </td>
                          <td className="py-3 px-6 text-center">
                            {(crypto1Data.meta?.price_change_percentage_24h || 0) > (crypto2Data.meta?.price_change_percentage_24h || 0)
                              ? <span className="text-orange-400">◀</span>
                              : (crypto1Data.meta?.price_change_percentage_24h || 0) < (crypto2Data.meta?.price_change_percentage_24h || 0)
                                ? <span className="text-yellow-400">▶</span>
                                : <span className="text-gray-500">=</span>}
                          </td>
                        </tr>
                        {/* 24h Volume */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">24h Volume</td>
                          <td className="py-3 px-6 text-right text-white font-medium">{formatLargeCurrency(crypto1Data.meta?.total_volume)}</td>
                          <td className="py-3 px-6 text-right text-white font-medium">{formatLargeCurrency(crypto2Data.meta?.total_volume)}</td>
                          <td className="py-3 px-6 text-center">
                            {(crypto1Data.meta?.total_volume || 0) > (crypto2Data.meta?.total_volume || 0)
                              ? <span className="text-orange-400">◀</span>
                              : (crypto1Data.meta?.total_volume || 0) < (crypto2Data.meta?.total_volume || 0)
                                ? <span className="text-yellow-400">▶</span>
                                : <span className="text-gray-500">=</span>}
                          </td>
                        </tr>
                        {/* All Time High */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">All Time High</td>
                          <td className="py-3 px-6 text-right text-white">{formatCurrency(crypto1Data.meta?.ath)}</td>
                          <td className="py-3 px-6 text-right text-white">{formatCurrency(crypto2Data.meta?.ath)}</td>
                          <td className="py-3 px-6 text-center text-gray-500">-</td>
                        </tr>
                        {/* 24h High */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">24h High</td>
                          <td className="py-3 px-6 text-right text-white">{formatCurrency(crypto1Data.meta?.high_24h)}</td>
                          <td className="py-3 px-6 text-right text-white">{formatCurrency(crypto2Data.meta?.high_24h)}</td>
                          <td className="py-3 px-6 text-center text-gray-500">-</td>
                        </tr>
                        {/* 24h Low */}
                        <tr className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">24h Low</td>
                          <td className="py-3 px-6 text-right text-white">{formatCurrency(crypto1Data.meta?.low_24h)}</td>
                          <td className="py-3 px-6 text-right text-white">{formatCurrency(crypto2Data.meta?.low_24h)}</td>
                          <td className="py-3 px-6 text-center text-gray-500">-</td>
                        </tr>
                        {/* Circulating Supply */}
                        <tr className="hover:bg-white/5">
                          <td className="py-3 px-6 text-gray-300">Circulating Supply</td>
                          <td className="py-3 px-6 text-right text-white text-sm">{crypto1Data.meta?.circulating_supply ? Number(crypto1Data.meta.circulating_supply).toLocaleString() : 'N/A'}</td>
                          <td className="py-3 px-6 text-right text-white text-sm">{crypto2Data.meta?.circulating_supply ? Number(crypto2Data.meta.circulating_supply).toLocaleString() : 'N/A'}</td>
                          <td className="py-3 px-6 text-center text-gray-500">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* AI Analysis */}
                  <div className="p-6 bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border border-orange-500/20 rounded-xl">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">🤖</span> AI Comparison Analysis
                    </h4>
                    <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                      <p>
                        <strong className="text-white">Overview:</strong> Comparing {crypto1Data.meta?.name || selectedCrypto1.name} (#{crypto1Data.meta?.market_cap_rank})
                        and {crypto2Data.meta?.name || selectedCrypto2.name} (#{crypto2Data.meta?.market_cap_rank}) by market cap rank.
                      </p>

                      <p>
                        <strong className="text-white">Market Position:</strong> {crypto1Data.meta?.market_cap > crypto2Data.meta?.market_cap
                          ? `${crypto1Data.meta?.name} has a larger market cap (${formatLargeCurrency(crypto1Data.meta?.market_cap)}) compared to ${crypto2Data.meta?.name} (${formatLargeCurrency(crypto2Data.meta?.market_cap)}).`
                          : `${crypto2Data.meta?.name} has a larger market cap (${formatLargeCurrency(crypto2Data.meta?.market_cap)}) compared to ${crypto1Data.meta?.name} (${formatLargeCurrency(crypto1Data.meta?.market_cap)}).`}
                      </p>

                      <p>
                        <strong className="text-white">Recent Performance:</strong> In the last 24 hours,
                        {(crypto1Data.meta?.price_change_percentage_24h || 0) > (crypto2Data.meta?.price_change_percentage_24h || 0)
                          ? ` ${crypto1Data.meta?.name} performed better with ${crypto1Data.meta?.price_change_percentage_24h?.toFixed(2)}% change vs ${crypto2Data.meta?.price_change_percentage_24h?.toFixed(2)}% for ${crypto2Data.meta?.name}.`
                          : ` ${crypto2Data.meta?.name} performed better with ${crypto2Data.meta?.price_change_percentage_24h?.toFixed(2)}% change vs ${crypto1Data.meta?.price_change_percentage_24h?.toFixed(2)}% for ${crypto1Data.meta?.name}.`}
                      </p>

                      <p className="text-sm text-gray-400 italic border-t border-white/10 pt-4 mt-4">
                        ⚠️ Disclaimer: Cryptocurrency investments are highly volatile. This analysis is for informational purposes only and should not be considered financial advice. Always do your own research.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Chatbot />
    </>
  );
}
