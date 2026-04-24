"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, Share2 } from "lucide-react";

export default function StockAIReportModal({ isOpen, onClose, stockData }) {
    if (!isOpen) return null;

    const handleDownload = () => {
        // Mock download
        alert("Downloading report...");
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="bg-[#131722] w-full max-w-3xl max-h-[90vh] rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-700 bg-gray-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                <FileText className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Comprehensive AI Report</h2>
                                <p className="text-sm text-gray-400">Generated for {stockData?.meta?.longName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0f1219]">
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-cyan-400">Executive Summary</h3>
                            <p className="text-gray-300">
                                {stockData?.meta?.longName} ({stockData?.meta?.symbol}) presents a compelling case for investors seeking exposure in the {stockData?.meta?.sector} sector.
                                Our AI probability models indicate a <strong>{stockData?.monteCarlo?.probability_positive_return}% chance of positive returns</strong> over the next 12 months.
                            </p>

                            <div className="my-8 h-px bg-gray-800" />

                            <h4 className="text-white mb-4">Technical Analysis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#1a202c] p-4 rounded-lg border border-gray-700">
                                    <span className="text-gray-400 text-sm block mb-1">RSI (14)</span>
                                    <span className="text-xl font-mono text-white">45.2 (Neutral)</span>
                                </div>
                                <div className="bg-[#1a202c] p-4 rounded-lg border border-gray-700">
                                    <span className="text-gray-400 text-sm block mb-1">MACD</span>
                                    <span className="text-xl font-mono text-green-400">Bullish Crossover</span>
                                </div>
                            </div>

                            <h4 className="text-white mb-4">Fundamental Strengths</h4>
                            <ul className="space-y-2 text-gray-300 list-disc pl-5">
                                <li>Market Capitalization of <span className="text-white font-mono">₹{stockData?.meta?.marketCap?.toLocaleString()}</span> reflects strong market presence.</li>
                                <li>Industry PE ratio comparison suggests the stock is currently <strong>{stockData?.meta?.pe > 25 ? 'Premium Valued' : 'Fairly Valued'}</strong>.</li>
                                <li>Consistent tracking performance relative to sector benchmarks.</li>
                            </ul>

                            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 p-5 rounded-lg">
                                <h5 className="text-blue-400 font-bold mb-2">AI Verdict</h5>
                                <p className="text-blue-100/80 text-sm">
                                    Calculated Accumulate rating with a medium-term horizon. Suggested entry points: below current MA-50 levels.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
                        <button className="px-4 py-2 text-gray-300 hover:text-white flex items-center gap-2 transition-colors">
                            <Share2 size={18} />
                            Share
                        </button>
                        <button onClick={handleDownload} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                            <Download size={18} />
                            Download PDF
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
