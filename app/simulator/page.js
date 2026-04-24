"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import useUser from "@/lib/authClient";

export default function SimulatorPage() {
    const { user, isSignedIn, isLoading } = useUser();
    // Only use real user ID - no fallback, requires authentication
    const USER_ID = user?.sub;

    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("portfolio");

    // Trade state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [tradeType, setTradeType] = useState("buy");
    const [tradeError, setTradeError] = useState("");
    const [tradeSuccess, setTradeSuccess] = useState("");

    // New feature states
    const [orderHistory, setOrderHistory] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [shortPositions, setShortPositions] = useState([]);
    const [performanceStats, setPerformanceStats] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [portfolioSnapshots, setPortfolioSnapshots] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [stopOrders, setStopOrders] = useState([]);
    const [showStopModal, setShowStopModal] = useState(false);
    const [stopPrice, setStopPrice] = useState("");
    const [achievements, setAchievements] = useState([]);
    const [priceAlerts, setPriceAlerts] = useState([]);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [alertPrice, setAlertPrice] = useState("");
    const [alertDirection, setAlertDirection] = useState("below");
    const [unlockedAchievement, setUnlockedAchievement] = useState(null);
    const [triggeredAlert, setTriggeredAlert] = useState(null);
    const [notifiedAlertIds, setNotifiedAlertIds] = useState(new Set());

    // Advanced feature states
    const [extendedQuote, setExtendedQuote] = useState(null); // 52-week high/low, P/E, etc.
    const [stockHistory, setStockHistory] = useState([]); // OHLC data for candlestick
    const [limitOrders, setLimitOrders] = useState([]); // Pending limit orders
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitPrice, setLimitPrice] = useState("");
    const [orderMode, setOrderMode] = useState("market"); // "market" or "limit"
    const [showStockDetailModal, setShowStockDetailModal] = useState(false);

    // Chart state
    const [chartRange, setChartRange] = useState("ALL");
    const [hoveredChartPoint, setHoveredChartPoint] = useState(null);


    // Enforce dark mode for new UI
    const darkMode = true;


    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // Helpers
    const formatCurrency = (val) => "₹" + (val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatPercent = (val) => (val >= 0 ? "+" : "") + (val || 0).toFixed(2) + "%";

    // Check if Indian stock market is open (Mon-Fri, 9:30 AM - 3:30 PM IST)
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

    // Fetch all data
    const fetchPortfolio = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/portfolio/${USER_ID}`);
            const data = await res.json();
            setPortfolio(data);
        } catch (e) { console.error(e); }
    };

    const fetchOrderHistory = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/orders/${USER_ID}`);
            const data = await res.json();
            setOrderHistory(data.orders || []);
        } catch (e) { console.error(e); }
    };

    const fetchWatchlist = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/watchlist/${USER_ID}`);
            const data = await res.json();
            setWatchlist(data.watchlist || []);
        } catch (e) { console.error(e); }
    };

    const fetchShortPositions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/shorts/${USER_ID}`);
            const data = await res.json();
            setShortPositions(data.short_positions || []);
        } catch (e) { console.error(e); }
    };

    const fetchPerformance = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/performance/${USER_ID}`);
            const data = await res.json();
            setPerformanceStats(data);
        } catch (e) { console.error(e); }
    };

    const fetchSnapshots = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/snapshots/${USER_ID}`);
            const data = await res.json();
            setPortfolioSnapshots(data.snapshots || []);
        } catch (e) { console.error(e); }
    };

    const fetchStopOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/stop-orders/${USER_ID}`);
            const data = await res.json();
            setStopOrders(data.stop_orders || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        // Only fetch data when user is signed in
        if (!isSignedIn || !USER_ID) return;

        fetchPortfolio();
        fetchOrderHistory();
        fetchWatchlist();
        fetchShortPositions();
        fetchPerformance();
        fetchSnapshots();
        fetchStopOrders();
        fetchAchievements();
        fetchAlerts();
        fetchLimitOrders();
    }, [isSignedIn, USER_ID]);

    const fetchLimitOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/pending-orders/${USER_ID}`);
            const data = await res.json();
            setLimitOrders(data.pending_orders || []);
        } catch (e) { console.error(e); }
    };

    const fetchAchievements = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/achievements/${USER_ID}`);
            const data = await res.json();
            setAchievements(data.achievements || []);

            if (data.new_achievements && data.new_achievements.length > 0) {
                const newAid = data.new_achievements[0];
                const ach = (data.achievements || []).find(a => a.id === newAid);
                if (ach) {
                    setUnlockedAchievement(ach);
                    setTimeout(() => setUnlockedAchievement(null), 6000);
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchAlerts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/alerts/${USER_ID}`);
            const data = await res.json();
            const alerts = data.alerts || [];
            setPriceAlerts(alerts);

            // Check for newly triggered alerts
            const newTriggered = alerts.find(a => a.triggered && !notifiedAlertIds.has(a.id));
            if (newTriggered) {
                setTriggeredAlert(newTriggered);
                setNotifiedAlertIds(prev => new Set([...prev, newTriggered.id]));
                setTimeout(() => setTriggeredAlert(null), 6000);
            }
        } catch (e) { console.error(e); }
    };

    // Check and execute pending limit orders periodically
    const checkLimitOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/check-limit-orders/${USER_ID}`);
            const data = await res.json();

            if (data.executed && data.executed.length > 0) {
                // Refresh data when orders are executed
                fetchPortfolio();
                fetchOrderHistory();
                fetchLimitOrders();
                fetchAchievements();

                // Show notification for each executed order
                data.executed.forEach(order => {
                    setTradeSuccess(`✅ Limit ${order.order_type.toUpperCase()} executed: ${order.quantity} ${order.symbol} @ ₹${order.limit_price}`);
                });
            }
        } catch (e) { console.error("Error checking limit orders:", e); }
    };

    // Check and execute stop-loss orders
    const checkStopOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/api/simulator/trigger-stops/${USER_ID}`, { method: "POST" });
            const data = await res.json();

            if (data.triggered && data.triggered.length > 0) {
                // Refresh data when stop orders are executed
                fetchPortfolio();
                fetchOrderHistory();
                fetchStopOrders();
                fetchAchievements();

                // Show notification for each triggered stop
                data.triggered.forEach(order => {
                    setTradeSuccess(`🛑 STOP-LOSS triggered: Sold ${order.quantity} ${order.symbol} @ ₹${order.execution_price?.toFixed(2) || order.stop_price}`);
                });
            }
        } catch (e) { console.error("Error checking stop orders:", e); }
    };

    // Check limit orders, stop orders, and alerts periodically
    const checkMarketConditions = async () => {
        checkLimitOrders();
        checkStopOrders();
        fetchAlerts();
    };

    useEffect(() => {
        // Only run periodic checks when signed in
        if (!isSignedIn || !USER_ID) return;

        // Check immediately on mount (always, even outside market hours)
        checkMarketConditions();

        // Only set up polling interval during market hours (Mon-Fri 9:30AM-3:30PM IST)
        // Outside market hours, prices don't change so no need to auto-refresh
        if (isMarketOpen()) {
            const interval = setInterval(() => {
                checkMarketConditions();
            }, 15000); // 15 seconds for stop-loss checking

            return () => clearInterval(interval);
        }
        // No auto-refresh outside market hours - checks only on mount
    }, [isSignedIn, USER_ID]);

    // Search Stocks
    useEffect(() => {
        if (!searchQuery) { setSearchResults([]); return; }
        const timer = setTimeout(() => {
            fetch(`${API_URL}/api/stock/search-stocks?q=${encodeURIComponent(searchQuery)}`)
                .then(res => res.json())
                .then(data => setSearchResults(data || []));
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectStock = async (stock) => {
        // Set basic info immediately for UI responsiveness
        setSelectedStock({ symbol: stock.symbol, price: stock.price || 0, name: stock.name || stock.symbol });
        setExtendedQuote(null); // Clear old data
        setStockHistory([]); // Clear old history
        setSearchResults([]);
        setSearchQuery("");

        try {
            setLoading(true);
            console.log("Fetching data for:", stock.symbol);

            // STEP 1: Fetch fast quote first (this is instant ~0.2s)
            const fastQuoteRes = await fetch(`${API_URL}/api/stock/fast-quote/${stock.symbol}`);
            const fastQuote = await fastQuoteRes.json();

            if (fastQuote.price) {
                setSelectedStock(prev => ({ ...prev, price: fastQuote.price }));
                // Set extended quote from fast endpoint with all available data
                setExtendedQuote({
                    symbol: stock.symbol,
                    price: fastQuote.price,
                    previousClose: fastQuote.previousClose,
                    dayChange: fastQuote.dayChange,
                    dayChangePercent: fastQuote.dayChangePercent,
                    marketCap: fastQuote.marketCap,
                    dayHigh: fastQuote.dayHigh,
                    dayLow: fastQuote.dayLow,
                    open: fastQuote.open,
                    fiftyTwoWeekHigh: fastQuote.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: fastQuote.fiftyTwoWeekLow,
                    fiftyDayAverage: fastQuote.fiftyDayAverage,
                    volume: fastQuote.volume,
                    avgVolume: fastQuote.avgVolume,
                    peRatio: fastQuote.peRatio,
                    eps: fastQuote.eps,
                    dividendYield: fastQuote.dividendYield,
                    beta: fastQuote.beta,
                });
            }
            setLoading(false); // UI is now responsive

            // STEP 2: Load history in background (don't block UI)
            fetch(`${API_URL}/api/stock/history/${stock.symbol}?period=1mo&interval=1d`)
                .then(res => res.json())
                .then(history => {
                    if (history && history.length > 0) {
                        setStockHistory(history.slice(-30));
                    }
                })
                .catch(e => console.error("Error fetching history:", e));

        } catch (e) {
            console.error("Error in handleSelectStock:", e);
            setLoading(false);
        }
    };

    // Real-time polling for selected stock price
    useEffect(() => {
        if (!selectedStock?.symbol) return;

        const refreshSelectedStock = async () => {
            try {
                // Use fast-quote endpoint for quick updates
                const res = await fetch(`${API_URL}/api/stock/fast-quote/${selectedStock.symbol}`);
                const data = await res.json();

                if (data.price) {
                    setSelectedStock(prev => ({ ...prev, price: data.price }));
                    setExtendedQuote(prev => ({
                        ...prev,
                        price: data.price,
                        dayChange: data.dayChange,
                        dayChangePercent: data.dayChangePercent,
                        dayHigh: data.dayHigh,
                        dayLow: data.dayLow,
                        volume: data.volume,
                    }));
                }
            } catch (e) {
                console.error("Error refreshing stock:", e);
            }
        };

        const interval = setInterval(refreshSelectedStock, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [selectedStock?.symbol]);

    // Auto-dismiss alerts
    useEffect(() => {
        if (tradeSuccess || tradeError) {
            const timer = setTimeout(() => {
                setTradeSuccess("");
                setTradeError("");
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [tradeSuccess, tradeError]);

    const executeTrade = async () => {
        if (!selectedStock || quantity <= 0) return;

        if (!USER_ID) {
            setTradeError("You must be logged in to trade. Please sign in.");
            return;
        }

        setTradeError(""); setTradeSuccess(""); setLoading(true);

        try {
            // Handle LIMIT and STOP orders differently - place as pending order
            if (orderMode === 'limit' && limitPrice) {
                const res = await fetch(`${API_URL}/api/simulator/limit-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: USER_ID,
                        symbol: selectedStock.symbol,
                        quantity: parseInt(quantity),
                        order_type: tradeType,
                        limit_price: parseFloat(limitPrice)
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Failed to place limit order");

                setTradeSuccess(`Limit ${tradeType.toUpperCase()} order placed: ${quantity} ${selectedStock.symbol} @ ₹${limitPrice}. Check Pending tab.`);
                setLimitPrice("");
                setOrderMode("market");
                setActiveTab("pending");
                fetchLimitOrders();
                return;
            }

            if (orderMode === 'stop' && limitPrice) {
                // For stop orders, create a stop-loss order
                const res = await fetch(`${API_URL}/api/simulator/stop-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: USER_ID,
                        symbol: selectedStock.symbol,
                        quantity: parseInt(quantity),
                        stop_price: parseFloat(limitPrice)
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || "Failed to place stop order");

                setTradeSuccess(`Stop order placed: Sell ${quantity} ${selectedStock.symbol} if price drops to ₹${limitPrice}. Check Stops tab.`);
                setLimitPrice("");
                setOrderMode("market");
                setActiveTab("stops");
                fetchStopOrders();
                return;
            }

            // MARKET orders - execute immediately
            let endpoint = "";
            if (tradeType === "buy") endpoint = "/api/simulator/buy";
            else if (tradeType === "sell") endpoint = "/api/simulator/sell";
            else if (tradeType === "short") endpoint = "/api/simulator/short";
            else if (tradeType === "cover") endpoint = "/api/simulator/cover";

            console.log("Executing trade:", { endpoint, user_id: USER_ID, symbol: selectedStock.symbol, qty: quantity });

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: USER_ID,
                    symbol: selectedStock.symbol,
                    quantity: parseInt(quantity),
                    price: selectedStock.price
                })
            });

            const data = await res.json();
            if (!res.ok) {
                // Handle Pydantic validation errors (array of errors)
                let errorMsg = "Trade failed";
                if (Array.isArray(data.detail)) {
                    errorMsg = data.detail.map(e => e.msg).join(", ");
                } else if (typeof data.detail === 'string') {
                    errorMsg = data.detail;
                }
                throw new Error(errorMsg);
            }

            const price = data.execution_price ? `₹${data.execution_price.toFixed(2)}` : 'Market Price';
            const fees = data.fees ? `₹${data.fees.toFixed(2)}` : '₹0.00';
            const slip = data.slippage ? ` Slippage: ₹${data.slippage.toFixed(2)}` : '';
            setTradeSuccess(`${tradeType.toUpperCase()} ${quantity} @ ${price}. Fees: ${fees}.${slip}`);
            setQuantity(1);
            if (tradeType !== 'buy') setSelectedStock(null);

            // Refresh all data
            fetchPortfolio();
            fetchOrderHistory();
            fetchShortPositions();
            fetchPerformance();
            fetchAchievements();
            fetchSnapshots();
        } catch (e) {
            setTradeError(e.message);
        } finally { setLoading(false); }
    };

    const addToWatchlist = async (symbol) => {
        await fetch(`${API_URL}/api/simulator/watchlist/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: USER_ID, symbol })
        });
        fetchWatchlist();
        fetchAchievements();
    };

    const removeFromWatchlist = async (symbol) => {
        await fetch(`${API_URL}/api/simulator/watchlist/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: USER_ID, symbol })
        });
        fetchWatchlist();
    };

    const openResetModal = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowResetModal(true);
    };

    const performReset = async () => {
        setLoading(true);
        setTradeError("");
        try {
            const res = await fetch(`${API_URL}/api/simulator/reset/${USER_ID}`, { method: "POST" });
            if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
            const data = await res.json();
            console.log("Reset response:", data);

            // Clear ALL local state immediately
            setOrderHistory([]);
            setWatchlist([]);
            setShortPositions([]);
            setPendingOrders([]);
            setPerformanceStats(null);
            setSelectedStock(null);
            setPortfolioSnapshots([]);
            setStopOrders([]);
            setAchievements([]);
            setPriceAlerts([]);

            // Refetch everything
            await Promise.all([
                fetchPortfolio(),
                fetchOrderHistory(),
                fetchWatchlist(),
                fetchShortPositions(),
                fetchPerformance(),
                fetchSnapshots(),
                fetchStopOrders(),
                fetchAchievements(),
                fetchAlerts()
            ]);

            setTradeSuccess("✅ Portfolio reset to ₹10,00,000!");
            setShowResetModal(false);
        } catch (e) {
            console.error("Reset error:", e);
            setTradeError(`Reset failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const cash = portfolio?.cash_balance || 0;
    const invested = portfolio?.total_invested_value || 0;
    const currentVal = portfolio?.total_current_value || 0;

    // Short liability = what you owe (current price * qty to buy back)
    // Cash already includes proceeds from shorting, so we subtract current liability
    const shortLiability = shortPositions.reduce((acc, s) => acc + ((s.current_price || s.entry_price) * s.quantity), 0);
    const shortPnL = shortPositions.reduce((acc, s) => acc + (s.pnl || 0), 0);

    // Net Worth = Cash (includes short proceeds) + Long Positions - Short Liability
    const netWorth = cash + currentVal - shortLiability;
    const cashPercent = netWorth > 0 ? (cash / netWorth) * 100 : 100;

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen py-12 font-sans bg-linear-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 mt-32 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </div>
        );
    }

    // Show login prompt if not signed in
    if (!isSignedIn) {
        return (
            <div className="min-h-screen py-12 font-sans bg-linear-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 mt-32 text-center">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-md max-w-md mx-auto">
                        <div className="text-6xl mb-6">🎮</div>
                        <h1 className="text-3xl font-bold text-white mb-4">Trading Simulator</h1>
                        <p className="text-gray-400 mb-8">
                            Sign in to access the trading simulator. Your portfolio and trades will be saved to your account.
                        </p>
                        <Link
                            href="/api/auth/login"
                            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-lg transition-all transform hover:scale-105"
                        >
                            Sign In to Start Trading
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 font-sans bg-linear-to-b from-[#050511] via-[#0d1020] to-[#0b0b12] text-white selection:bg-indigo-500/30">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 mt-20">
                {/* ACCOUNT SUMMARY CARD */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl mb-8 flex flex-wrap justify-between items-center gap-6">
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Net Worth</div>
                        <div className="text-3xl font-bold font-mono tracking-tight">{formatCurrency(netWorth)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Buying Power</div>
                        <div className="text-2xl font-semibold font-mono tracking-tight">{formatCurrency(cash)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Unrealized P&L</div>
                        <div className={`text-2xl font-semibold tracking-tight font-mono ${portfolio?.unrealized_pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {formatCurrency(portfolio?.unrealized_pnl)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Win Rate</div>
                        <div className="text-2xl font-semibold text-blue-400 tracking-tight font-mono">{formatPercent(performanceStats?.win_rate || 0)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={openResetModal} className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                            <span>⚠️</span> Reset
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { id: "portfolio", label: "Portfolio" },
                            { id: "orders", label: `Orders (${orderHistory.length})` },
                            { id: "pending", label: `📋 Pending (${limitOrders.length})` },
                            { id: "watchlist", label: `Watchlist (${watchlist.length})` },
                            { id: "shorts", label: `Shorts (${shortPositions.length})` },
                            { id: "stops", label: `🛑 Stops (${stopOrders.length})` },
                            { id: "achievements", label: `🏆 Badges (${achievements.filter(a => a.earned).length}/${achievements.length})` },
                            { id: "alerts", label: `🔔 Alerts (${priceAlerts.length})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap border backdrop-blur-sm ${activeTab === tab.id
                                    ? "bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white border-blue-400"
                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <main className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Portfolio Tab */}
                        {activeTab === "portfolio" && (
                            <>
                                {/* Portfolio Value Chart */}
                                {/* Portfolio Value Chart */}
                                <div className="bg-[#0D1117] border border-white/10 p-6 rounded-2xl shadow-xl transition-all hover:border-white/20 group relative overflow-hidden" onMouseLeave={() => setHoveredChartPoint(null)}>
                                    {/* Background decorative glow */}
                                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/15 transition-all"></div>

                                    {(() => {
                                        // Filter Logic
                                        let displayedData = [...portfolioSnapshots];

                                        // Ensure graph matches header by appending live Net Worth as the final point.
                                        // We append rather than overwrite to preserve historical snapshots (e.g. previous trades).
                                        if (netWorth) {
                                            displayedData.push({
                                                timestamp: new Date().toISOString(),
                                                value: netWorth
                                            });
                                        }

                                        if (chartRange !== 'ALL') {
                                            const now = new Date();
                                            const cutoff = new Date(now); // Clone
                                            if (chartRange === '1D') cutoff.setHours(cutoff.getHours() - 24);
                                            if (chartRange === '1W') cutoff.setDate(cutoff.getDate() - 7);
                                            if (chartRange === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
                                            displayedData = displayedData.filter(s => new Date(s.timestamp) >= cutoff);
                                        }

                                        const hasData = displayedData.length > 0;
                                        const lastValue = hasData ? displayedData[displayedData.length - 1].value : netWorth;
                                        const startValue = hasData ? displayedData[0].value : 1000000;

                                        const showValue = hoveredChartPoint ? hoveredChartPoint.value : netWorth;
                                        const showTime = hoveredChartPoint ? new Date(hoveredChartPoint.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Current Net Worth";

                                        const change = showValue - startValue;
                                        const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
                                        const isPositive = change >= 0;

                                        return (
                                            <>
                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                                            {hoveredChartPoint ? "Value at " + showTime : "Portfolio Value"}
                                                        </h3>
                                                        <div className="flex items-baseline gap-3">
                                                            <span className="text-3xl font-bold text-white tracking-tight tabular-nums">
                                                                {formatCurrency(showValue)}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                                }`}>
                                                                {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {['1D', '1W', '1M', 'ALL'].map(t => (
                                                            <button
                                                                key={t}
                                                                onClick={() => setChartRange(t)}
                                                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${chartRange === t ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {hasData ? (
                                                    <div className="relative w-full">
                                                        <div className="h-64 w-full">
                                                            <svg viewBox="0 0 400 200" className="w-full h-full overflow-visible">
                                                                <defs>
                                                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                                    </linearGradient>
                                                                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                        <stop offset="0%" stopColor="#3b82f6" />
                                                                        <stop offset="50%" stopColor="#60a5fa" />
                                                                        <stop offset="100%" stopColor="#3b82f6" />
                                                                    </linearGradient>
                                                                </defs>
                                                                {(() => {
                                                                    const values = displayedData.map(s => s.value);
                                                                    const min = Math.min(...values) * 0.999;
                                                                    const max = Math.max(...values) * 1.001;
                                                                    const range = (max - min) || (min * 0.01) || 1;
                                                                    const step = 400 / (values.length - 1 || 1);

                                                                    const points = values.map((v, i) =>
                                                                        `${i * step},${200 - ((v - min) / range) * 180}`
                                                                    ).join(' ');

                                                                    const areaPoints = `0,200 ${points} ${(values.length - 1) * step},200`;

                                                                    return (
                                                                        <>
                                                                            {[0, 0.25, 0.5, 0.75, 1].map(p => (
                                                                                <line key={p} x1="0" y1={200 * p} x2="400" y2={200 * p} stroke="white" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 4" />
                                                                            ))}

                                                                            <polygon points={areaPoints} fill="url(#areaGradient)" opacity="0.8" />
                                                                            <polyline
                                                                                points={points}
                                                                                fill="none"
                                                                                stroke="url(#lineGradient)"
                                                                                strokeWidth="3"
                                                                                strokeLinejoin="round"
                                                                                strokeLinecap="round"
                                                                            />

                                                                            {/* Interaction Layer */}
                                                                            {displayedData.map((s, i) => (
                                                                                <rect
                                                                                    key={i}
                                                                                    x={(i * step) - (Math.max(step, 4) / 2)}
                                                                                    y="0"
                                                                                    width={Math.max(step, 4)}
                                                                                    height="200"
                                                                                    fill="transparent"
                                                                                    onMouseEnter={() => setHoveredChartPoint(s)}
                                                                                    className="cursor-crosshair"
                                                                                />
                                                                            ))}

                                                                            {/* Active Point Indicator */}
                                                                            {hoveredChartPoint && (() => {
                                                                                const idx = displayedData.indexOf(hoveredChartPoint);
                                                                                if (idx === -1) return null;
                                                                                const x = idx * step;
                                                                                const y = 200 - ((hoveredChartPoint.value - min) / range) * 180;
                                                                                return (
                                                                                    <>
                                                                                        <line x1={x} y1="0" x2={x} y2="200" stroke="white" strokeOpacity="0.2" strokeDasharray="2 2" />
                                                                                        <circle cx={x} cy={y} r="6" fill="#0f172a" stroke="#60a5fa" strokeWidth="3" />
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </svg>
                                                        </div>

                                                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 font-mono mt-2 pt-2 border-t border-white/5">
                                                            <span>{new Date(displayedData[0].timestamp).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                                                            <span>{chartRange === '1D' ? 'NOW' : new Date(displayedData[displayedData.length - 1].timestamp).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-sm bg-white/5 rounded-2xl border border-dashed border-white/10">
                                                        <p>No data available for this time range</p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Allocation & Key Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Allocation Chart */}
                                    <div className="bg-[#0D1117] border border-white/10 p-5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
                                        {/* Decorative Blur */}
                                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/15 transition-all"></div>

                                        <div className="z-10">
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Allocation</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 group/item">
                                                    <div className="w-1 h-8 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                    <div>
                                                        <div className="text-xs text-gray-400">Cash Balance</div>
                                                        <div className="text-sm font-bold text-white tabular-nums">{cashPercent.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 group/item">
                                                    <div className="w-1 h-8 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                                                    <div>
                                                        <div className="text-xs text-gray-400">Stocks</div>
                                                        <div className="text-sm font-bold text-white tabular-nums">{(100 - cashPercent).toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SVG Donut Chart */}
                                        <div className="relative w-32 h-32 mr-2">
                                            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-xl">
                                                {/* Background Circle */}
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />

                                                {/* Cash Segment (Blue) */}
                                                <circle
                                                    cx="50" cy="50" r="40"
                                                    fill="none"
                                                    stroke="#3b82f6"
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(cashPercent * 2.512)} 251.2`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                    opacity={cashPercent > 0.1 ? 1 : 0}
                                                />

                                                {/* Stock Segment (Purple) - Offset by Cash */}
                                                <circle
                                                    cx="50" cy="50" r="40"
                                                    fill="none"
                                                    stroke="#a855f7"
                                                    strokeWidth="12"
                                                    strokeDasharray={`${((100 - cashPercent) * 2.512)} 251.2`}
                                                    strokeDashoffset={`-${(cashPercent * 2.512)}`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                    opacity={(100 - cashPercent) > 0.1 ? 1 : 0}
                                                />
                                            </svg>
                                            {/* Center Text */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Assets</span>
                                                <span className="text-xs font-black text-white">{portfolio?.holdings?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stat Card (New Addition) */}
                                    <div className="bg-[#0D1117] border border-white/10 p-5 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden hover:border-white/20 transition-all">
                                        <div className="absolute top-0 right-0 p-3 opacity-10">
                                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Profit/Loss</h3>
                                        <div className={`text-2xl font-bold tracking-tight mb-1 ${netWorth >= 1000000 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(netWorth - 1000000) > 0 ? '+' : ''}{formatCurrency(netWorth - 1000000)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            All time realized & unrealized
                                        </div>
                                    </div>
                                </div>


                                {/* Holdings Table */}
                                {/* Holdings Table */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                    <div className="p-4 border-b border-gray-700">
                                        <h3 className="text-lg font-bold text-white">Current Holdings</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5 backdrop-blur-sm text-gray-400 font-semibold border-b border-white/5">
                                                <tr>
                                                    <td className="p-3 pl-4">SYMBOL</td>
                                                    <td className="p-3 text-right">QTY</td>
                                                    <td className="p-3 text-right">PRICE</td>
                                                    <td className="p-3 text-right">VALUE</td>
                                                    <td className="p-3 text-right">ALLOC %</td>
                                                    <td className="p-3 text-right">G/L</td>
                                                    <td className="p-3 text-center">ACTIONS</td>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {portfolio?.holdings?.length > 0 ? (
                                                    portfolio.holdings.map((h, i) => {
                                                        const allocation = (h.current_value / netWorth) * 100;
                                                        return (
                                                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                                <td
                                                                    className="p-3 pl-4 font-bold text-blue-400 cursor-pointer hover:underline"
                                                                    onClick={() => {
                                                                        handleSelectStock({ symbol: h.symbol, price: h.current_price, name: h.symbol });
                                                                        setShowStockDetailModal(true);
                                                                    }}
                                                                >
                                                                    {h.symbol}
                                                                </td>
                                                                <td className="p-3 text-right text-gray-200">{h.quantity}</td>
                                                                <td className="p-3 text-right text-gray-400 font-mono">{formatCurrency(h.current_price)}</td>
                                                                <td className="p-3 text-right font-medium text-white font-mono">{formatCurrency(h.current_value)}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <div className="w-12 bg-gray-700 rounded-full h-1.5">
                                                                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(allocation, 100)}%` }}></div>
                                                                        </div>
                                                                        <span className="font-mono text-xs text-gray-300">{allocation.toFixed(1)}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className={`p-3 text-right font-mono font-bold ${h.pnl >= 0 ? 'text-green-600 text-green-400' : 'text-red-600 text-red-400'}`}>
                                                                    {formatPercent(h.pnl_percent)}
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button onClick={() => {
                                                                            handleSelectStock({ symbol: h.symbol, price: h.current_price, name: h.symbol });
                                                                            setTradeType("sell");
                                                                            setQuantity(h.quantity);
                                                                        }}
                                                                            className="h-8 px-3 text-xs bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg border border-white/10 transition-colors font-semibold flex items-center">
                                                                            Sell
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedStock({ symbol: h.symbol, price: h.current_price, qty: h.quantity, name: h.symbol });
                                                                                setStopPrice(Math.floor(h.current_price * 0.95).toString());
                                                                                setShowStopModal(true);
                                                                            }}
                                                                            className="h-8 w-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                                                                            title="Set Stop Loss"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedStock({ symbol: h.symbol, price: h.current_price, qty: h.quantity, name: h.symbol });
                                                                                setAlertPrice("");
                                                                                setShowAlertModal(true);
                                                                            }}
                                                                            className="h-8 w-8 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/20 transition-colors"
                                                                            title="Set Price Alert"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="p-8 text-center text-gray-400 text-gray-400 italic">No stocks owned yet. Start buying!</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "orders" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Order History</h3>
                                        <p className="text-xs text-gray-500">{orderHistory.length} trades executed</p>
                                    </div>
                                    {orderHistory.length > 0 && (
                                        <button
                                            onClick={() => {
                                                // Export to CSV
                                                const headers = ['Date', 'Type', 'Symbol', 'Quantity', 'Price', 'Fees', 'P&L'];
                                                const rows = orderHistory.map(o => [
                                                    new Date(o.timestamp).toLocaleString(),
                                                    o.type,
                                                    o.symbol,
                                                    o.quantity,
                                                    o.execution_price?.toFixed(2) || '',
                                                    o.fees?.toFixed(2) || '0.00',
                                                    o.realized_pnl ? o.realized_pnl.toFixed(2) : '-'
                                                ]);
                                                const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                                                const blob = new Blob([csv], { type: 'text/csv' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `nexus_trades_${new Date().toISOString().split('T')[0]}.csv`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                                        >
                                            📥 Export CSV
                                        </button>
                                    )}
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-700/50 text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Time</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Symbol</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Fees</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {orderHistory.length === 0 ? (
                                            <tr><td colSpan="6" className="p-6 text-center text-gray-400 text-gray-400 italic">No orders yet.</td></tr>
                                        ) : (
                                            orderHistory.map((o, i) => (
                                                <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-3 text-xs text-gray-400">{new Date(o.timestamp).toLocaleString()}</td>
                                                    <td className={`p-3 font-bold ${o.type === 'BUY' ? 'text-green-600 text-green-400' : o.type === 'SELL' ? 'text-red-600 text-red-400' : 'text-orange-600 text-orange-400'}`}>{o.type}</td>
                                                    <td className="p-3 font-semibold text-blue-600 text-blue-400">{o.symbol}</td>
                                                    <td className="p-3 text-right font-mono text-gray-200">{o.quantity}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(o.execution_price)}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(o.fees)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pending Limit Orders Tab */}
                        {activeTab === "pending" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Pending Limit Orders</h3>
                                        <p className="text-xs text-gray-500">Orders execute when price target is reached (auto-checks every 30s)</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setLoading(true);
                                            await checkLimitOrders();
                                            setLoading(false);
                                        }}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                                    >
                                        {loading ? "⏳ Checking..." : "🔄 Check Now"}
                                    </button>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 backdrop-blur-sm text-gray-400 text-xs uppercase border-b border-white/5">
                                        <tr>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Symbol</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Limit Price</th>
                                            <th className="p-3 text-right">Created</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {limitOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-gray-400 italic">
                                                    <div className="space-y-2">
                                                        <div className="text-2xl">📋</div>
                                                        <div>No pending orders</div>
                                                        <div className="text-xs">Select &quot;LIMIT&quot; order type in Trade Ticket to place limit orders</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            limitOrders.map((o) => (
                                                <tr key={o.id} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className={`p-3 font-bold ${o.order_type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {o.order_type?.toUpperCase()}
                                                    </td>
                                                    <td className="p-3 font-bold text-blue-400">{o.symbol}</td>
                                                    <td className="p-3 text-right font-mono text-gray-200">{o.quantity}</td>
                                                    <td className="p-3 text-right font-mono font-bold text-purple-400">{formatCurrency(o.limit_price)}</td>
                                                    <td className="p-3 text-right text-xs text-gray-500">
                                                        {new Date(o.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`text-xs px-2 py-1 rounded ${o.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={async () => {
                                                                await fetch(`${API_URL}/api/simulator/limit-order/${USER_ID}/${o.id}`, { method: "DELETE" });
                                                                // Refresh pending orders
                                                                const res = await fetch(`${API_URL}/api/simulator/pending-orders/${USER_ID}`);
                                                                const data = await res.json();
                                                                setLimitOrders(data.pending_orders || []);
                                                            }}
                                                            className="text-xs bg-gray-700 hover:bg-red-900/30 text-gray-200 hover:text-red-400 px-2 py-1 rounded border border-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Watchlist Tab */}
                        {activeTab === "watchlist" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Watchlist</h3>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 backdrop-blur-sm text-gray-400 text-xs uppercase border-b border-white/5">
                                        <tr>
                                            <th className="p-3">Symbol</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {watchlist.length === 0 ? (
                                            <tr><td colSpan="3" className="p-6 text-center text-gray-400 text-gray-400 italic">No stocks in watchlist. Search and add from Trade Ticket.</td></tr>
                                        ) : (
                                            watchlist.map((w) => (
                                                <tr key={w.symbol} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-3 font-bold text-blue-600 text-blue-400">{w.symbol}</td>
                                                    <td className="p-3 text-right font-mono text-gray-200">{formatCurrency(w.price)}</td>
                                                    <td className="p-3 text-center space-x-2">
                                                        <button onClick={() => {
                                                            handleSelectStock({ symbol: w.symbol, price: w.price, name: w.symbol });
                                                            setTradeType("buy");
                                                        }}
                                                            className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">Buy</button>
                                                        <button onClick={() => removeFromWatchlist(w.symbol)}
                                                            className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50">Remove</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "shorts" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700">
                                    <h3 className="text-lg font-bold text-white">Short Positions</h3>
                                    <p className="text-xs text-gray-400 mt-1">Profit when prices go down. Use &quot;Cover&quot; to close.</p>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 backdrop-blur-sm text-gray-400 text-xs uppercase border-b border-white/5">
                                        <tr>
                                            <th className="p-3">Symbol</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Entry</th>
                                            <th className="p-3 text-right">Current</th>
                                            <th className="p-3 text-right">P/L</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {shortPositions.length === 0 ? (
                                            <tr><td colSpan="6" className="p-6 text-center text-gray-400 text-gray-400 italic">No short positions. Use &quot;Short&quot; in Trade Ticket to open one.</td></tr>
                                        ) : (
                                            shortPositions.map((s, i) => (
                                                <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-3 font-bold text-orange-600 text-orange-400">{s.symbol}</td>
                                                    <td className="p-3 text-right font-mono text-gray-200">{s.quantity}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(s.entry_price)}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(s.current_price)}</td>
                                                    <td className={`p-3 text-right font-mono font-bold ${s.pnl >= 0 ? 'text-green-600 text-green-400' : 'text-red-600 text-red-400'}`}>
                                                        {formatCurrency(s.pnl)} ({formatPercent(s.pnl_pct)})
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => {
                                                            handleSelectStock({ symbol: s.symbol, price: s.current_price, name: s.symbol });
                                                            setTradeType("cover");
                                                        }}
                                                            className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50">Cover</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "stops" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">🛑 Stop-Loss Orders</h3>
                                        <p className="text-xs text-gray-400 mt-1">Auto-sell when price drops below target</p>
                                    </div>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 backdrop-blur-sm text-gray-400 text-xs uppercase border-b border-white/5">
                                        <tr>
                                            <th className="p-3">Symbol</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Stop Price</th>
                                            <th className="p-3 text-right">Current</th>
                                            <th className="p-3 text-right">Distance</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {stopOrders.length === 0 ? (
                                            <tr><td colSpan="7" className="p-6 text-center text-gray-400 text-gray-400 italic">
                                                No stop-loss orders. Select a stock from Holdings and click &quot;Set Stop-Loss&quot; to create one.
                                            </td></tr>
                                        ) : (
                                            stopOrders.map((o, i) => (
                                                <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-3 font-bold text-red-600 text-red-400">{o.symbol}</td>
                                                    <td className="p-3 text-right font-mono text-gray-200">{o.quantity}</td>
                                                    <td className="p-3 text-right font-mono font-bold text-red-600 text-red-400">{formatCurrency(o.stop_price)}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(o.current_price)}</td>
                                                    <td className={`p-3 text-right font-mono ${o.distance_pct > 5 ? 'text-green-600 text-green-400' : o.distance_pct > 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 text-red-400'}`}>
                                                        {o.distance_pct?.toFixed(1)}%
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`text-xs px-2 py-1 rounded ${o.triggered ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                                            {o.triggered ? "TRIGGERED!" : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={async () => {
                                                                await fetch(`${API_URL}/api/simulator/stop-order/${USER_ID}/${o.id}`, { method: "DELETE" });
                                                                fetchStopOrders();
                                                            }}
                                                            className="text-xs bg-gray-700 hover:bg-red-900/30 text-gray-600 text-gray-200 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 rounded border border-gray-600"
                                                        >Cancel</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "achievements" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700">
                                    <h3 className="text-lg font-bold text-white">🏆 Achievement Badges</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Earned: {achievements.filter(a => a.earned).length} / {achievements.length}
                                    </p>
                                </div>
                                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {achievements.map(a => (
                                        <div
                                            key={a.id}
                                            className={`p-4 rounded-lg border-2 text-center transition-all ${a.earned
                                                ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-400 shadow-md from-yellow-900/20 to-amber-900/20 border-yellow-700'
                                                : 'bg-gray-50 border-gray-200 opacity-60 bg-gray-700/20 border-gray-600'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2">{a.icon}</div>
                                            <div className={`font-bold text-sm ${a.earned ? 'text-white' : 'text-gray-400 text-gray-500'}`}>
                                                {a.name}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">{a.description}</div>
                                            {a.earned && (
                                                <div className="mt-2 text-xs font-bold text-green-600 text-green-400">✓ EARNED</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "alerts" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
                                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">🔔 Price Alerts</h3>
                                        <p className="text-xs text-gray-400 mt-1">Get notified when stocks hit target prices</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!selectedStock) {
                                                setTradeError("Please select a stock from the search or holdings first.");
                                                return;
                                            }
                                            setAlertPrice("");
                                            setShowAlertModal(true);
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >+ New Alert</button>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 backdrop-blur-sm text-gray-400 text-xs uppercase border-b border-white/5">
                                        <tr>
                                            <th className="p-3">Symbol</th>
                                            <th className="p-3 text-center">Direction</th>
                                            <th className="p-3 text-right">Target</th>
                                            <th className="p-3 text-right">Current</th>
                                            <th className="p-3 text-right">Distance</th>
                                            <th className="p-3 text-center">Status</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {priceAlerts.length === 0 ? (
                                            <tr><td colSpan="7" className="p-6 text-center text-gray-400 text-gray-400 italic">
                                                No price alerts. Click &quot;+ New Alert&quot; to create one.
                                            </td></tr>
                                        ) : (
                                            priceAlerts.map((a, i) => (
                                                <tr key={i} className={`hover:bg-gray-700/30 ${a.triggered ? 'bg-green-50 bg-green-900/10' : ''} transition-colors`}>
                                                    <td className="p-3 font-bold text-blue-600 text-blue-400">{a.symbol}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`text-xs px-2 py-1 rounded ${a.direction === 'above' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                            {a.direction === 'above' ? '📈 Above' : '📉 Below'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold text-white">{formatCurrency(a.target_price)}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{formatCurrency(a.current_price)}</td>
                                                    <td className="p-3 text-right font-mono text-gray-400">{a.distance_pct?.toFixed(1)}%</td>
                                                    <td className="p-3 text-center">
                                                        {a.triggered ? (
                                                            <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 font-bold">🔔 TRIGGERED!</span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Watching</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={async () => {
                                                                await fetch(`${API_URL}/api/simulator/alert/${USER_ID}/${a.id}`, { method: "DELETE" });
                                                                fetchAlerts();
                                                            }}
                                                            className="text-xs bg-gray-700 hover:bg-red-900/30 text-gray-600 text-gray-200 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 rounded border border-gray-600"
                                                        >Delete</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - TRADE TICKET */}
                    <div className="md:col-span-1">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl sticky top-24 backdrop-blur-xl shadow-2xl transition-all duration-300">
                            <div className="border-b border-gray-700 pb-4 mb-4">
                                <h3 className="text-xl font-bold text-white">Trade Ticket</h3>
                                <p className="text-sm text-gray-400">Market orders with real-time execution</p>
                            </div>

                            {/* Trade Form */}
                            <div className="space-y-4">
                                {/* Symbol Input */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">SYMBOL</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search symbol (e.g. RELIANCE.NS)"
                                            className="w-full rounded-xl py-3.5 pl-12 pr-10 shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-black/20 border border-white/10 text-white placeholder-gray-500/80 backdrop-blur-sm hover:bg-black/30 text-sm"
                                            value={selectedStock ? selectedStock.symbol.toUpperCase() : searchQuery}
                                            onChange={(e) => {
                                                if (!selectedStock) setSearchQuery(e.target.value.toUpperCase());
                                            }}
                                            disabled={!!selectedStock}
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-colors group-focus-within:text-blue-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                            </svg>
                                        </div>
                                        {selectedStock && (
                                            <button
                                                onClick={() => { setSelectedStock(null); setSearchQuery(""); setQuantity(1); setTradeSuccess(""); setTradeError(""); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && !selectedStock && (
                                        <div className="relative">
                                            <div
                                                className="absolute z-[100] top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-2xl border border-white/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {searchResults.map((stock) => (
                                                    <div
                                                        key={stock.symbol}
                                                        onClick={() => handleSelectStock(stock)}
                                                        className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-bold text-blue-400 group-hover:text-blue-300 transition-colors">{stock.symbol}</div>
                                                            <div className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">Stock</div>
                                                        </div>
                                                        <div className="text-xs text-gray-400 truncate mt-0.5">{stock.name || "Unknown Company"}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Quote Info with Candlestick & Stats */}
                                {selectedStock && (
                                    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm space-y-3">
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-lg text-white">{selectedStock.symbol}</h4>
                                                <p className="text-xs text-gray-400">{extendedQuote?.longName || selectedStock.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-white">{formatCurrency(selectedStock.price)}</div>
                                                {extendedQuote && extendedQuote.dayChange !== undefined && extendedQuote.dayChange !== null && (
                                                    <div className={`text-xs font-bold ${extendedQuote.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {extendedQuote.dayChange >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(extendedQuote.dayChange))} ({formatPercent(extendedQuote.dayChangePercent)})
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mini Candlestick Chart */}
                                        {stockHistory.length > 0 && (
                                            <div className="bg-gray-800/50 rounded-lg p-2">
                                                <div className="text-xs text-gray-500 mb-1">30-Day Price</div>
                                                <div className="h-16 flex items-end gap-[2px]">
                                                    {stockHistory.map((day, i) => {
                                                        const min = Math.min(...stockHistory.map(d => d.low || d.close));
                                                        const max = Math.max(...stockHistory.map(d => d.high || d.close));
                                                        const range = max - min || 1;
                                                        const heightOpen = ((day.open - min) / range) * 100;
                                                        const heightClose = ((day.close - min) / range) * 100;
                                                        const isGreen = day.close >= day.open;
                                                        const bodyBottom = Math.min(heightOpen, heightClose);
                                                        const bodyHeight = Math.abs(heightClose - heightOpen) || 1;
                                                        const wickBottom = ((day.low - min) / range) * 100;
                                                        const wickTop = ((day.high - min) / range) * 100;

                                                        return (
                                                            <div key={i} className="flex-1 relative h-full" title={`${day.date}\nO: ${day.open?.toFixed(2)}\nH: ${day.high?.toFixed(2)}\nL: ${day.low?.toFixed(2)}\nC: ${day.close?.toFixed(2)}`}>
                                                                {/* Wick */}
                                                                <div
                                                                    className="absolute left-1/2 w-[1px] -translate-x-1/2"
                                                                    style={{
                                                                        bottom: `${wickBottom}%`,
                                                                        height: `${wickTop - wickBottom}%`,
                                                                        backgroundColor: isGreen ? '#22c55e' : '#ef4444'
                                                                    }}
                                                                />
                                                                {/* Body */}
                                                                <div
                                                                    className="absolute left-0 right-0 rounded-[1px]"
                                                                    style={{
                                                                        bottom: `${bodyBottom}%`,
                                                                        height: `${Math.max(bodyHeight, 2)}%`,
                                                                        backgroundColor: isGreen ? '#22c55e' : '#ef4444'
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 52-Week Range */}
                                        {extendedQuote?.fiftyTwoWeekHigh && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <span>52W Low: {formatCurrency(extendedQuote.fiftyTwoWeekLow)}</span>
                                                    <span>52W High: {formatCurrency(extendedQuote.fiftyTwoWeekHigh)}</span>
                                                </div>
                                                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                                        style={{ width: '100%' }}
                                                    />
                                                    <div
                                                        className="absolute top-0 h-full w-1 bg-white shadow-lg rounded"
                                                        style={{
                                                            left: `${Math.max(0, Math.min(100, ((selectedStock.price - extendedQuote.fiftyTwoWeekLow) / (extendedQuote.fiftyTwoWeekHigh - extendedQuote.fiftyTwoWeekLow)) * 100))}%`,
                                                            transform: 'translateX(-50%)'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Key Stats Grid */}
                                        {extendedQuote && (
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-gray-800/50 rounded p-2">
                                                    <div className="text-[10px] text-gray-500 uppercase">P/E</div>
                                                    <div className="text-sm font-bold text-white">{extendedQuote.peRatio?.toFixed(1) || '-'}</div>
                                                </div>
                                                <div className="bg-gray-800/50 rounded p-2">
                                                    <div className="text-[10px] text-gray-500 uppercase">Mkt Cap</div>
                                                    <div className="text-sm font-bold text-white">
                                                        {extendedQuote.marketCap ? (extendedQuote.marketCap >= 1e12 ? `${(extendedQuote.marketCap / 1e12).toFixed(1)}T` : extendedQuote.marketCap >= 1e9 ? `${(extendedQuote.marketCap / 1e9).toFixed(1)}B` : `${(extendedQuote.marketCap / 1e6).toFixed(0)}M`) : '-'}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-800/50 rounded p-2">
                                                    <div className="text-[10px] text-gray-500 uppercase">Vol</div>
                                                    <div className="text-sm font-bold text-white">
                                                        {extendedQuote.volume ? (extendedQuote.volume >= 1e6 ? `${(extendedQuote.volume / 1e6).toFixed(1)}M` : `${(extendedQuote.volume / 1e3).toFixed(0)}K`) : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const isWatched = watchlist.some(w => w.symbol === selectedStock.symbol);
                                                    if (isWatched) removeFromWatchlist(selectedStock.symbol);
                                                    else addToWatchlist(selectedStock.symbol);
                                                }}
                                                className={`flex-1 text-xs py-2 rounded transition-all font-bold ${watchlist.some(w => w.symbol === selectedStock.symbol)
                                                    ? 'bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                                                    }`}
                                            >
                                                {watchlist.some(w => w.symbol === selectedStock.symbol) ? '✓ Watching' : '+ Watchlist'}
                                            </button>
                                            <button
                                                onClick={() => setShowStockDetailModal(true)}
                                                className="flex-1 text-xs py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-all"
                                            >
                                                📊 Full Chart
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Transaction Type */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">TRANSACTION</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {["buy", "sell", "short", "cover"].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setTradeType(type)}
                                                className={`py-3 text-xs font-bold uppercase rounded-xl transition-all duration-300 border ${tradeType === type
                                                    ? (type === 'buy' || type === 'cover'
                                                        ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                                        : 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]')
                                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ORDER TYPE - Investopedia Style */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">ORDER TYPE</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["market", "limit", "stop"].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setOrderMode(type)}
                                                className={`py-3 text-xs font-bold uppercase rounded-xl transition-all duration-300 border ${orderMode === type
                                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        {orderMode === 'market' && '⚡ Execute immediately at current market price'}
                                        {orderMode === 'limit' && '📊 Execute only when price reaches your target'}
                                        {orderMode === 'stop' && '🛡️ Trigger when price falls to stop price'}
                                    </p>
                                </div>

                                {/* Limit/Stop Price Input */}
                                {(orderMode === 'limit' || orderMode === 'stop') && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-bold text-gray-300 mb-2">
                                            {orderMode === 'limit' ? 'LIMIT PRICE' : 'STOP PRICE'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder={selectedStock ? selectedStock.price.toFixed(2) : "0.00"}
                                                className="w-full rounded-lg p-3 pl-8 font-mono text-lg bg-gray-800 border border-gray-700 text-white shadow-sm outline-none transition-all focus:ring-2 focus:ring-purple-500"
                                                value={limitPrice}
                                                onChange={(e) => setLimitPrice(e.target.value)}
                                            />
                                        </div>
                                        {selectedStock && limitPrice && (
                                            <p className={`text-xs mt-1 ${orderMode === 'limit'
                                                ? (tradeType === 'buy'
                                                    ? (parseFloat(limitPrice) < selectedStock.price ? 'text-green-400' : 'text-yellow-400')
                                                    : (parseFloat(limitPrice) > selectedStock.price ? 'text-green-400' : 'text-yellow-400'))
                                                : 'text-orange-400'
                                                }`}>
                                                {orderMode === 'limit' && tradeType === 'buy' && parseFloat(limitPrice) < selectedStock.price && `✓ Will buy when price drops to ₹${limitPrice}`}
                                                {orderMode === 'limit' && tradeType === 'buy' && parseFloat(limitPrice) >= selectedStock.price && `⚠ Limit above market - will execute immediately`}
                                                {orderMode === 'limit' && tradeType === 'sell' && parseFloat(limitPrice) > selectedStock.price && `✓ Will sell when price rises to ₹${limitPrice}`}
                                                {orderMode === 'limit' && tradeType === 'sell' && parseFloat(limitPrice) <= selectedStock.price && `⚠ Limit below market - will execute immediately`}
                                                {orderMode === 'stop' && `🛡️ Stop-loss at ₹${limitPrice} (${((1 - parseFloat(limitPrice) / selectedStock.price) * 100).toFixed(1)}% below current)`}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">QUANTITY</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xl font-bold transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm"
                                        >
                                            −
                                        </button>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="1"
                                                className={`w-full h-12 rounded-xl p-3 text-center font-mono text-xl shadow-inner outline-none transition-all focus:ring-2 focus:ring-blue-500/50 [&::-webkit-inner-spin-button]:appearance-none ${darkMode ? "bg-black/20 border border-white/10 text-white backdrop-blur-sm" : "bg-white border border-gray-300 text-gray-900"}`}
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xl font-bold transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className={`${darkMode ? "bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg" : "bg-gray-50 border border-gray-200"} p-4 rounded-xl space-y-2`}>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Est. Price:</span>
                                        <span className="font-mono font-bold text-white">{selectedStock ? formatCurrency(selectedStock.price) : "-"}</span>
                                    </div>
                                    <div className={`flex justify-between text-lg font-bold border-t ${darkMode ? "border-white/10" : "border-gray-200"} pt-2 mt-2`}>
                                        <span className="text-gray-300">Est. Total:</span>
                                        <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{selectedStock ? formatCurrency(selectedStock.price * quantity) : "-"}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-gray-500 text-center mt-2 opacity-60">
                                        +0.1% fees & slippage
                                    </p>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    disabled={!selectedStock || loading || ((orderMode === 'limit' || orderMode === 'stop') && !limitPrice)}
                                    className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${!selectedStock || ((orderMode === 'limit' || orderMode === 'stop') && !limitPrice)
                                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                                        : orderMode === 'limit'
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] text-white border border-purple-500/50'
                                            : orderMode === 'stop'
                                                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:to-red-500 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] text-white border border-orange-500/50'
                                                : tradeType === 'buy' || tradeType === 'cover'
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:to-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] text-white border border-green-500/50'
                                                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:to-rose-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] text-white border border-red-500/50'
                                        }`}
                                >
                                    {loading ? "Processing..." :
                                        orderMode === 'limit' ? `📋 Place Limit ${tradeType}` :
                                            orderMode === 'stop' ? `🛡️ Place Stop Order` :
                                                `⚡ ${tradeType.toUpperCase()} Now`}
                                </button>

                                {/* Messages */}

                            </div>
                        </div>
                    </div>
                </main>

                {/* CONFIRM MODAL */}
                {showConfirmModal && selectedStock && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transition-all transform scale-100">
                            <div className={`p-4 flex justify-between items-center border-b ${orderMode === 'limit' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                orderMode === 'stop' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                    tradeType === 'buy' || tradeType === 'cover' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                <h3 className="text-lg font-bold uppercase tracking-wider">
                                    {orderMode === 'limit' ? '📋 Limit Order' :
                                        orderMode === 'stop' ? '🛡️ Stop Order' :
                                            'Confirm Transaction'}
                                </h3>
                                <button onClick={() => setShowConfirmModal(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                    <div>
                                        <div className="text-2xl font-bold text-white">{selectedStock.symbol}</div>
                                        <div className="text-sm text-gray-400 uppercase font-bold">
                                            {orderMode === 'market' ? `${tradeType} Order` :
                                                orderMode === 'limit' ? `Limit ${tradeType}` :
                                                    'Stop-Loss Order'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-blue-400 font-mono">{quantity}</div>
                                        <div className="text-xs text-gray-500">Shares</div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    {orderMode === 'market' ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Est. Price</span>
                                                <span className="font-mono font-semibold text-white">{formatCurrency(selectedStock.price)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Fees (0.1%)</span>
                                                <span className="font-mono text-white">{formatCurrency(selectedStock.price * quantity * 0.001)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2 mt-2">
                                                <span className="text-gray-200">
                                                    {(tradeType === 'buy' || tradeType === 'cover') ? 'Total Cost' : 'Est. Credit'}
                                                </span>
                                                <span className="font-mono text-white">
                                                    {formatCurrency(
                                                        selectedStock.price * quantity * ((tradeType === 'buy' || tradeType === 'cover') ? 1.001 : 0.999)
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Current Price</span>
                                                <span className="font-mono text-white">{formatCurrency(selectedStock.price)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{orderMode === 'limit' ? 'Limit Price' : 'Stop Price'}</span>
                                                <span className={`font-mono font-bold ${orderMode === 'limit' ? 'text-purple-400' : 'text-orange-400'}`}>
                                                    {formatCurrency(parseFloat(limitPrice))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Difference</span>
                                                <span className={`font-mono ${parseFloat(limitPrice) < selectedStock.price ? 'text-red-400' : 'text-green-400'}`}>
                                                    {((parseFloat(limitPrice) - selectedStock.price) / selectedStock.price * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="p-3 bg-gray-700/50 rounded-lg text-xs text-gray-300 mt-2">
                                                {orderMode === 'limit' && tradeType === 'buy' && (
                                                    <>This order will execute when {selectedStock.symbol} drops to ₹{limitPrice}.</>
                                                )}
                                                {orderMode === 'limit' && tradeType === 'sell' && (
                                                    <>This order will execute when {selectedStock.symbol} rises to ₹{limitPrice}.</>
                                                )}
                                                {orderMode === 'stop' && (
                                                    <>This order will sell if {selectedStock.symbol} falls to ₹{limitPrice}, protecting against further loss.</>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="pt-6 flex gap-3">
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 px-4 border border-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/5 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => { setShowConfirmModal(false); executeTrade(); }}
                                        className={`flex-1 py-3 px-4 rounded-xl text-white font-bold shadow-lg transition-all transform hover:scale-[1.02] ${orderMode === 'limit' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(147,51,234,0.4)]' :
                                            orderMode === 'stop' ? 'bg-gradient-to-r from-orange-600 to-red-600 shadow-[0_0_20px_rgba(234,88,12,0.4)]' :
                                                tradeType === 'buy' || tradeType === 'cover' ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]' :
                                                    'bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                                            }`}
                                    >
                                        {orderMode === 'limit' ? `Place Limit ${tradeType.toUpperCase()}` :
                                            orderMode === 'stop' ? 'Place Stop Order' :
                                                `Confirm ${tradeType.toUpperCase()}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STOP LOSS MODAL */}
                {showStopModal && selectedStock && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transition-all transform scale-100">
                            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-wider">🛑 Set Stop-Loss</h3>
                                    <p className="text-xs opacity-80 mt-1 text-red-300">Sell {selectedStock.symbol} if price drops</p>
                                </div>
                                <button onClick={() => setShowStopModal(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Stop Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            value={stopPrice}
                                            onChange={(e) => setStopPrice(e.target.value)}
                                            className="w-full border border-white/10 rounded-xl p-3 pl-8 text-lg font-mono bg-black/20 text-white shadow-inner focus:outline-none focus:border-red-500/50 transition-colors"
                                            placeholder="e.g. 1500"
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 flex justify-between font-mono">
                                    <span>Current: <span className="text-white">{formatCurrency(selectedStock?.price)}</span></span>
                                    <span>Drop: <span className="text-red-400">{stopPrice && selectedStock?.price ? ((1 - stopPrice / selectedStock.price) * 100).toFixed(1) : 0}%</span></span>
                                </div>
                                <div className="flex gap-2">
                                    {[5, 10, 15].map(pct => (
                                        <button
                                            key={pct}
                                            onClick={() => setStopPrice(Math.floor(selectedStock.price * (1 - pct / 100)).toString())}
                                            className="flex-1 py-2 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                                        >
                                            -{pct}%
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button onClick={() => setShowStopModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                    <button
                                        onClick={async () => {
                                            if (!stopPrice) return;
                                            setLoading(true);
                                            try {
                                                await fetch(`${API_URL}/api/simulator/stop-order`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        user_id: USER_ID,
                                                        symbol: selectedStock?.symbol,
                                                        stop_price: parseFloat(stopPrice),
                                                        quantity: selectedStock?.qty || quantity
                                                    })
                                                });
                                                setShowStopModal(false);
                                                fetchStopOrders();
                                            } catch (e) { console.error(e); }
                                            finally { setLoading(false); }
                                        }}
                                        className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] text-white font-bold rounded-xl transition-all transform hover:scale-[1.02]"
                                    >
                                        Set Stop-Loss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRICE ALERT MODAL */}
                {showAlertModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transition-all transform scale-100">
                            {/* Modal Header */}
                            <div className="p-4 bg-blue-500/10 border-b border-blue-500/20 text-blue-400 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold uppercase tracking-wider">🔔 Create Price Alert</h3>
                                    <p className="text-xs opacity-80 mt-1 text-blue-300">Get notified when price hits target</p>
                                </div>
                                <button onClick={() => setShowAlertModal(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
                            </div>

                            {/* Alert Form */}
                            <div className="p-6 space-y-4">
                                {/* Symbol */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Symbol</label>
                                    <input
                                        type="text"
                                        value={selectedStock?.symbol || ""}
                                        readOnly
                                        className="w-full border border-gray-600 rounded p-3 bg-gray-50 bg-gray-700 text-white"
                                        placeholder="Select a stock first"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Select a stock from Portfolio or Watchlist first</p>
                                </div>

                                {/* Direction */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Alert When Price Is</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setAlertDirection("above")}
                                            className={`flex-1 py-2 px-3 rounded border font-semibold text-sm ${alertDirection === "above"
                                                ? "bg-green-100 dark:bg-green-900/40 text-green-400 border-green-500"
                                                : "bg-gray-700 text-gray-300 border-gray-600"
                                                }`}
                                        >
                                            📈 Above Target
                                        </button>
                                        <button
                                            onClick={() => setAlertDirection("below")}
                                            className={`flex-1 py-2 px-3 rounded border font-semibold text-sm ${alertDirection === "below"
                                                ? "bg-red-100 dark:bg-red-900/40 text-red-400 border-red-500"
                                                : "bg-gray-700 text-gray-300 border-gray-600"
                                                }`}
                                        >
                                            📉 Below Target
                                        </button>
                                    </div>
                                </div>

                                {/* Target Price */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Target Price</label>
                                    <input
                                        type="number"
                                        value={alertPrice}
                                        onChange={(e) => setAlertPrice(e.target.value)}
                                        className="w-full border border-gray-600 rounded p-3 text-lg font-mono bg-gray-700 text-white"
                                        placeholder="e.g. 1500"
                                    />
                                    {selectedStock && (
                                        <p className="text-xs text-gray-400 mt-1 text-right">
                                            Current: {formatCurrency(selectedStock?.price)}
                                        </p>
                                    )}
                                </div>

                                {/* Create Button */}
                                <div className="pt-2 flex gap-3">
                                    <button onClick={() => setShowAlertModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                    <button
                                        onClick={async () => {
                                            if (!selectedStock || !alertPrice) return;
                                            setLoading(true);
                                            try {
                                                await fetch(`${API_URL}/api/simulator/alert`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        user_id: USER_ID,
                                                        symbol: selectedStock.symbol,
                                                        target_price: parseFloat(alertPrice),
                                                        direction: alertDirection
                                                    })
                                                });
                                                setShowAlertModal(false);
                                                fetchAlerts();
                                            } catch (e) { console.error(e); }
                                            finally { setLoading(false); }
                                        }}
                                        disabled={!selectedStock || !alertPrice}
                                        className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] ${!selectedStock || !alertPrice
                                            ? "bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
                                            }`}
                                    >
                                        Create Alert
                                    </button>
                                </div>
                                <div className="hidden"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STOCK DETAIL MODAL - Full Chart & Extended Info */}
                {showStockDetailModal && selectedStock && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transition-all">
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50 backdrop-blur-xl z-10 shrink-0">
                                <div>
                                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{selectedStock.symbol}</h3>
                                    <p className="text-sm text-gray-400 font-medium">{extendedQuote?.longName || selectedStock.name}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white font-mono tracking-tight">{formatCurrency(selectedStock.price)}</div>
                                        {extendedQuote && extendedQuote.dayChange !== undefined && extendedQuote.dayChange !== null && (
                                            <div className={`text-sm font-bold flex items-center justify-end gap-1 ${extendedQuote.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                <span>{extendedQuote.dayChange >= 0 ? '▲' : '▼'}</span>
                                                <span className="font-mono">{formatCurrency(Math.abs(extendedQuote.dayChange))}</span>
                                                <span className="font-mono">({formatPercent(extendedQuote.dayChangePercent)})</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowStockDetailModal(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {/* Large Candlestick Chart */}
                                {stockHistory.length > 0 && (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                            Price Action (30 Days)
                                        </h4>
                                        <div className="h-80 flex items-end gap-1.5 pb-2 mt-12">
                                            {stockHistory.map((day, i) => {
                                                const min = Math.min(...stockHistory.map(d => d.low || d.close));
                                                const max = Math.max(...stockHistory.map(d => d.high || d.close));
                                                const range = max - min || 1;
                                                const heightOpen = ((day.open - min) / range) * 100;
                                                const heightClose = ((day.close - min) / range) * 100;
                                                const isGreen = day.close >= day.open;
                                                const bodyBottom = Math.min(heightOpen, heightClose);
                                                const bodyHeight = Math.abs(heightClose - heightOpen) || 1;
                                                const wickBottom = ((day.low - min) / range) * 100;
                                                const wickTop = ((day.high - min) / range) * 100;
                                                const ma20Height = day.ma20 ? (((day.ma20 - min) / range) * 100) : null;
                                                const ma50Height = day.ma50 ? (((day.ma50 - min) / range) * 100) : null;

                                                // Smart tooltip positioning to prevent clipping
                                                const tooltipPosition = i < 5 ? "left-0" : i > stockHistory.length - 6 ? "right-0" : "left-1/2 -translate-x-1/2";

                                                return (
                                                    <div key={i} className="flex-1 relative h-full group cursor-crosshair">
                                                        {/* MA lines */}
                                                        {ma20Height && (
                                                            <div
                                                                className="absolute w-full h-[2px] bg-blue-400/50"
                                                                style={{ bottom: `${ma20Height}%` }}
                                                            />
                                                        )}
                                                        {ma50Height && (
                                                            <div
                                                                className="absolute w-full h-[2px] bg-orange-400/50"
                                                                style={{ bottom: `${ma50Height}%` }}
                                                            />
                                                        )}
                                                        {/* Wick */}
                                                        <div
                                                            className="absolute left-1/2 w-[2px] -translate-x-1/2"
                                                            style={{
                                                                bottom: `${wickBottom}%`,
                                                                height: `${wickTop - wickBottom}%`,
                                                                backgroundColor: isGreen ? '#22c55e' : '#ef4444'
                                                            }}
                                                        />
                                                        {/* Body */}
                                                        <div
                                                            className="absolute left-[2px] right-[2px] rounded-[2px]"
                                                            style={{
                                                                bottom: `${bodyBottom}%`,
                                                                height: `${Math.max(bodyHeight, 3)}%`,
                                                                backgroundColor: isGreen ? '#22c55e' : '#ef4444'
                                                            }}
                                                        />
                                                        {/* Tooltip */}
                                                        <div className={`absolute bottom-full mb-3 ${tooltipPosition} hidden group-hover:block z-50 pointer-events-none min-w-[160px]`}>
                                                            <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-2.5 text-xs shadow-2xl relative">
                                                                <div className="font-bold text-white border-b border-white/10 pb-1.5 mb-1.5 text-center">{day.date}</div>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                                                                    <div><span className="text-gray-500 mr-1">O:</span><span className="text-white font-bold">{day.open?.toFixed(1)}</span></div>
                                                                    <div className="text-right"><span className="text-gray-500 mr-1">H:</span><span className="text-green-400 font-bold">{day.high?.toFixed(1)}</span></div>
                                                                    <div><span className="text-gray-500 mr-1">L:</span><span className="text-red-400 font-bold">{day.low?.toFixed(1)}</span></div>
                                                                    <div className="text-right"><span className="text-gray-500 mr-1">C:</span><span className={isGreen ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{day.close?.toFixed(1)}</span></div>
                                                                </div>
                                                                {/* Arrow */}
                                                                <div className={`absolute top-full w-2 h-2 bg-gray-900/95 border-r border-b border-white/20 transform rotate-45 ${tooltipPosition === 'left-0' ? 'left-4' : tooltipPosition === 'right-0' ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Legend */}
                                        <div className="flex gap-4 mt-3 text-xs text-gray-400 font-medium border-t border-white/5 pt-3">
                                            <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-blue-400"></span> MA20</span>
                                            <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-orange-400"></span> MA50</span>
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Up</span>
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Down</span>
                                        </div>
                                    </div>
                                )}

                                {/* Extended Stats */}
                                {extendedQuote && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: "Day Range", value: `${formatCurrency(extendedQuote.dayLow)} - ${formatCurrency(extendedQuote.dayHigh)}` },
                                            { label: "52 Week Range", value: `${formatCurrency(extendedQuote.fiftyTwoWeekLow)} - ${formatCurrency(extendedQuote.fiftyTwoWeekHigh)}` },
                                            { label: "Previous Close", value: formatCurrency(extendedQuote.previousClose) },
                                            { label: "Open", value: formatCurrency(extendedQuote.open) },
                                            { label: "Market Cap", value: extendedQuote.marketCap ? (extendedQuote.marketCap >= 1e12 ? `₹${(extendedQuote.marketCap / 1e12).toFixed(2)}T` : extendedQuote.marketCap >= 1e9 ? `₹${(extendedQuote.marketCap / 1e9).toFixed(2)}B` : `₹${(extendedQuote.marketCap / 1e6).toFixed(0)}M`) : '-' },
                                            { label: "P/E Ratio", value: extendedQuote.peRatio?.toFixed(2) || '-' },
                                            { label: "EPS", value: extendedQuote.eps?.toFixed(2) || '-' },
                                            { label: "Dividend Yield", value: extendedQuote.dividendYield ? `${(extendedQuote.dividendYield * 100).toFixed(2)}%` : '-' },
                                            { label: "Beta", value: extendedQuote.beta?.toFixed(2) || '-' },
                                            { label: "Volume", value: extendedQuote.volume?.toLocaleString() || '-' },
                                            { label: "Avg Volume", value: extendedQuote.avgVolume?.toLocaleString() || '-' },
                                            { label: "50 Day Avg", value: formatCurrency(extendedQuote.fiftyDayAverage) }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-transparent border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-colors group">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold group-hover:text-blue-400 transition-colors">{stat.label}</div>
                                                <div className="text-white font-bold font-mono text-sm md:text-base">{stat.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Sector & Industry */}
                                {extendedQuote?.sector && (
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-wrap gap-8">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sector</div>
                                            <div className="text-white font-bold flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                {extendedQuote.sector}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Industry</div>
                                            <div className="text-white font-bold flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                {extendedQuote.industry}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => { setShowStockDetailModal(false); setTradeType('buy'); }}
                                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.02]"
                                    >
                                        Buy {selectedStock.symbol}
                                    </button>
                                    <button
                                        onClick={() => { setShowStockDetailModal(false); setTradeType('sell'); }}
                                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all transform hover:scale-[1.02]"
                                    >
                                        Sell {selectedStock.symbol}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const isWatched = watchlist.some(w => w.symbol === selectedStock.symbol);
                                            if (isWatched) removeFromWatchlist(selectedStock.symbol);
                                            else addToWatchlist(selectedStock.symbol);
                                        }}
                                        className={`px-6 py-3 font-bold rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 border ${watchlist.some(w => w.symbol === selectedStock.symbol)
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                                            }`}
                                    >
                                        <span>{watchlist.some(w => w.symbol === selectedStock.symbol) ? "✓" : "👁"}</span>
                                        {watchlist.some(w => w.symbol === selectedStock.symbol) ? "Watching" : "Watch"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESET CONFIRMATION MODAL */}
                {showResetModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transition-all transform scale-100">
                            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <h3 className="text-lg font-bold uppercase tracking-wider">Reset Simulator?</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    Are you sure you want to reset your portfolio? This will <span className="text-red-400 font-bold">permanently delete</span> all holdings, history, and achievements.
                                    <br /><br />
                                    Your balance will reset to <span className="text-white font-bold">₹10,00,000</span>.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl text-gray-400 font-bold hover:bg-white/5 transition-colors">Cancel</button>
                                    <button
                                        onClick={performReset}
                                        className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-orange-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] text-white font-bold rounded-xl transition-all transform hover:scale-[1.02]"
                                    >
                                        Yes, Reset Everything
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Closing standard div */}
                {/* TOAST NOTIFICATIONS */}
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                    {/* Price Alert Toast */}
                    {triggeredAlert && (
                        <div className="pointer-events-auto bg-gray-900/95 border border-blue-500/50 backdrop-blur-2xl p-5 rounded-2xl shadow-[0_10px_50px_rgba(59,130,246,0.3)] flex items-center gap-4 animate-in slide-in-from-right-full duration-500 max-w-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent"></div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(59,130,246,0.5)] transform -rotate-3">
                                <span className="text-3xl drop-shadow-md">🔔</span>
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Price Alert</div>
                                <h3 className="text-white font-extrabold text-lg leading-none">{triggeredAlert.symbol}</h3>
                                <p className="text-xs text-gray-300 mt-1.5 font-medium leading-relaxed">
                                    Price hit your target of <span className="text-blue-400 font-bold">₹{triggeredAlert.target_price}</span>
                                </p>
                            </div>
                            <button onClick={() => setTriggeredAlert(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors">✕</button>
                        </div>
                    )}

                    {/* Achievement Toast */}
                    {unlockedAchievement && (
                        <div className="pointer-events-auto bg-gray-900/95 border border-yellow-500/50 backdrop-blur-2xl p-5 rounded-2xl shadow-[0_10px_50px_rgba(234,179,8,0.3)] flex items-center gap-4 animate-in slide-in-from-right-full duration-500 min-w-[320px] max-w-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent"></div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(234,179,8,0.5)] transform rotate-3">
                                <span className="text-3xl drop-shadow-md">{unlockedAchievement.icon}</span>
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-1">New Milestone</div>
                                <h3 className="text-white font-extrabold text-lg leading-none">{unlockedAchievement.name}</h3>
                                <p className="text-xs text-gray-400 mt-1.5 font-medium leading-relaxed">{unlockedAchievement.description}</p>
                            </div>
                            <div className="absolute top-0 right-0 p-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                            </div>
                        </div>
                    )}

                    {/* Error Toast */}
                    {tradeError && (
                        <div className="pointer-events-auto bg-gray-900/90 backdrop-blur-xl border-l-4 border-l-red-500 border-y border-r border-white/10 text-white p-4 rounded-r-lg shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-full duration-300 max-w-sm">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                <span className="text-red-400 text-lg">✕</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-red-400">Transaction Failed</h4>
                                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{tradeError}</p>
                            </div>
                            <button onClick={() => setTradeError("")} className="text-gray-500 hover:text-white transition-colors">✕</button>
                        </div>
                    )}

                    {/* Success Toast */}
                    {tradeSuccess && (
                        <div className="pointer-events-auto bg-gray-900/90 backdrop-blur-xl border-l-4 border-l-green-500 border-y border-r border-white/10 text-white p-4 rounded-r-lg shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-full duration-300 max-w-sm">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <span className="text-green-400 text-lg">✓</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-green-400">Success</h4>
                                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{tradeSuccess}</p>
                            </div>
                            <button onClick={() => setTradeSuccess("")} className="text-gray-500 hover:text-white transition-colors">✕</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}




