"use client";
import { useState } from "react";

const StockAIDostModal = ({ isOpen, onClose, stockData }) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const generateResponse = async () => {
    if (!stockData) return;

    setLoading(true);
    try {
      // Prepare context about the stock
      const prompt = `
      Analyze this stock:
      Symbol: ${stockData.meta?.symbol}
      Company: ${stockData.meta?.longName || stockData.meta?.companyName}
      Industry: ${stockData.meta?.industry || 'N/A'}
      Sector: ${stockData.meta?.sector || 'N/A'}
      Current Price: ₹${stockData.navHistory?.[stockData.navHistory.length - 1]?.close || 'N/A'}
      
      Key Metrics:
      - Annualized Return: ${(stockData.riskVolatility?.annualized_return * 100).toFixed(2)}%
      - Volatility: ${(stockData.riskVolatility?.annualized_volatility * 100).toFixed(2)}%
      - Sharpe Ratio: ${stockData.riskVolatility?.sharpe_ratio?.toFixed(2)}
      
      Monte Carlo Prediction:
      - Expected Price: ₹${stockData.monteCarlo?.expected_price?.toFixed(2)}
      - Probability of Positive Return: ${stockData.monteCarlo?.probability_positive_return}%
      
      Based on the above data, provide a comprehensive stock analysis including:
      1. Overall assessment
      2. Key strengths and risks
      3. Technical analysis insights
      4. Investment recommendation with time horizon
      5. Key factors to monitor

      Format the response with clear headings and bullet points.
      `;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to generate analysis");

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
      console.error("Error generating response:", error);
      setResponse("Sorry, I couldn't generate the analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#181f31] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col relative border border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Stock Analysis</h2>
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
                Click the button below to generate an AI-powered analysis of this stock.
              </p>
              <button
                onClick={generateResponse}
                className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Generate Analysis
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="text-gray-400">Generating analysis...</p>
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
              onClick={generateResponse}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Regenerate Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAIDostModal;