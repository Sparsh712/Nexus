"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useUser from "@/lib/authClient";
import StockAIDostModal from "../../components/StockAIDostModal";
import StockAIReportModal from "../../components/StockAIReportModal";
import Chatbot from "../../components/Chatbot";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Legend,
} from "recharts";
import Navbar from "../../components/Navbar";

// Utility functions
function formatPct(val) {
  return isNaN(val) ? "--" : (val * 100).toFixed(2) + "%";
}
function formatRs(val) {
  return isNaN(val) ? "--" : "₹" + Number(val).toLocaleString("en-IN");
}

// Custom Heatmap Component using Bar Chart (copied from MF page design)
function PerformanceHeatmap({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No heatmap data available
      </div>
    );
  }

  // Format data for bar chart - take last 12 months
  const chartData = data.slice(-12).map(item => ({
    month: `${item.month}/${item.year}`,
    value: item.value,
    displayValue: item.value.toFixed(4)
  }));

  const getColor = (value) => {
    if (value > 0.15) return "#eab308";
    if (value > 0.05) return "#84cc16";
    if (value > 0) return "#10b981";
    if (value > -0.05) return "#6366f1";
    return "#8b5cf6";
  };

  return (
    <div className="w-full h-full bg-white rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickFormatter={(val) => val.toFixed(4)}
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
            formatter={(value) => [value.toFixed(4), 'Monthly Return']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-end gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#8b5cf6] rounded"></div>
          <span className="text-gray-600">Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#6366f1] rounded"></div>
          <span className="text-gray-600">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#10b981] rounded"></div>
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-[#eab308] rounded"></div>
          <span className="text-gray-600">High</span>
        </div>
      </div>
    </div>
  );
}

export default function StockDetailsPage() {
  const { symbol } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [riskVolatility, setRiskVolatility] = useState({});
  const [monteCarlo, setMonteCarlo] = useState({});
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

  // Compare stocks state
  const [stock1Query, setStock1Query] = useState("");
  const [stock2Query, setStock2Query] = useState("");
  const [stock1Suggestions, setStock1Suggestions] = useState([]);
  const [stock2Suggestions, setStock2Suggestions] = useState([]);
  const [showStock1Dropdown, setShowStock1Dropdown] = useState(false);
  const [showStock2Dropdown, setShowStock2Dropdown] = useState(false);
  const [selectedStock1, setSelectedStock1] = useState(null);
  const [selectedStock2, setSelectedStock2] = useState(null);
  const [stock1Data, setStock1Data] = useState(null);
  const [stock2Data, setStock2Data] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // AI Modals
  const [showAIDost, setShowAIDost] = useState(false);
  const [showAIReport, setShowAIReport] = useState(false);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const [isInPortfolio, setIsInPortfolio] = useState(false);
  const [portfolioItemId, setPortfolioItemId] = useState(null);
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    const fetchAllData = async (showLoading = true) => {
      if (showLoading) setLoading(true);

      try {
        const endpoints = {
          profile: `${process.env.NEXT_PUBLIC_API_URL}/api/stock/profile/${symbol}`,
          history: `${process.env.NEXT_PUBLIC_API_URL}/api/stock/history/${symbol}`,
          heatmap: `${process.env.NEXT_PUBLIC_API_URL}/api/stock/performance-heatmap/${symbol}`,
          risk: `${process.env.NEXT_PUBLIC_API_URL}/api/stock/risk-volatility/${symbol}`,
          montecarlo: `${process.env.NEXT_PUBLIC_API_URL}/api/stock/monte-carlo-prediction/${symbol}`,
        };

        const results = {};

        for (const [key, url] of Object.entries(endpoints)) {
          try {
            const res = await fetch(url);
            const text = await res.text();
            try {
              results[key] = res.ok ? JSON.parse(text) : null;
            } catch (parseErr) {
              console.error(`Non-JSON response from ${url}:`, text.slice(0, 1000));
              results[key] = null;
            }
          } catch (fetchErr) {
            console.error(`Network error fetching ${url}:`, fetchErr);
            results[key] = null;
          }
        }

        setProfile(results.profile || null);
        setHistory(results.history || []);
        setHeatmap(results.heatmap || []);
        setRiskVolatility(results.risk || {});
        setMonteCarlo(results.montecarlo || {});
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    // Function to fetch only profile (price data)
    const fetchProfileOnly = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/profile/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    // Check if Indian stock market is open (Mon-Fri, 9:00 AM - 3:30 PM IST)
    const isMarketOpen = () => {
      const now = new Date();
      // Convert to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const utcOffset = now.getTimezoneOffset() * 60 * 1000;
      const istTime = new Date(now.getTime() + utcOffset + istOffset);

      const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      // Market hours: 9:00 AM to 3:30 PM, Monday to Friday
      const marketOpen = 9 * 60;  // 9:00 AM = 540 minutes
      const marketClose = 15 * 60 + 30; // 3:30 PM = 930 minutes

      const isWeekday = day >= 1 && day <= 5;
      const isDuringHours = timeInMinutes >= marketOpen && timeInMinutes <= marketClose;

      return isWeekday && isDuringHours;
    };

    // Initial full data fetch
    fetchAllData(true);

    // Only poll for real-time updates during market hours
    // Outside market hours, prices don't change so no need to auto-refresh
    if (isMarketOpen()) {
      const interval = setInterval(fetchProfileOnly, 3000);
      return () => clearInterval(interval);
    }
    // No auto-refresh outside market hours - reduces API load significantly
  }, [symbol]);

  // Debounced search for stock 1
  useEffect(() => {
    // Skip search if stock is already selected (prevents dropdown from reopening)
    if (selectedStock1) {
      setShowStock1Dropdown(false);
      return;
    }
    if (stock1Query.length < 1) {
      setStock1Suggestions([]);
      setShowStock1Dropdown(false);
      return;
    }
    setShowStock1Dropdown(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/search-stocks?q=${encodeURIComponent(stock1Query)}`);
        const data = await res.json();
        setStock1Suggestions(data || []);
      } catch (e) {
        console.error('Error fetching stock suggestions:', e);
        setStock1Suggestions([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [stock1Query, selectedStock1]);

  // Debounced search for stock 2
  useEffect(() => {
    // Skip search if stock is already selected (prevents dropdown from reopening)
    if (selectedStock2) {
      setShowStock2Dropdown(false);
      return;
    }
    if (stock2Query.length < 1) {
      setStock2Suggestions([]);
      setShowStock2Dropdown(false);
      return;
    }
    setShowStock2Dropdown(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/search-stocks?q=${encodeURIComponent(stock2Query)}`);
        const data = await res.json();
        setStock2Suggestions(data || []);
      } catch (e) {
        console.error('Error fetching stock suggestions:', e);
        setStock2Suggestions([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [stock2Query, selectedStock2]);

  // Fetch data for selected stock 1
  useEffect(() => {
    if (!selectedStock1) return;
    (async () => {
      try {
        const [profileRes, extendedRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/profile/${selectedStock1.symbol}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/extended-quote/${selectedStock1.symbol}`)
        ]);
        const profile = await profileRes.json();
        const extended = extendedRes.ok ? await extendedRes.json() : null;
        setStock1Data({ profile, extended });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedStock1]);

  // Fetch data for selected stock 2
  useEffect(() => {
    if (!selectedStock2) return;
    (async () => {
      try {
        const [profileRes, extendedRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/profile/${selectedStock2.symbol}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/extended-quote/${selectedStock2.symbol}`)
        ]);
        const profile = await profileRes.json();
        const extended = extendedRes.ok ? await extendedRes.json() : null;
        setStock2Data({ profile, extended });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedStock2]);

  const handleStock1Select = (s) => {
    setSelectedStock1(s);
    setStock1Query(s.name || s.symbol);
    setShowStock1Dropdown(false);
  };
  const handleStock2Select = (s) => {
    setSelectedStock2(s);
    setStock2Query(s.name || s.symbol);
    setShowStock2Dropdown(false);
  };

  const handleAddToPortfolio = async () => {
    if (!isSignedIn || !user) {
      alert("Please sign in to add items to your portfolio");
      return;
    }

    try {
      setAddingToPortfolio(true);
      console.log('Adding to portfolio:', {
        userId: user.sub,
        symbol,
        name: profile?.longName || symbol
      });

      // Using Next.js API route instead of calling FastAPI directly
      const userId = encodeURIComponent(user.sub || '');
      const response = await fetch(`/api/portfolio/add/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: symbol,
          name: profile?.longName || symbol,
          item_type: "stock"
        }),
      });

      const responseText = await response.text();
      console.log('API Response:', response.status, responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (response.status === 400) {
          alert(data.detail || "Stock already in portfolio");
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
      alert(error.message || "Failed to add to portfolio. Please try again.");
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
          const existing = items.find(item => item.symbol === symbol);
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
  }, [isSignedIn, user, symbol]);

  const estReturn = amount * Math.pow(1 + (riskVolatility.annualized_return || 0), Number(years || 1));
  const estProfit = estReturn - amount;

  return (
    <>
      <Navbar />
      <section className="min-h-screen pt-32 pb-12 px-4 bg-[#030014] text-white relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto grid gap-6">
          {loading ? (
            <div className="flex justify-center items-center min-h-[60vh]">
              <span className="animate-spin border-4 border-cyan-500 border-t-transparent rounded-full w-12 h-12 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></span>
            </div>
          ) : (
            <>


              <div className="mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <h2 className="text-3xl font-bold text-white text-center mb-6 relative z-10">
                    {profile?.longName || profile?.companyName || symbol} <span className="text-xl text-gray-400 font-normal ml-2">({symbol})</span>
                  </h2>
                  <div className="flex gap-4 justify-center relative z-10 flex-wrap">
                    <button onClick={() => setShowAIDost(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 border border-white/10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      NexBôt Analysis
                    </button>
                    <button onClick={() => setShowAIReport(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center gap-2 border border-white/10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Generate AI Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div className="flex flex-col gap-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4 flex items-center gap-2">
                      <span className="text-cyan-400">ℹ️</span>
                      {profile?.longName || symbol}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Industry:</span>
                        <span className="text-white font-semibold">{profile?.industry || 'Not Available'}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Sector:</span>
                        <span className="text-white font-semibold">{profile?.sector || 'Not Available'}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Market Cap:</span>
                        <span className="text-white font-semibold">{formatRs(profile?.marketCap || profile?.market_cap)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium text-gray-300">Symbol:</span>
                        <span className="text-white font-semibold">{symbol}</span>
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

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Calculate Your Returns</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-base mb-2"><span className="text-gray-300 font-medium">Investment Amount (₹):</span></label>
                        <input className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono" type="number" min="100" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-base mb-2"><span className="text-gray-300 font-medium">Duration (Years):</span></label>
                        <input className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono" type="number" min="1" value={years} onChange={e => setYears(Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="mt-6 space-y-3 text-base border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Estimated Total Value:</span><span className="font-bold text-white text-lg">{formatRs(estReturn)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Estimated Profit:</span><span className="font-bold text-green-400 text-lg">{formatRs(estProfit)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Annualized Return:</span><span className="font-bold text-white text-lg">{formatPct(riskVolatility.annualized_return)}</span></div>
                      <p className="text-sm opacity-70 mt-4 text-gray-400 italic">*Based on historical annualized return, actual returns may vary.</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Risk & Volatility</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-base"><span className="text-gray-300 font-medium">Annualized Volatility:</span><span className="font-bold text-white">{formatPct(riskVolatility.annualized_volatility)}</span></div>
                      <div className="flex justify-between items-center text-base"><span className="text-gray-300 font-medium">Annualized Return:</span><span className="font-bold text-white">{formatPct(riskVolatility.annualized_return)}</span></div>
                      <div className="flex justify-between items-center text-base"><span className="text-gray-300 font-medium">Sharpe Ratio:</span><span className="font-bold text-white">{riskVolatility.sharpe_ratio?.toFixed(2) ?? "--"}</span></div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl h-64 p-2 mt-4">
                      {riskVolatility.returns?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={riskVolatility.returns.slice(-100)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Line type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={1.5} dot={false} />
                            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(val) => (val * 100).toFixed(1) + '%'} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} formatter={(value) => [(value * 100).toFixed(4) + '%', 'Daily Return']} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                      <h3 className="text-xl font-bold text-white">Historical Price</h3>
                      <div className="flex gap-2">
                        {["1M", "3M", "6M", "1Y"].map((period) => (
                          <button key={period} onClick={() => setSelectedPeriod(period)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === period ? "bg-purple-600 text-white" : "bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"}`}>{period}</button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl h-64 p-2">
                      {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={history.slice(selectedPeriod === "1Y" ? -365 : selectedPeriod === "6M" ? -180 : selectedPeriod === "3M" ? -90 : -30)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Line type="monotone" dataKey="close" stroke="#06b6d4" strokeWidth={2} dot={false} />
                            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                            <YAxis domain={["auto", "auto"]} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(val) => '₹' + val.toFixed(2)} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} formatter={(value) => ['₹' + value.toFixed(2), 'Price']} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#181f31] rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Moving Averages (20 & 50 Days)</h3>
                    <div className="bg-black/40 border border-white/5 rounded-xl h-64 p-2">
                      {history.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={history.slice(-30)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar dataKey="ma20" barSize={10} fill="#f08bd6" name="MA 20" />
                            <Bar dataKey="ma50" barSize={10} fill="#9b5cff" name="MA 50" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md h-fit hover:border-white/20 transition-colors">
                    <h3 className="text-xl font-bold mb-3 text-white border-b border-white/10 pb-2">Monte Carlo Prediction (1 Year)</h3>
                    <div className="space-y-3 mb-4 text-base">
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Expected Price:</span><span className="font-bold text-white">{formatRs(monteCarlo.expected_price)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Probability of Positive Return:</span><span className="font-bold text-white">{formatPct(monteCarlo.probability_positive_return / 100)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Range:</span><span className="font-bold text-white">{monteCarlo.lower_bound_5th_percentile?.toFixed(2)} - {monteCarlo.upper_bound_95th_percentile?.toFixed(2)}</span></div>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl h-64 p-2">
                      {monteCarlo.expected_price ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { label: "Last Price", value: monteCarlo.last_price },
                            { label: "Expected", value: monteCarlo.expected_price },
                            { label: "5th %", value: monteCarlo.lower_bound_5th_percentile },
                            { label: "95th %", value: monteCarlo.upper_bound_95th_percentile }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(val) => '₹' + val.toFixed(0)} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "6px" }} formatter={(value) => ['₹' + value.toFixed(2), 'Price']} />
                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-gray-400 text-sm flex items-center justify-center h-full">No data</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-md">
                <h3 className="text-2xl font-bold mb-6 text-white">Compare Stocks</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="block text-base mb-2 text-gray-300 font-medium">First Stock</label>
                    <input type="text" value={stock1Query} onChange={(e) => { setStock1Query(e.target.value); setSelectedStock1(null); }} onFocus={() => stock1Query.length >= 1 && setShowStock1Dropdown(true)} placeholder="Type to search (e.g., TCS, INFY, RELIANCE)..." className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500" />
                    {showStock1Dropdown && stock1Suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto backdrop-blur-xl">
                        {stock1Suggestions.map((s) => (
                          <div key={s.symbol || s.code} onClick={() => { setShowStock1Dropdown(false); handleStock1Select(s); }} className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0">
                            <div className="text-white font-medium text-sm mb-1">{s.name || s.longName || s.symbol}</div>
                            <div className="text-gray-400 text-xs">Symbol: {s.symbol || s.code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedStock1 && (<div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg"><div className="text-green-400 text-sm font-medium">✓ Selected: {selectedStock1.name || selectedStock1.symbol}</div><div className="text-gray-400 text-xs mt-1">Symbol: {selectedStock1.symbol || selectedStock1.code}</div></div>)}
                    <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                  </div>

                  <div className="relative">
                    <label className="block text-base mb-2 text-gray-300 font-medium">Second Stock</label>
                    <input type="text" value={stock2Query} onChange={(e) => { setStock2Query(e.target.value); setSelectedStock2(null); }} onFocus={() => stock2Query.length >= 1 && setShowStock2Dropdown(true)} placeholder="Type to search (e.g., TCS, INFY, RELIANCE)..." className="w-full bg-black/40 border border-white/10 text-white p-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500" />
                    {showStock2Dropdown && stock2Suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto backdrop-blur-xl">
                        {stock2Suggestions.map((s) => (
                          <div key={s.symbol || s.code} onClick={() => { setShowStock2Dropdown(false); handleStock2Select(s); }} className="p-4 hover:bg-purple-600 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0">
                            <div className="text-white font-medium text-sm mb-1">{s.name || s.longName || s.symbol}</div>
                            <div className="text-gray-400 text-xs">Symbol: {s.symbol || s.code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedStock2 && (<div className="mt-2 p-3 bg-green-900/30 border border-green-600 rounded-lg"><div className="text-green-400 text-sm font-medium">✓ Selected: {selectedStock2.name || selectedStock2.symbol}</div><div className="text-gray-400 text-xs mt-1">Symbol: {selectedStock2.symbol || selectedStock2.code}</div></div>)}
                    <p className="text-xs text-gray-400 mt-2 italic">Type any letter to search</p>
                  </div>
                </div>

                {selectedStock1 && selectedStock2 && (
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

                {showComparison && stock1Data && stock2Data && (
                  <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-md">
                    <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                      <span className="bg-gradient-to-r from-purple-500 to-cyan-500 text-transparent bg-clip-text">📊</span>
                      Stock Comparison
                    </h3>

                    {/* Header Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
                        <h4 className="text-xl font-bold text-white mb-2">{stock1Data.profile?.longName || selectedStock1.name}</h4>
                        <p className="text-purple-300 font-mono text-sm">{selectedStock1.symbol}</p>
                        <div className="mt-4 text-3xl font-bold text-white">
                          {formatRs(stock1Data.profile?.regularMarketPrice || stock1Data.extended?.price)}
                          <span className={`text-sm ml-2 ${(stock1Data.extended?.dayChangePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(stock1Data.extended?.dayChangePercent || 0) >= 0 ? '▲' : '▼'} {Math.abs(stock1Data.extended?.dayChangePercent || 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 border border-cyan-500/30 rounded-xl p-6">
                        <h4 className="text-xl font-bold text-white mb-2">{stock2Data.profile?.longName || selectedStock2.name}</h4>
                        <p className="text-cyan-300 font-mono text-sm">{selectedStock2.symbol}</p>
                        <div className="mt-4 text-3xl font-bold text-white">
                          {formatRs(stock2Data.profile?.regularMarketPrice || stock2Data.extended?.price)}
                          <span className={`text-sm ml-2 ${(stock2Data.extended?.dayChangePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(stock2Data.extended?.dayChangePercent || 0) >= 0 ? '▲' : '▼'} {Math.abs(stock2Data.extended?.dayChangePercent || 0).toFixed(2)}%
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
                            <th className="text-right py-4 px-6 text-purple-300 font-medium">{selectedStock1.symbol?.replace('.NS', '')}</th>
                            <th className="text-right py-4 px-6 text-cyan-300 font-medium">{selectedStock2.symbol?.replace('.NS', '')}</th>
                            <th className="text-center py-4 px-6 text-gray-400 font-medium">Winner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Market Cap */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">Market Cap</td>
                            <td className="py-3 px-6 text-right text-white font-medium">{formatRs(stock1Data.profile?.marketCap)}</td>
                            <td className="py-3 px-6 text-right text-white font-medium">{formatRs(stock2Data.profile?.marketCap)}</td>
                            <td className="py-3 px-6 text-center">
                              {(stock1Data.profile?.marketCap || 0) > (stock2Data.profile?.marketCap || 0)
                                ? <span className="text-purple-400">◀</span>
                                : (stock1Data.profile?.marketCap || 0) < (stock2Data.profile?.marketCap || 0)
                                  ? <span className="text-cyan-400">▶</span>
                                  : <span className="text-gray-500">=</span>}
                            </td>
                          </tr>
                          {/* Sector */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">Sector</td>
                            <td className="py-3 px-6 text-right text-white">{stock1Data.profile?.sector || 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white">{stock2Data.profile?.sector || 'N/A'}</td>
                            <td className="py-3 px-6 text-center text-gray-500">-</td>
                          </tr>
                          {/* Industry */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">Industry</td>
                            <td className="py-3 px-6 text-right text-white text-sm">{stock1Data.profile?.industry || 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white text-sm">{stock2Data.profile?.industry || 'N/A'}</td>
                            <td className="py-3 px-6 text-center text-gray-500">-</td>
                          </tr>
                          {/* P/E Ratio - Lower is better for value */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">P/E Ratio</td>
                            <td className="py-3 px-6 text-right text-white font-medium">{stock1Data.extended?.peRatio?.toFixed(2) || 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white font-medium">{stock2Data.extended?.peRatio?.toFixed(2) || 'N/A'}</td>
                            <td className="py-3 px-6 text-center">
                              {stock1Data.extended?.peRatio && stock2Data.extended?.peRatio
                                ? (stock1Data.extended.peRatio < stock2Data.extended.peRatio
                                  ? <span className="text-purple-400" title="Lower P/E = Better Value">◀</span>
                                  : stock1Data.extended.peRatio > stock2Data.extended.peRatio
                                    ? <span className="text-cyan-400" title="Lower P/E = Better Value">▶</span>
                                    : <span className="text-gray-500">=</span>)
                                : <span className="text-gray-500">-</span>}
                            </td>
                          </tr>
                          {/* EPS - Higher is better */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">EPS</td>
                            <td className="py-3 px-6 text-right text-white font-medium">{stock1Data.extended?.eps ? '₹' + stock1Data.extended.eps.toFixed(2) : 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white font-medium">{stock2Data.extended?.eps ? '₹' + stock2Data.extended.eps.toFixed(2) : 'N/A'}</td>
                            <td className="py-3 px-6 text-center">
                              {stock1Data.extended?.eps && stock2Data.extended?.eps
                                ? (stock1Data.extended.eps > stock2Data.extended.eps
                                  ? <span className="text-purple-400">◀</span>
                                  : stock1Data.extended.eps < stock2Data.extended.eps
                                    ? <span className="text-cyan-400">▶</span>
                                    : <span className="text-gray-500">=</span>)
                                : <span className="text-gray-500">-</span>}
                            </td>
                          </tr>
                          {/* 52-Week High */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">52-Week High</td>
                            <td className="py-3 px-6 text-right text-white">{stock1Data.extended?.fiftyTwoWeekHigh ? '₹' + stock1Data.extended.fiftyTwoWeekHigh.toFixed(2) : 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white">{stock2Data.extended?.fiftyTwoWeekHigh ? '₹' + stock2Data.extended.fiftyTwoWeekHigh.toFixed(2) : 'N/A'}</td>
                            <td className="py-3 px-6 text-center text-gray-500">-</td>
                          </tr>
                          {/* 52-Week Low */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">52-Week Low</td>
                            <td className="py-3 px-6 text-right text-white">{stock1Data.extended?.fiftyTwoWeekLow ? '₹' + stock1Data.extended.fiftyTwoWeekLow.toFixed(2) : 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white">{stock2Data.extended?.fiftyTwoWeekLow ? '₹' + stock2Data.extended.fiftyTwoWeekLow.toFixed(2) : 'N/A'}</td>
                            <td className="py-3 px-6 text-center text-gray-500">-</td>
                          </tr>
                          {/* Dividend Yield - Higher is better */}
                          <tr className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">Dividend Yield</td>
                            <td className="py-3 px-6 text-right text-white">{stock1Data.extended?.dividendYield ? (stock1Data.extended.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white">{stock2Data.extended?.dividendYield ? (stock2Data.extended.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</td>
                            <td className="py-3 px-6 text-center">
                              {stock1Data.extended?.dividendYield && stock2Data.extended?.dividendYield
                                ? (stock1Data.extended.dividendYield > stock2Data.extended.dividendYield
                                  ? <span className="text-purple-400">◀</span>
                                  : stock1Data.extended.dividendYield < stock2Data.extended.dividendYield
                                    ? <span className="text-cyan-400">▶</span>
                                    : <span className="text-gray-500">=</span>)
                                : <span className="text-gray-500">-</span>}
                            </td>
                          </tr>
                          {/* Beta - Depends on preference */}
                          <tr className="hover:bg-white/5">
                            <td className="py-3 px-6 text-gray-300">Beta</td>
                            <td className="py-3 px-6 text-right text-white">{stock1Data.extended?.beta?.toFixed(2) || 'N/A'}</td>
                            <td className="py-3 px-6 text-right text-white">{stock2Data.extended?.beta?.toFixed(2) || 'N/A'}</td>
                            <td className="py-3 px-6 text-center text-gray-500" title="Depends on risk preference">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* AI Analysis */}
                    <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">🤖</span> AI Comparison Analysis
                      </h4>
                      <div className="space-y-4 text-gray-300 text-base leading-relaxed">
                        <p>
                          <strong className="text-white">Overview:</strong> Comparing {stock1Data.profile?.longName || selectedStock1.name} ({selectedStock1.symbol?.replace('.NS', '')})
                          and {stock2Data.profile?.longName || selectedStock2.name} ({selectedStock2.symbol?.replace('.NS', '')}),
                          {stock1Data.profile?.sector === stock2Data.profile?.sector
                            ? ` both operate in the ${stock1Data.profile?.sector} sector.`
                            : ` they operate in different sectors: ${stock1Data.profile?.sector || 'N/A'} and ${stock2Data.profile?.sector || 'N/A'} respectively.`}
                        </p>

                        {stock1Data.profile?.marketCap && stock2Data.profile?.marketCap && (
                          <p>
                            <strong className="text-white">Size:</strong> {stock1Data.profile.marketCap > stock2Data.profile.marketCap
                              ? `${stock1Data.profile?.longName || selectedStock1.name} is the larger company`
                              : `${stock2Data.profile?.longName || selectedStock2.name} is the larger company`}
                            by market capitalization ({formatRs(Math.abs(stock1Data.profile.marketCap - stock2Data.profile.marketCap))} difference).
                          </p>
                        )}

                        {stock1Data.extended?.peRatio && stock2Data.extended?.peRatio && (
                          <p>
                            <strong className="text-white">Valuation:</strong> {stock1Data.extended.peRatio < stock2Data.extended.peRatio
                              ? `${stock1Data.profile?.longName || selectedStock1.name} has a lower P/E ratio (${stock1Data.extended.peRatio.toFixed(2)} vs ${stock2Data.extended.peRatio.toFixed(2)}), potentially indicating better value.`
                              : `${stock2Data.profile?.longName || selectedStock2.name} has a lower P/E ratio (${stock2Data.extended.peRatio.toFixed(2)} vs ${stock1Data.extended.peRatio.toFixed(2)}), potentially indicating better value.`}
                          </p>
                        )}

                        <p className="text-sm text-gray-400 italic border-t border-white/10 pt-4 mt-4">
                          ⚠️ Disclaimer: This analysis is for informational purposes only and should not be considered financial advice.
                          Please conduct thorough research and consult with a financial advisor before making investment decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedStock1 && !selectedStock2 && (<p className="text-center text-gray-400 text-base">Search and select two stocks to compare their performance metrics</p>)}
              </div>

              <StockAIDostModal isOpen={showAIDost} onClose={() => setShowAIDost(false)} stockData={{ meta: profile, navHistory: history, riskVolatility, monteCarlo }} />
              <StockAIReportModal isOpen={showAIReport} onClose={() => setShowAIReport(false)} stockData={{ meta: profile, navHistory: history, riskVolatility, monteCarlo }} />

              {/* Chatbot */}
              <Chatbot
                selectedFund={{
                  name: profile?.longName || profile?.companyName || symbol,
                  code: symbol
                }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}

