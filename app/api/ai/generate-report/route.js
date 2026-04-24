import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://newealth.com',
    'X-Title': 'NewWealth AI',
  },
});

export async function POST(request) {
  try {
    const { fundData } = await request.json();

    // Check if this is portfolio data (multiple items) or single fund data
    const isPortfolio = fundData.portfolioItems && fundData.portfolioItems.length > 0;

    let fundInfo, prompt;

    if (isPortfolio) {
      // Portfolio context - comprehensive analysis
      const stocksCount = fundData.meta?.stocks_count || 0;
      const mfCount = fundData.meta?.mutual_funds_count || 0;
      const cryptoCount = fundData.portfolioItems?.filter(i => i.item_type === 'crypto').length || 0;
      
      // Build detailed portfolio items list with all metrics
      const itemsList = fundData.portfolioItems.map((item, idx) => {
        const returnStr = item.risk_volatility?.annualized_return 
          ? `${(item.risk_volatility.annualized_return * 100).toFixed(2)}%` 
          : "N/A";
        const volatilityStr = item.risk_volatility?.annualized_volatility 
          ? `${(item.risk_volatility.annualized_volatility * 100).toFixed(2)}%` 
          : "N/A";
        const sharpeStr = item.risk_volatility?.sharpe_ratio 
          ? item.risk_volatility.sharpe_ratio.toFixed(2) 
          : "N/A";
        const navStr = item.nav ? `₹${item.nav}` : "N/A";
        
        return `${idx + 1}. ${item.name} (${item.item_type.toUpperCase()})
   - Symbol/Code: ${item.symbol || 'N/A'}
   - Current Price/NAV: ${navStr}
   - Annualized Return: ${returnStr}
   - Annualized Volatility: ${volatilityStr}
   - Sharpe Ratio: ${sharpeStr}
   - Risk Category: ${item.risk_volatility?.annualized_volatility > 0.3 ? "High" : item.risk_volatility?.annualized_volatility > 0.15 ? "Medium" : "Low"}
   - Date Added: ${new Date(item.added_at).toLocaleDateString()}`;
      }).join('\n\n');

      // Calculate portfolio-level insights
      const totalValue = fundData.portfolioItems.reduce((sum, item) => sum + (item.nav || 0), 0);
      const avgReturn = fundData.riskVolatility?.annualized_return || 0;
      const avgVolatility = fundData.riskVolatility?.annualized_volatility || 0;
      
      fundInfo = `
COMPREHENSIVE PORTFOLIO ANALYSIS REPORT
========================================

PORTFOLIO COMPOSITION
---------------------
- Total Holdings: ${fundData.meta?.portfolio_size || 0}
- Stocks: ${stocksCount}
- Mutual Funds: ${mfCount}
- Cryptocurrencies: ${cryptoCount}
- Diversification Score: ${stocksCount + mfCount + cryptoCount >= 5 ? "Well Diversified" : "Needs More Diversification"}

AGGREGATE PERFORMANCE METRICS
------------------------------
- Portfolio Average Return: ${(avgReturn * 100).toFixed(2)}%
- Portfolio Average Volatility: ${(avgVolatility * 100).toFixed(2)}%
- Portfolio Sharpe Ratio: ${fundData.riskVolatility?.sharpe_ratio?.toFixed(2) || "N/A"}
- Risk-Adjusted Performance: ${fundData.riskVolatility?.sharpe_ratio > 1 ? "Excellent" : fundData.riskVolatility?.sharpe_ratio > 0.5 ? "Good" : "Moderate"}

MONTE CARLO SIMULATION (1 YEAR FORECAST)
-----------------------------------------
- Expected Portfolio Value: ₹${fundData.monteCarlo?.expected_nav?.toFixed(2) || "N/A"}
- Probability of Positive Return: ${fundData.monteCarlo?.probability_positive_return?.toFixed(2) || "N/A"}%
- Confidence Level: ${fundData.monteCarlo?.probability_positive_return > 70 ? "High" : fundData.monteCarlo?.probability_positive_return > 50 ? "Moderate" : "Low"}

DETAILED HOLDINGS BREAKDOWN
----------------------------
${itemsList}
`;

      prompt = `You are a professional financial analyst creating a comprehensive PORTFOLIO investment report. This portfolio contains multiple assets including stocks, mutual funds, and/or cryptocurrencies. Generate a detailed, structured analysis suitable for serious investors.

IMPORTANT FORMATTING INSTRUCTIONS:
- DO NOT use hash symbols (#) or asterisks (**) for headings
- Use UPPERCASE TEXT for section titles (e.g., EXECUTIVE SUMMARY)
- Use bullet points (•) or dashes (-) for all lists and sub-points
- Keep formatting clean and professional
- Headings should be plain text without any special formatting

Structure the report with the following sections:

EXECUTIVE SUMMARY
• Brief portfolio overview
• Key highlights and notable holdings
• Overall portfolio health rating

PORTFOLIO COMPOSITION ANALYSIS
• Asset allocation breakdown (stocks vs MF vs crypto)
• Diversification assessment
• Sector/category exposure (if discernible)

AGGREGATE PERFORMANCE ANALYSIS
• Overall portfolio returns
• Individual star performers and underperformers
• Consistency of returns across holdings
• Comparison to typical benchmarks

RISK ASSESSMENT
• Portfolio-wide volatility analysis
• Individual asset risk profiles
• Risk concentration issues
• Sharpe ratio interpretation
• Overall risk category (Conservative/Balanced/Aggressive)

PREDICTIVE ANALYSIS
• Monte Carlo simulation insights for portfolio
• Expected growth trajectory
• Best and worst case scenarios
• Probability assessment

DIVERSIFICATION REVIEW
• Current diversification quality
• Over/under-exposed areas
• Suggestions for better balance
• Correlation between holdings

INDIVIDUAL HOLDINGS REVIEW
• Brief assessment of each major holding
• Which holdings to hold, increase, or consider exiting
• Rationale for each suggestion

INVESTMENT STRATEGY RECOMMENDATIONS
• Ideal investment horizon
• Rebalancing suggestions
• New additions to consider
• Portfolio optimization steps

STRENGTHS & AREAS FOR IMPROVEMENT
• What's working well
• What needs attention
• Competitive positioning of portfolio

FINAL RECOMMENDATION
• Overall portfolio rating
• Action plan for next 3-6 months
• Risk-reward assessment
• Specific next steps

Use professional but clear language. Reference specific holdings by name. Be objective and data-driven.

Portfolio Data:
${fundInfo}`;
    } else {
      // Single fund/stock context
      const currentNav = fundData.navHistory?.length > 0 
        ? fundData.navHistory[fundData.navHistory.length - 1]?.nav 
        : "N/A";
      const navDisplay = currentNav !== "N/A" ? `₹${parseFloat(currentNav).toFixed(2)}` : "N/A";

      // Calculate additional metrics
      const navHistoryLength = fundData.navHistory?.length || 0;
      const firstNav = navHistoryLength > 0 ? parseFloat(fundData.navHistory[0]?.nav) : 0;
      const lastNav = navHistoryLength > 0 ? parseFloat(fundData.navHistory[navHistoryLength - 1]?.nav) : 0;
      const totalReturn = firstNav > 0 ? (((lastNav - firstNav) / firstNav) * 100).toFixed(2) : "N/A";

      fundInfo = `
MUTUAL FUND COMPREHENSIVE ANALYSIS REPORT
============================================

FUND IDENTIFICATION
-------------------
- Fund Name: ${fundData.meta?.scheme_name || fundData.meta?.schemeName || "Unknown"}
- Fund House/AMC: ${fundData.meta?.fund_house || fundData.meta?.amc || "Unknown"}
- Scheme Code: ${fundData.meta?.scheme_code || "Unknown"}
- Category: ${fundData.meta?.scheme_category || "Unknown"}
- Type: ${fundData.meta?.scheme_type || "Unknown"}

CURRENT VALUATION
-----------------
- Current NAV: ${navDisplay}
- Historical Data Points: ${navHistoryLength} days
- Total Historical Return: ${totalReturn}%

PERFORMANCE METRICS
-------------------
- Annualized Return: ${((fundData.riskVolatility?.annualized_return || 0) * 100).toFixed(2)}%
- Annualized Volatility: ${((fundData.riskVolatility?.annualized_volatility || 0) * 100).toFixed(2)}%
- Sharpe Ratio: ${fundData.riskVolatility?.sharpe_ratio?.toFixed(4) || "N/A"}
- Risk-Adjusted Performance: ${fundData.riskVolatility?.sharpe_ratio > 1 ? "Good" : fundData.riskVolatility?.sharpe_ratio > 0.5 ? "Moderate" : "Poor"}

MONTE CARLO SIMULATION (1 YEAR FORECAST)
-----------------------------------------
- Expected NAV (1 Year): ₹${fundData.monteCarlo?.expected_nav?.toFixed(2) || "N/A"}
- Probability of Positive Return: ${fundData.monteCarlo?.probability_positive_return?.toFixed(2) || "N/A"}%
- 5th Percentile (Pessimistic): ₹${fundData.monteCarlo?.lower_bound_5th_percentile?.toFixed(2) || "N/A"}
- 95th Percentile (Optimistic): ₹${fundData.monteCarlo?.upper_bound_95th_percentile?.toFixed(2) || "N/A"}
- Simulation Confidence: ${fundData.monteCarlo?.probability_positive_return > 70 ? "High" : fundData.monteCarlo?.probability_positive_return > 50 ? "Moderate" : "Low"}
`;

      prompt = `You are a professional financial analyst creating a comprehensive investment report. Generate a detailed, structured investment analysis report for this mutual fund. The report should be professional, data-driven, and suitable for serious investors.

IMPORTANT FORMATTING INSTRUCTIONS:
- DO NOT use hash symbols (#) or asterisks (**) for headings
- Use UPPERCASE TEXT for section titles (e.g., EXECUTIVE SUMMARY)
- Use bullet points (•) or dashes (-) for all lists and sub-points
- Keep formatting clean and professional
- Headings should be plain text without any special formatting

Structure the report with the following sections:

EXECUTIVE SUMMARY
• Brief overview of the fund
• Key highlights (2-3 sentences)
• Overall rating/recommendation

FUND OVERVIEW
• Fund house reputation and track record
• Investment strategy and objectives
• Target investor profile

PERFORMANCE ANALYSIS
• Historical performance evaluation
• Return analysis (absolute and risk-adjusted)
• Comparison to category benchmarks (if applicable)
• Performance consistency

RISK ASSESSMENT
• Volatility analysis
• Sharpe ratio interpretation
• Risk category (Conservative/Moderate/Aggressive)
• Downside protection

PREDICTIVE ANALYSIS
• Monte Carlo simulation insights
• Expected returns and probability
• Best and worst case scenarios
• Confidence level in predictions

INVESTMENT SUITABILITY
• Ideal investment horizon
• Suitable investor types
• Portfolio allocation suggestions
• Entry/exit strategy recommendations

STRENGTHS & WEAKNESSES
• Key advantages
• Areas of concern
• Competitive positioning

FINAL RECOMMENDATION
• Investment rating (Strong Buy/Buy/Hold/Sell)
• Risk-reward assessment
• Action items for investors

Use professional financial terminology but ensure clarity. Include specific numbers from the data. Be objective and balanced.

Fund Data:
${fundInfo}`;
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "google/gemini-2.5-flash",
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in AI report generation:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
