"use client";
import React, { useState } from "react";

export default function AIReportModal({ isOpen, onClose, fundData }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReport("");

    try {
      const response = await fetch("/api/ai/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fundData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setReport((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && !report && !loading) {
      generateReport();
    }
  }, [isOpen]);

  const downloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([report], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${fundData.meta?.scheme_name || 'fund'}-AI-Report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    alert("Report copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#181f31] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Investment Report</h2>
              <p className="text-purple-100 text-sm">Comprehensive Analysis & Insights</p>
            </div>
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
              <div className="animate-spin border-4 border-purple-400 border-t-transparent rounded-full w-12 h-12 mb-4"></div>
              <p className="text-gray-400 text-lg">Generating comprehensive report... 📊</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-400">
              <p className="font-semibold">Error: {error}</p>
              <button
                onClick={generateReport}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {report && (
            <div className="prose prose-invert max-w-none">
              <div className="bg-[#232b44] rounded-lg p-6 text-white whitespace-pre-wrap leading-relaxed text-base font-mono">
                {report}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="bg-[#0d1020] p-4 flex justify-between items-center border-t border-gray-700 flex-wrap gap-3">
          <p className="text-gray-400 text-sm">
            📋 Professional AI-generated investment report
          </p>
          <div className="flex gap-3">
            {report && (
              <>
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={downloadReport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
