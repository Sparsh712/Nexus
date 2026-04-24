"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function MarketMovers() {
    const [gainers, setGainers] = useState([]);
    const [losers, setLosers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("gainers");

    const fetchMovers = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/movers`);
            if (response.ok) {
                const data = await response.json();
                setGainers(data.gainers || []);
                setLosers(data.losers || []);
            } else {
                // Fallback to sample data
                setGainers([
                    { symbol: "TATAMOTORS.NS", name: "Tata Motors", price: 987.45, change: 45.30, changePercent: 4.81 },
                    { symbol: "ADANIPORTS.NS", name: "Adani Ports", price: 1234.50, change: 52.15, changePercent: 4.41 },
                    { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", price: 7654.20, change: 287.35, changePercent: 3.90 },
                    { symbol: "INFY.NS", name: "Infosys", price: 1567.80, change: 45.60, changePercent: 3.00 },
                    { symbol: "TCS.NS", name: "TCS", price: 4123.45, change: 98.75, changePercent: 2.45 },
                ]);
                setLosers([
                    { symbol: "HDFCBANK.NS", name: "HDFC Bank", price: 1654.30, change: -67.45, changePercent: -3.92 },
                    { symbol: "RELIANCE.NS", name: "Reliance", price: 2456.70, change: -87.90, changePercent: -3.45 },
                    { symbol: "ICICIBANK.NS", name: "ICICI Bank", price: 1098.25, change: -32.50, changePercent: -2.87 },
                    { symbol: "SBIN.NS", name: "SBI", price: 756.40, change: -18.90, changePercent: -2.44 },
                    { symbol: "AXISBANK.NS", name: "Axis Bank", price: 1123.60, change: -23.45, changePercent: -2.04 },
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch market movers:", error);
            // Use fallback data
            setGainers([
                { symbol: "TATAMOTORS.NS", name: "Tata Motors", price: 987.45, change: 45.30, changePercent: 4.81 },
                { symbol: "ADANIPORTS.NS", name: "Adani Ports", price: 1234.50, change: 52.15, changePercent: 4.41 },
                { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", price: 7654.20, change: 287.35, changePercent: 3.90 },
                { symbol: "INFY.NS", name: "Infosys", price: 1567.80, change: 45.60, changePercent: 3.00 },
                { symbol: "TCS.NS", name: "TCS", price: 4123.45, change: 98.75, changePercent: 2.45 },
            ]);
            setLosers([
                { symbol: "HDFCBANK.NS", name: "HDFC Bank", price: 1654.30, change: -67.45, changePercent: -3.92 },
                { symbol: "RELIANCE.NS", name: "Reliance", price: 2456.70, change: -87.90, changePercent: -3.45 },
                { symbol: "ICICIBANK.NS", name: "ICICI Bank", price: 1098.25, change: -32.50, changePercent: -2.87 },
                { symbol: "SBIN.NS", name: "SBI", price: 756.40, change: -18.90, changePercent: -2.44 },
                { symbol: "AXISBANK.NS", name: "Axis Bank", price: 1123.60, change: -23.45, changePercent: -2.04 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovers();
        // Refresh every minute
        const interval = setInterval(fetchMovers, 60000);
        return () => clearInterval(interval);
    }, []);

    const stocks = activeTab === "gainers" ? gainers : losers;

    if (loading) {
        return (
            <section className="py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header with Tabs */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white">Market Movers</h2>
                        <div className="flex bg-white/5 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab("gainers")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "gainers"
                                        ? "bg-green-500 text-black"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                🚀 Gainers
                            </button>
                            <button
                                onClick={() => setActiveTab("losers")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "losers"
                                        ? "bg-red-500 text-white"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                📉 Losers
                            </button>
                        </div>
                    </div>
                    <Link
                        href="/dashboard"
                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                        View All →
                    </Link>
                </div>

                {/* Stocks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {stocks.map((stock, i) => (
                        <motion.div
                            key={stock.symbol}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/dashboard/${stock.symbol.replace('.NS', '')}`}>
                                <div className={`p-4 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${activeTab === "gainers"
                                        ? "bg-gradient-to-br from-green-900/30 to-emerald-900/10 border-green-500/20 hover:border-green-500/40"
                                        : "bg-gradient-to-br from-red-900/30 to-rose-900/10 border-red-500/20 hover:border-red-500/40"
                                    }`}>
                                    {/* Rank Badge */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${activeTab === "gainers" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            }`}>
                                            #{i + 1}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {stock.symbol.replace('.NS', '')}
                                        </span>
                                    </div>

                                    {/* Company Name */}
                                    <h3 className="text-white font-semibold text-sm mb-2 truncate">
                                        {stock.name}
                                    </h3>

                                    {/* Price */}
                                    <div className="text-lg font-bold text-white mb-1">
                                        ₹{stock.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>

                                    {/* Change */}
                                    <div className={`text-sm font-medium ${stock.changePercent >= 0 ? "text-green-400" : "text-red-400"
                                        }`}>
                                        {stock.changePercent >= 0 ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                                        <span className="text-xs ml-1 opacity-70">
                                            ({stock.change >= 0 ? "+" : ""}{stock.change?.toFixed(2)})
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
