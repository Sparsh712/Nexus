"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

const sectors = ["All", "Technology", "Banking", "Finance", "FMCG", "Energy", "Pharma", "Automobile", "Infrastructure", "Telecom", "Consumer", "Metals", "Healthcare"];

const presets = [
    { name: "Large Cap", filters: { minMarketCap: 500000 } },
    { name: "Mid Cap", filters: { minMarketCap: 100000, maxMarketCap: 500000 } },
    { name: "Low P/E", filters: { maxPe: 20 } },
    { name: "High Growth", filters: { minChange: 1.5 } },
    { name: "Banking", filters: { sector: "Banking" } },
    { name: "Tech", filters: { sector: "Technology" } },
];

export default function ScreenerPage() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState("marketCap");
    const [sortOrder, setSortOrder] = useState("desc");

    // Filters
    const [sector, setSector] = useState("All");
    const [minMarketCap, setMinMarketCap] = useState(0);
    const [maxMarketCap, setMaxMarketCap] = useState(2000000);
    const [minPe, setMinPe] = useState(0);
    const [maxPe, setMaxPe] = useState(100);
    const [minChange, setMinChange] = useState(-10);
    const [maxChange, setMaxChange] = useState(10);

    // Fetch stocks from API
    const fetchStocks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/screener/stocks`);
            if (!response.ok) throw new Error("Failed to fetch stocks");
            const data = await response.json();
            setStocks(data.stocks || []);
        } catch (err) {
            console.error("Screener fetch error:", err);
            setError("Failed to load stock data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const applyPreset = (preset) => {
        setSector(preset.filters.sector || "All");
        setMinMarketCap(preset.filters.minMarketCap || 0);
        setMaxMarketCap(preset.filters.maxMarketCap || 2000000);
        setMinPe(preset.filters.minPe || 0);
        setMaxPe(preset.filters.maxPe || 100);
        setMinChange(preset.filters.minChange || -10);
        setMaxChange(preset.filters.maxChange || 10);
    };

    const resetFilters = () => {
        setSector("All");
        setMinMarketCap(0);
        setMaxMarketCap(2000000);
        setMinPe(0);
        setMaxPe(100);
        setMinChange(-10);
        setMaxChange(10);
    };

    const filteredStocks = useMemo(() => {
        return stocks
            .filter(stock => {
                if (sector !== "All" && stock.sector !== sector) return false;
                if (stock.marketCap < minMarketCap || stock.marketCap > maxMarketCap) return false;
                if (stock.pe && (stock.pe < minPe || stock.pe > maxPe)) return false;
                if (stock.changePercent < minChange || stock.changePercent > maxChange) return false;
                return true;
            })
            .sort((a, b) => {
                const aVal = a[sortBy] || 0;
                const bVal = b[sortBy] || 0;
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            });
    }, [stocks, sector, minMarketCap, maxMarketCap, minPe, maxPe, minChange, maxChange, sortBy, sortOrder]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
    };

    const formatMarketCap = (val) => {
        if (!val) return "N/A";
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L Cr`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K Cr`;
        return `₹${val.toFixed(0)} Cr`;
    };

    return (
        <>
            <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
                {/* Background Effects */}
                <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
                <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
                <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full pointer-events-none z-0"></div>

                <Navbar />

                <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 mb-4 tracking-tight">
                            Stock Screener
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Filter and discover stocks with real-time prices, P/E ratios, and market data.
                        </p>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {presets.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm"
                            >
                                {preset.name}
                            </button>
                        ))}
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-sm"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={fetchStocks}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-all text-sm disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "🔄 Refresh"}
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Sector Filter */}
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">Sector</label>
                                <select
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-[#0a0a12] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    {sectors.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Market Cap Filter */}
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">
                                    Min Market Cap: {formatMarketCap(minMarketCap)}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000000"
                                    step="50000"
                                    value={minMarketCap}
                                    onChange={(e) => setMinMarketCap(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* P/E Filter */}
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">
                                    Max P/E Ratio: {maxPe}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={maxPe}
                                    onChange={(e) => setMaxPe(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Change Filter */}
                            <div>
                                <label className="text-gray-400 text-sm block mb-2">
                                    Min Change: {minChange}%
                                </label>
                                <input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    step="0.5"
                                    value={minChange}
                                    onChange={(e) => setMinChange(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-300 text-center">
                            {error}
                            <button onClick={fetchStocks} className="ml-4 underline hover:no-underline">Try Again</button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="text-center">
                                <div className="animate-spin text-4xl mb-4">⏳</div>
                                <p className="text-gray-400">Fetching real-time stock data...</p>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && !error && (
                        <>
                            {/* Results Count */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-400">
                                    Showing <span className="text-white font-semibold">{filteredStocks.length}</span> of {stocks.length} stocks
                                </span>
                                <span className="text-xs text-gray-500">
                                    Prices updated in real-time from NSE
                                </span>
                            </div>

                            {/* Results Table */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Symbol</th>
                                                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Company</th>
                                                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Sector</th>
                                                <th
                                                    className="text-right py-4 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                                                    onClick={() => handleSort("price")}
                                                >
                                                    Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                                                </th>
                                                <th
                                                    className="text-right py-4 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                                                    onClick={() => handleSort("changePercent")}
                                                >
                                                    Change % {sortBy === "changePercent" && (sortOrder === "asc" ? "↑" : "↓")}
                                                </th>
                                                <th
                                                    className="text-right py-4 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                                                    onClick={() => handleSort("marketCap")}
                                                >
                                                    Market Cap {sortBy === "marketCap" && (sortOrder === "asc" ? "↑" : "↓")}
                                                </th>
                                                <th
                                                    className="text-right py-4 px-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                                                    onClick={() => handleSort("pe")}
                                                >
                                                    P/E {sortBy === "pe" && (sortOrder === "asc" ? "↑" : "↓")}
                                                </th>
                                                <th className="text-right py-4 px-4 text-gray-400 font-medium text-sm">52W Range</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStocks.map((stock, idx) => (
                                                <motion.tr
                                                    key={stock.symbol}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="py-4 px-4">
                                                        <Link href={`/dashboard/${stock.symbol}`} className="text-blue-400 hover:text-blue-300 font-mono font-semibold">
                                                            {stock.symbol}
                                                        </Link>
                                                    </td>
                                                    <td className="py-4 px-4 text-white">{stock.name}</td>
                                                    <td className="py-4 px-4">
                                                        <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-gray-300">
                                                            {stock.sector}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-white font-medium">
                                                        ₹{stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className={`py-4 px-4 text-right font-medium ${stock.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                                        {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent?.toFixed(2)}%
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-gray-300">
                                                        {formatMarketCap(stock.marketCap)}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-gray-300">
                                                        {stock.pe ? stock.pe.toFixed(1) : "N/A"}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-xs text-gray-500">
                                                        ₹{stock.weekLow52?.toLocaleString()} - ₹{stock.weekHigh52?.toLocaleString()}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredStocks.length === 0 && (
                                    <div className="text-center py-12">
                                        <span className="text-4xl mb-4 block">🔍</span>
                                        <p className="text-gray-400">No stocks match your filters. Try adjusting the criteria.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
            <Chatbot />
        </>
    );
}
