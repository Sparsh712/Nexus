"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";

export default function SharedPortfolioPage() {
    const params = useParams();
    const shareId = params.shareId;

    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSharedPortfolio = async () => {
            if (!shareId) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/share/${shareId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("This shared portfolio link is invalid or has expired.");
                    }
                    throw new Error("Failed to load shared portfolio");
                }

                const data = await response.json();
                setPortfolioData(data);
            } catch (err) {
                console.error("Error fetching shared portfolio:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedPortfolio();
    }, [shareId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030014] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading shared portfolio...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#030014] text-white relative overflow-hidden">
                <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
                <Navbar />
                <div className="relative z-10 max-w-2xl mx-auto px-6 pt-32 text-center">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <Link
                            href="/"
                            className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
                        >
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const portfolio = portfolioData?.portfolio;
    const items = portfolio?.items || [];
    const stocksCount = items.filter(i => i.item_type === 'stock').length;
    const mfCount = items.filter(i => i.item_type === 'mutual_fund').length;
    const cryptoCount = items.filter(i => i.item_type === 'crypto').length;

    return (
        <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none z-0 translate-x-1/3 -translate-y-1/3"></div>
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-900/15 blur-[100px] rounded-full pointer-events-none z-0 -translate-x-1/3 translate-y-1/3"></div>

            <Navbar />

            <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Shared Portfolio
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300 mb-4 tracking-tight">
                        NEXUS Portfolio
                    </h1>
                    <p className="text-gray-400">
                        Snapshot from {new Date(portfolio?.snapshot_time).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        👁️ {portfolioData?.views} views
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className="text-gray-400 text-sm">Total Holdings</p>
                        <p className="text-2xl font-bold text-white">{items.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className="text-gray-400 text-sm">Stocks</p>
                        <p className="text-2xl font-bold text-green-400">{stocksCount}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className="text-gray-400 text-sm">Mutual Funds</p>
                        <p className="text-2xl font-bold text-purple-400">{mfCount}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <p className="text-gray-400 text-sm">Crypto</p>
                        <p className="text-2xl font-bold text-orange-400">{cryptoCount}</p>
                    </div>
                </div>

                {/* Holdings Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
                        Holdings
                        <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-1"></div>
                    </h2>

                    {items.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                            <p className="text-gray-400">This portfolio is empty.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.item_type === 'stock'
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                : item.item_type === 'crypto'
                                                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                                                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                            }`}>
                                            {item.item_type === 'stock' ? (
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            ) : item.item_type === 'crypto' ? (
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12.001 2a10 10 0 100 20 10 10 0 000-20z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.item_type === 'stock'
                                                ? 'bg-green-500/20 text-green-400'
                                                : item.item_type === 'crypto'
                                                    ? 'bg-orange-500/20 text-orange-400'
                                                    : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                            {item.item_type === 'stock' ? 'Stock' : item.item_type === 'crypto' ? 'Crypto' : 'MF'}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1 line-clamp-2">{item.name}</h3>
                                    <p className="text-gray-500 text-sm font-mono">{item.symbol}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-white/10 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Want to track your own investments?</h3>
                    <p className="text-gray-400 mb-6">Create your free portfolio on NEXUS</p>
                    <Link
                        href="/Portfolio"
                        className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
                    >
                        Create Your Portfolio →
                    </Link>
                </div>
            </main>
        </div>
    );
}
