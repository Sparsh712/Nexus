"use client";
import React, { useState } from "react";

export default function AIDostModal({ isOpen, onClose, fundData }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary("");

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fundData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setSummary((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !summary && !loading) {
      generateSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#181f31] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">NexBôt - Your Investment Buddy</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin border-4 border-cyan-400 border-t-transparent rounded-full w-12 h-12 mb-4"></div>
              <p className="text-gray-400 text-lg">NexBôt is analyzing the fund... 🤖</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-400">
              <p className="font-semibold">Error: {error}</p>
              <button
                onClick={generateSummary}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {summary && (
            <div className="prose prose-invert max-w-none">
              <div className="bg-[#232b44] rounded-lg p-6 text-white whitespace-pre-wrap leading-relaxed text-base">
                {summary}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0d1020] p-4 flex justify-between items-center border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            💡 This is AI-generated advice. Always do your own research!
          </p>
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
