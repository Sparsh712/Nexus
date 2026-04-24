"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

// Comprehensive financial glossary data
const glossaryData = [
    { term: "52-Week High/Low", definition: "The highest and lowest prices at which a stock has traded during the previous 52 weeks (one year).", category: "Stocks" },
    { term: "Alpha", definition: "A measure of an investment's performance relative to a benchmark index. Positive alpha indicates outperformance.", category: "Performance" },
    { term: "Asset Allocation", definition: "The distribution of investments among different asset classes such as stocks, bonds, and cash to balance risk and reward.", category: "Portfolio" },
    { term: "Ask Price", definition: "The lowest price a seller is willing to accept for a security.", category: "Trading" },
    { term: "AUM (Assets Under Management)", definition: "The total market value of assets that an investment fund manages on behalf of clients.", category: "Mutual Funds" },
    { term: "Bear Market", definition: "A market condition where prices are falling or expected to fall, typically by 20% or more from recent highs.", category: "Market" },
    { term: "Beta", definition: "A measure of a stock's volatility relative to the overall market. Beta > 1 means more volatile than market.", category: "Performance" },
    { term: "Bid Price", definition: "The highest price a buyer is willing to pay for a security.", category: "Trading" },
    { term: "Blue Chip Stocks", definition: "Shares of large, well-established, and financially stable companies with a history of reliable performance.", category: "Stocks" },
    { term: "Blockchain", definition: "A decentralized digital ledger that records transactions across many computers in a way that cannot be altered retroactively.", category: "Crypto" },
    { term: "Bond", definition: "A fixed-income instrument representing a loan made by an investor to a borrower, typically corporate or governmental.", category: "Fixed Income" },
    { term: "Book Value", definition: "The net asset value of a company, calculated as total assets minus intangible assets and liabilities.", category: "Stocks" },
    { term: "Broker", definition: "A person or firm that executes buy and sell orders for stocks and other securities on behalf of clients.", category: "Trading" },
    { term: "Bull Market", definition: "A market condition where prices are rising or expected to rise, characterized by optimism and investor confidence.", category: "Market" },
    { term: "CAGR (Compound Annual Growth Rate)", definition: "The mean annual growth rate of an investment over a specified period longer than one year.", category: "Performance" },
    { term: "Candlestick Chart", definition: "A type of price chart showing the high, low, opening, and closing prices for a security during a specific period.", category: "Technical" },
    { term: "Capital Gains", definition: "The profit realized from selling an investment for more than its purchase price.", category: "Taxation" },
    { term: "Circuit Breaker", definition: "Regulatory measures to temporarily halt trading on an exchange when prices fall too quickly.", category: "Market" },
    { term: "Compound Interest", definition: "Interest calculated on the initial principal and also on the accumulated interest from previous periods.", category: "Basics" },
    { term: "Cryptocurrency", definition: "A digital or virtual currency that uses cryptography for security and operates on decentralized blockchain networks.", category: "Crypto" },
    { term: "DeFi (Decentralized Finance)", definition: "Financial services using smart contracts on blockchains, eliminating the need for traditional intermediaries.", category: "Crypto" },
    { term: "Demat Account", definition: "An account that holds shares and securities in electronic format, eliminating the need for physical certificates.", category: "Trading" },
    { term: "Diversification", definition: "A risk management strategy that mixes different investments within a portfolio to reduce exposure to any single asset.", category: "Portfolio" },
    { term: "Dividend", definition: "A distribution of a portion of a company's earnings to shareholders, usually in cash or additional shares.", category: "Stocks" },
    { term: "Dividend Yield", definition: "The dividend per share divided by the stock price, expressed as a percentage.", category: "Stocks" },
    { term: "Dollar Cost Averaging", definition: "An investment strategy of regularly purchasing a fixed dollar amount regardless of price to reduce impact of volatility.", category: "Strategy" },
    { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization - a measure of operating performance.", category: "Fundamentals" },
    { term: "ELSS", definition: "Equity Linked Savings Scheme - a type of mutual fund that primarily invests in equity and offers tax benefits under Section 80C.", category: "Mutual Funds" },
    { term: "EMI (Equated Monthly Installment)", definition: "A fixed payment made by a borrower to a lender at a specified date each month.", category: "Loans" },
    { term: "EPS (Earnings Per Share)", definition: "A company's profit divided by the number of outstanding shares. Higher EPS indicates greater profitability.", category: "Fundamentals" },
    { term: "ETF (Exchange-Traded Fund)", definition: "A type of investment fund traded on stock exchanges, holding assets like stocks, commodities, or bonds.", category: "Mutual Funds" },
    { term: "Expense Ratio", definition: "The annual fee charged by a mutual fund or ETF, expressed as a percentage of assets under management.", category: "Mutual Funds" },
    { term: "Face Value", definition: "The nominal value of a security stated by the issuer, as opposed to its market value.", category: "Basics" },
    { term: "FII (Foreign Institutional Investor)", definition: "An investor or investment fund from outside the country that invests in a country's financial markets.", category: "Market" },
    { term: "Forex", definition: "The foreign exchange market where currencies are traded. The largest and most liquid financial market globally.", category: "Trading" },
    { term: "Fundamental Analysis", definition: "A method of evaluating securities by analyzing financial statements, industry conditions, and economic factors.", category: "Analysis" },
    { term: "Futures Contract", definition: "A standardized legal agreement to buy or sell an asset at a predetermined price at a specified time in the future.", category: "Derivatives" },
    { term: "GDP (Gross Domestic Product)", definition: "The total monetary value of all goods and services produced within a country's borders in a specific time period.", category: "Economy" },
    { term: "Hedge", definition: "An investment strategy designed to reduce the risk of adverse price movements in an asset.", category: "Strategy" },
    { term: "Index Fund", definition: "A type of mutual fund designed to track the components of a market index, like NIFTY 50 or S&P 500.", category: "Mutual Funds" },
    { term: "Inflation", definition: "The rate at which the general level of prices for goods and services rises, eroding purchasing power.", category: "Economy" },
    { term: "IPO (Initial Public Offering)", definition: "The first sale of stock by a company to the public, transitioning from private to public ownership.", category: "Stocks" },
    { term: "Large Cap", definition: "Companies with market capitalization above ₹20,000 crore, typically well-established and stable.", category: "Stocks" },
    { term: "Leverage", definition: "The use of borrowed capital to increase the potential return of an investment, also increasing risk.", category: "Trading" },
    { term: "Limit Order", definition: "An order to buy or sell a security at a specific price or better.", category: "Trading" },
    { term: "Liquidity", definition: "The ease with which an asset can be quickly bought or sold in the market without affecting its price.", category: "Market" },
    { term: "Long Position", definition: "Buying a security with the expectation that its value will increase over time.", category: "Trading" },
    { term: "LTCG (Long-Term Capital Gains)", definition: "Profits from selling assets held for more than one year, taxed at preferential rates.", category: "Taxation" },
    { term: "MACD", definition: "Moving Average Convergence Divergence - a technical indicator showing the relationship between two moving averages.", category: "Technical" },
    { term: "Margin", definition: "Borrowed money used to purchase securities, with the securities themselves serving as collateral.", category: "Trading" },
    { term: "Market Cap", definition: "The total market value of a company's outstanding shares, calculated as share price × number of shares.", category: "Stocks" },
    { term: "Market Order", definition: "An order to buy or sell a security immediately at the best available current price.", category: "Trading" },
    { term: "Mid Cap", definition: "Companies with market capitalization between ₹5,000-20,000 crore, offering growth potential with moderate risk.", category: "Stocks" },
    { term: "Moving Average", definition: "A technical indicator that smooths price data by creating a constantly updated average price.", category: "Technical" },
    { term: "Mutual Fund", definition: "An investment vehicle pooling money from multiple investors to purchase a diversified portfolio of securities.", category: "Mutual Funds" },
    { term: "NAV (Net Asset Value)", definition: "The per-unit value of a mutual fund, calculated as (Total Assets - Liabilities) / Number of Units.", category: "Mutual Funds" },
    { term: "NFT", definition: "Non-Fungible Token - a unique digital asset stored on a blockchain representing ownership of items like art or media.", category: "Crypto" },
    { term: "NIFTY 50", definition: "India's benchmark stock market index consisting of 50 diversified stocks listed on NSE.", category: "Market" },
    { term: "Option", definition: "A contract giving the buyer the right, but not obligation, to buy or sell an asset at a set price.", category: "Derivatives" },
    { term: "P/B Ratio", definition: "Price-to-Book ratio compares a stock's market value to its book value. Lower may indicate undervaluation.", category: "Fundamentals" },
    { term: "P/E Ratio", definition: "Price-to-Earnings ratio measures current share price relative to earnings per share. Used for valuation.", category: "Fundamentals" },
    { term: "PAN Card", definition: "Permanent Account Number - a ten-digit alphanumeric ID issued by Income Tax Department, required for investments.", category: "Basics" },
    { term: "Portfolio", definition: "A collection of financial investments like stocks, bonds, commodities, cash held by an individual or institution.", category: "Portfolio" },
    { term: "PPF", definition: "Public Provident Fund - a government-backed long-term savings scheme with tax benefits.", category: "Savings" },
    { term: "Put Option", definition: "A contract giving the holder the right to sell an asset at a specified price within a specific time.", category: "Derivatives" },
    { term: "Rally", definition: "A period of sustained increases in the prices of stocks, bonds, or indexes.", category: "Market" },
    { term: "Rebalancing", definition: "The process of realigning portfolio weights by periodically buying or selling assets.", category: "Portfolio" },
    { term: "Resistance", definition: "A price level at which selling pressure prevents further upward movement in a security's price.", category: "Technical" },
    { term: "ROE (Return on Equity)", definition: "A measure of financial performance calculated as net income divided by shareholders' equity.", category: "Fundamentals" },
    { term: "RSI", definition: "Relative Strength Index - a momentum indicator measuring the speed and magnitude of price changes.", category: "Technical" },
    { term: "SEBI", definition: "Securities and Exchange Board of India - the regulatory body for securities markets in India.", category: "Regulatory" },
    { term: "Sector Fund", definition: "A mutual fund that invests exclusively in businesses operating in a particular industry or sector.", category: "Mutual Funds" },
    { term: "SENSEX", definition: "The benchmark index of BSE comprising 30 financially sound and well-established companies.", category: "Market" },
    { term: "Short Selling", definition: "Selling borrowed securities with the expectation of buying them back at a lower price for profit.", category: "Trading" },
    { term: "SIP (Systematic Investment Plan)", definition: "A method of investing fixed amounts regularly in mutual funds regardless of market conditions.", category: "Mutual Funds" },
    { term: "Small Cap", definition: "Companies with market capitalization below ₹5,000 crore, offering high growth potential but higher risk.", category: "Stocks" },
    { term: "Smart Contract", definition: "Self-executing contracts with terms directly written into code on a blockchain.", category: "Crypto" },
    { term: "Stablecoin", definition: "A type of cryptocurrency designed to maintain a stable value relative to a reference asset like USD.", category: "Crypto" },
    { term: "STCG (Short-Term Capital Gains)", definition: "Profits from selling assets held for less than one year, typically taxed at higher rates.", category: "Taxation" },
    { term: "Stock Split", definition: "A corporate action dividing existing shares into multiple shares to increase liquidity.", category: "Stocks" },
    { term: "Stop-Loss Order", definition: "An order to sell a security when it reaches a certain price to limit potential losses.", category: "Trading" },
    { term: "Support", definition: "A price level at which buying pressure prevents further downward movement in a security's price.", category: "Technical" },
    { term: "TDS", definition: "Tax Deducted at Source - tax collected at the source of income by the payer.", category: "Taxation" },
    { term: "Technical Analysis", definition: "A method of evaluating securities by analyzing statistics from trading activity like price and volume.", category: "Analysis" },
    { term: "Trailing Stop", definition: "A stop order that moves with the market price, maintaining a set distance from the current price.", category: "Trading" },
    { term: "Volatility", definition: "A statistical measure of the dispersion of returns for a given security or market index.", category: "Performance" },
    { term: "Volume", definition: "The total number of shares or contracts traded for a security during a given period.", category: "Trading" },
    { term: "Wallet (Crypto)", definition: "Software or hardware used to store, send, and receive cryptocurrencies.", category: "Crypto" },
    { term: "Yield", definition: "The income return on an investment, usually expressed as an annual percentage.", category: "Basics" },
    { term: "YTD (Year-to-Date)", definition: "The period starting from the beginning of the current calendar year up to the present day.", category: "Performance" },
    { term: "Zero Coupon Bond", definition: "A bond issued at a discount to face value that doesn't pay periodic interest.", category: "Fixed Income" }
];

const categories = ["All", "Stocks", "Mutual Funds", "Crypto", "Trading", "Technical", "Fundamentals", "Market", "Portfolio", "Taxation", "Derivatives", "Performance", "Economy", "Basics"];

export default function FinancialGlossary() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [expandedTerm, setExpandedTerm] = useState(null);

    const filteredTerms = useMemo(() => {
        return glossaryData.filter(item => {
            const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.definition.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    // Group terms by first letter
    const groupedTerms = useMemo(() => {
        const groups = {};
        filteredTerms.forEach(item => {
            const letter = item.term[0].toUpperCase();
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(item);
        });
        return groups;
    }, [filteredTerms]);

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 mb-3">
                    Financial Glossary
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Look up financial terms and concepts. {glossaryData.length}+ terms at your fingertips.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-20 blur"></div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search terms (e.g., 'dividend', 'market cap')..."
                    className="relative w-full px-6 py-4 rounded-full bg-[#0a0a12]/90 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedCategory === cat
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Alphabet Quick Nav */}
            <div className="flex flex-wrap justify-center gap-1 text-xs">
                {alphabet.map(letter => (
                    <button
                        key={letter}
                        onClick={() => {
                            const element = document.getElementById(`letter-${letter}`);
                            element?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${groupedTerms[letter]
                                ? "bg-white/10 text-white hover:bg-yellow-500/30"
                                : "bg-white/5 text-gray-600 cursor-not-allowed"
                            }`}
                        disabled={!groupedTerms[letter]}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* Results Count */}
            <div className="text-center text-sm text-gray-500">
                Showing {filteredTerms.length} of {glossaryData.length} terms
            </div>

            {/* Terms List */}
            <div className="space-y-6 max-w-4xl mx-auto">
                {Object.entries(groupedTerms).sort().map(([letter, terms]) => (
                    <div key={letter} id={`letter-${letter}`}>
                        <h3 className="text-2xl font-bold text-yellow-400 mb-3 border-b border-white/10 pb-2">
                            {letter}
                        </h3>
                        <div className="space-y-2">
                            {terms.map((item, idx) => (
                                <motion.div
                                    key={item.term}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedTerm(expandedTerm === item.term ? null : item.term)}
                                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-white">{item.term}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                                                {item.category}
                                            </span>
                                        </div>
                                        <span className={`text-gray-500 transition-transform ${expandedTerm === item.term ? "rotate-180" : ""}`}>
                                            ▼
                                        </span>
                                    </button>

                                    {expandedTerm === item.term && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4"
                                        >
                                            <p className="text-gray-300 leading-relaxed">
                                                {item.definition}
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filteredTerms.length === 0 && (
                <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p className="text-gray-400">No terms found matching your search.</p>
                </div>
            )}
        </div>
    );
}
