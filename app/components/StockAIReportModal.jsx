"use client";
import { useState } from "react";

const StockAIReportModal = ({ isOpen, onClose, stockData }) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const generateReport = async () => {
    if (!stockData) return;

    setLoading(true);
    try {
      // Prepare detailed stock context
      const prompt = `
      Generate a detailed stock research report for:
      
      COMPANY OVERVIEW:
      Symbol: ${stockData.meta?.symbol}
      Company Name: ${stockData.meta?.longName || stockData.meta?.companyName}
      Industry: ${stockData.meta?.industry || 'N/A'}
      Sector: ${stockData.meta?.sector || 'N/A'}
      Market Cap: ₹${stockData.meta?.marketCap?.toLocaleString() || 'N/A'}

      TECHNICAL ANALYSIS:
      Current Price: ₹${stockData.navHistory?.[stockData.navHistory.length - 1]?.close || 'N/A'}
      Annualized Return: ${(stockData.riskVolatility?.annualized_return * 100).toFixed(2)}%
      Volatility: ${(stockData.riskVolatility?.annualized_volatility * 100).toFixed(2)}%
      Sharpe Ratio: ${stockData.riskVolatility?.sharpe_ratio?.toFixed(2)}

      FUTURE OUTLOOK:
      Expected Price (Monte Carlo): ₹${stockData.monteCarlo?.expected_price?.toFixed(2)}
      Probability of Positive Return: ${stockData.monteCarlo?.probability_positive_return}%
      Price Range (5th-95th percentile): ₹${stockData.monteCarlo?.lower_bound_5th_percentile?.toFixed(2)} - ₹${stockData.monteCarlo?.upper_bound_95th_percentile?.toFixed(2)}

      Generate a comprehensive stock research report including:

      1. Executive Summary
      2. Company Overview & Business Model
      3. Industry Analysis & Competitive Position
      4. Technical Analysis
         - Price Trends
         - Volatility Analysis
         - Risk Metrics
      5. Investment Thesis
         - Growth Drivers
         - Risk Factors
         - Valuation Analysis
      6. Future Outlook & Price Targets
      7. Investment Recommendation
         - Buy/Hold/Sell Rating
         - Target Price Range
         - Investment Horizon
         - Risk Level

      Format the report professionally with clear sections and bullet points where appropriate.
      Keep language clear and accessible for retail investors.
      `;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      let fullResponse = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setResponse(fullResponse);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setResponse("Sorry, I couldn't generate the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#181f31] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col relative border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Stock Research Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!response && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-gray-400 text-center">
                Click the button below to generate a detailed stock research report.
              </p>
              <button
                onClick={generateReport}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Generate Report
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
              <p className="text-gray-400">Generating report...</p>
            </div>
          )}

          {response && !loading && (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap">{response}</div>
            </div>
          )}
        </div>

        {response && (
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={generateReport}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Regenerate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAIReportModal;