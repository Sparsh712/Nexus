"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// Market indices data
const marketIndices = [
    { symbol: "^NSEI", name: "NIFTY 50", shortName: "NIFTY" },
    { symbol: "^BSESN", name: "SENSEX", shortName: "SENSEX" },
    { symbol: "^NSEBANK", name: "NIFTY BANK", shortName: "BANK NIFTY" },
    { symbol: "^CNXIT", name: "NIFTY IT", shortName: "NIFTY IT" },
];

export default function MarketIndices({ compact = false }) {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [marketOpen, setMarketOpen] = useState(false);

    // Check if market is open (IST: Mon-Fri, 9:15 AM - 3:30 PM)
    const checkMarketStatus = () => {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const day = istTime.getUTCDay();
        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        const timeInMinutes = hours * 60 + minutes;

        const isWeekday = day >= 1 && day <= 5;
        const isMarketHours = timeInMinutes >= 9 * 60 + 15 && timeInMinutes <= 15 * 60 + 30;

        return isWeekday && isMarketHours;
    };

    const fetchIndices = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/market/indices`);
            if (response.ok) {
                const data = await response.json();
                setIndices(data);
            } else {
                // Fallback to simulated data if API not available
                setIndices([
                    { symbol: "^NSEI", name: "NIFTY 50", price: 23456.75, change: 125.50, changePercent: 0.54 },
                    { symbol: "^BSESN", name: "SENSEX", price: 77234.80, change: 345.20, changePercent: 0.45 },
                    { symbol: "^NSEBANK", name: "NIFTY BANK", price: 49876.40, change: -234.10, changePercent: -0.47 },
                    { symbol: "^CNXIT", name: "NIFTY IT", price: 35678.25, change: 567.80, changePercent: 1.62 },
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch indices:", error);
            // Use fallback data
            setIndices([
                { symbol: "^NSEI", name: "NIFTY 50", price: 23456.75, change: 125.50, changePercent: 0.54 },
                { symbol: "^BSESN", name: "SENSEX", price: 77234.80, change: 345.20, changePercent: 0.45 },
                { symbol: "^NSEBANK", name: "NIFTY BANK", price: 49876.40, change: -234.10, changePercent: -0.47 },
                { symbol: "^CNXIT", name: "NIFTY IT", price: 35678.25, change: 567.80, changePercent: 1.62 },
            ]);
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
            setMarketOpen(checkMarketStatus());
        }
    };

    useEffect(() => {
        fetchIndices();
        // Refresh every 30 seconds if market is open
        const interval = setInterval(() => {
            if (checkMarketStatus()) {
                fetchIndices();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex gap-4 justify-center py-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-40 h-20 bg-white/5 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (compact) {
        // Compact version for navbar or ticker
        return (
            <div className="flex items-center gap-6 overflow-x-auto py-2 px-4">
                {indices.map((index, i) => (
                    <div key={index.symbol} className="flex items-center gap-3 whitespace-nowrap">
                        <span className="text-gray-400 text-sm font-medium">{index.name.split(" ")[0]}</span>
                        <span className="text-white font-semibold">{index.price?.toLocaleString()}</span>
                        <span className={`text-sm font-medium ${index.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {index.changePercent >= 0 ? "▲" : "▼"} {Math.abs(index.changePercent).toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <section className="py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white">Market Indices</h2>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${marketOpen
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${marketOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                            {marketOpen ? "Market Open" : "Market Closed"}
                        </div>
                    </div>
                    {lastUpdated && (
                        <span className="text-xs text-gray-500">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                {/* Indices Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {indices.map((index, i) => (
                        <Link key={index.symbol} href={`/dashboard/${encodeURIComponent(index.symbol)}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative p-5 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${index.changePercent >= 0
                                    ? "bg-gradient-to-br from-green-900/20 to-emerald-900/10 border-green-500/20 hover:border-green-500/40"
                                    : "bg-gradient-to-br from-red-900/20 to-rose-900/10 border-red-500/20 hover:border-red-500/40"
                                    }`}
                            >
                                {/* Index Name */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-300 font-medium text-sm">{index.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${index.changePercent >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                        }`}>
                                        {index.changePercent >= 0 ? "▲" : "▼"}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="text-2xl font-bold text-white mb-2">
                                    {index.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>

                                {/* Change */}
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${index.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {index.change >= 0 ? "+" : ""}{index.change?.toFixed(2)}
                                    </span>
                                    <span className={`text-sm ${index.changePercent >= 0 ? "text-green-400/80" : "text-red-400/80"}`}>
                                        ({index.changePercent >= 0 ? "+" : ""}{index.changePercent?.toFixed(2)}%)
                                    </span>
                                </div>

                                {/* Mini sparkline placeholder */}
                                <div className="absolute bottom-2 right-2 opacity-20">
                                    <svg width="60" height="24" viewBox="0 0 60 24">
                                        <path
                                            d={index.changePercent >= 0
                                                ? "M0,20 Q15,10 30,12 T60,5"
                                                : "M0,5 Q15,15 30,12 T60,20"
                                            }
                                            fill="none"
                                            stroke={index.changePercent >= 0 ? "#22c55e" : "#ef4444"}
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
