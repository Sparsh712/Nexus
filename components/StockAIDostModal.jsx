"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, ChevronRight, TrendingUp, AlertTriangle, Info } from "lucide-react";

export default function StockAIDostModal({ isOpen, onClose, stockData }) {
    const [activeTab, setActiveTab] = useState("insights");

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#131722] w-full max-w-4xl h-[80vh] rounded-2xl border border-gray-700 shadow-2xl flex overflow-hidden"
                >
                    {/* Sidebar */}
                    <div className="w-64 bg-[#0e111a] border-r border-gray-700 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                                <Bot className="text-white w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">NexBôt</h2>
                        </div>

                        <nav className="space-y-2 flex-1">
                            {[
                                { id: "insights", label: "Key Insights", icon: Info },
                                { id: "prediction", label: "AI Prediction", icon: TrendingUp },
                                { id: "risks", label: "Risk Analysis", icon: AlertTriangle },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id
                                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                    {activeTab === item.id && <ChevronRight className="ml-auto w-4 h-4" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 overflow-y-auto custom-scrollbar h-full">
                            <div className="max-w-3xl mx-auto">
                                {activeTab === "insights" && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <h3 className="text-2xl font-bold text-white mb-4">Market Insights: {stockData?.meta?.longName}</h3>
                                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                            <p className="text-gray-300 leading-relaxed">
                                                Based on recent market trends, <strong>{stockData?.meta?.longName}</strong> shows strong potential in the {stockData?.meta?.sector || "Technology"} sector. The stock has demonstrated a {stockData?.riskVolatility?.annualized_return > 0 ? "positive" : "volatile"} annualized return of {((stockData?.riskVolatility?.annualized_return || 0) * 100).toFixed(2)}%.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "prediction" && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <h3 className="text-2xl font-bold text-white mb-4">Monte Carlo Forecast</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#1a1f2e] p-5 rounded-xl border border-blue-500/20">
                                                <h4 className="text-sm text-gray-400 mb-1">Expected Price (1Y)</h4>
                                                <div className="text-2xl font-bold text-blue-400">₹{stockData?.monteCarlo?.expected_price?.toFixed(2)}</div>
                                            </div>
                                            <div className="bg-[#1a1f2e] p-5 rounded-xl border border-green-500/20">
                                                <h4 className="text-sm text-gray-400 mb-1">Probability of Upside</h4>
                                                <div className="text-2xl font-bold text-green-400">{stockData?.monteCarlo?.probability_positive_return}%</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "risks" && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <h3 className="text-2xl font-bold text-white mb-4">Risk Assessment</h3>
                                        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="text-red-400 shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="font-bold text-red-400 text-lg mb-2">Volatility Alert</h4>
                                                    <p className="text-gray-300">
                                                        Annualized Volatility is at <span className="text-white font-mono">{((stockData?.riskVolatility?.annualized_volatility || 0) * 100).toFixed(2)}%</span>. This indicates {stockData?.riskVolatility?.annualized_volatility > 0.3 ? "high" : "moderate"} price fluctuations. Ensure this aligns with your risk tolerance.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
