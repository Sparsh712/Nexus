"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Learning course data organized by difficulty level
const learningPathsData = {
    beginner: {
        title: "Beginner",
        description: "Start your investment journey with the fundamentals",
        icon: "🌱",
        color: "from-green-400 to-emerald-500",
        modules: [
            {
                id: "b1",
                title: "What is the Stock Market?",
                duration: "10 min",
                content: `The stock market is a marketplace where buyers and sellers trade shares of publicly listed companies. When you buy a stock, you're purchasing a small piece of ownership in that company.

**Key Concepts:**
- **Stocks/Shares**: Units of ownership in a company
- **Stock Exchange**: Platform where stocks are traded (e.g., NSE, BSE)
- **Bull Market**: When prices are rising
- **Bear Market**: When prices are falling

**Why Companies Issue Stocks:**
Companies sell shares to raise capital for expansion, research, or paying off debt. In return, shareholders may receive dividends and benefit from price appreciation.`,
                quiz: [
                    { q: "What does buying a stock mean?", options: ["Lending money to a company", "Owning a piece of the company", "Buying company products", "None of the above"], answer: 1 },
                    { q: "What is a Bull Market?", options: ["Prices falling", "Prices rising", "Market closed", "Volatile market"], answer: 1 }
                ]
            },
            {
                id: "b2",
                title: "Understanding Mutual Funds",
                duration: "12 min",
                content: `A mutual fund pools money from many investors to invest in a diversified portfolio of stocks, bonds, or other securities.

**Types of Mutual Funds:**
- **Equity Funds**: Invest primarily in stocks
- **Debt Funds**: Invest in bonds and fixed income
- **Hybrid Funds**: Mix of equity and debt
- **Index Funds**: Track a market index like NIFTY 50

**Benefits:**
- Professional management
- Diversification
- Liquidity
- Affordable entry point

**NAV (Net Asset Value):**
The price per unit of a mutual fund, calculated daily based on the total value of the fund's assets.`,
                quiz: [
                    { q: "What does NAV stand for?", options: ["Net Annual Value", "Net Asset Value", "New Asset Value", "National Asset Value"], answer: 1 },
                    { q: "Which fund type invests mainly in stocks?", options: ["Debt Funds", "Equity Funds", "Liquid Funds", "Gold Funds"], answer: 1 }
                ]
            },
            {
                id: "b3",
                title: "Introduction to Cryptocurrency",
                duration: "15 min",
                content: `Cryptocurrency is a digital or virtual currency that uses cryptography for security and operates on decentralized networks called blockchains.

**Popular Cryptocurrencies:**
- **Bitcoin (BTC)**: The first and largest cryptocurrency
- **Ethereum (ETH)**: Platform for smart contracts and dApps
- **Stablecoins**: Pegged to fiat currencies (USDT, USDC)

**Key Terms:**
- **Blockchain**: Distributed ledger recording all transactions
- **Wallet**: Software/hardware to store crypto
- **Mining**: Process of validating transactions
- **DeFi**: Decentralized Finance applications

**Risks:**
High volatility, regulatory uncertainty, security concerns`,
                quiz: [
                    { q: "What technology powers cryptocurrencies?", options: ["Cloud computing", "Blockchain", "Artificial Intelligence", "Virtual Reality"], answer: 1 },
                    { q: "What is Bitcoin?", options: ["A bank", "A cryptocurrency", "A stock exchange", "A mutual fund"], answer: 1 }
                ]
            },
            {
                id: "b4",
                title: "Risk and Return Basics",
                duration: "8 min",
                content: `Every investment involves a trade-off between risk and potential return. Understanding this relationship is fundamental to investing.

**Risk Types:**
- **Market Risk**: Overall market fluctuations
- **Inflation Risk**: Returns not keeping pace with inflation
- **Liquidity Risk**: Difficulty selling an investment
- **Credit Risk**: Issuer defaulting on payments

**Risk-Return Relationship:**
Generally, higher potential returns come with higher risk. Safe investments (like FDs) offer lower returns, while stocks offer higher potential returns but more volatility.

**Diversification:**
Spreading investments across different assets to reduce overall risk.`,
                quiz: [
                    { q: "What does diversification help reduce?", options: ["Returns", "Risk", "Taxes", "Fees"], answer: 1 },
                    { q: "Higher returns usually mean:", options: ["Lower risk", "Higher risk", "No risk", "Fixed returns"], answer: 1 }
                ]
            },
            {
                id: "b5",
                title: "Setting Financial Goals",
                duration: "10 min",
                content: `Clear financial goals are the foundation of any investment strategy.

**SMART Goals:**
- **S**pecific: Clear and well-defined
- **M**easurable: Quantifiable targets
- **A**chievable: Realistic expectations
- **R**elevant: Aligned with your life plans
- **T**ime-bound: Set deadlines

**Common Financial Goals:**
- Emergency fund (6 months expenses)
- Retirement planning
- Children's education
- Home purchase
- Wealth building

**Investment Horizon:**
Short-term (< 3 years), Medium-term (3-7 years), Long-term (> 7 years)`,
                quiz: [
                    { q: "How many months of expenses should an emergency fund cover?", options: ["1 month", "3 months", "6 months", "12 months"], answer: 2 },
                    { q: "What does the 'T' in SMART goals stand for?", options: ["Tactical", "Time-bound", "Transparent", "Technical"], answer: 1 }
                ]
            }
        ]
    },
    intermediate: {
        title: "Intermediate",
        description: "Deepen your knowledge with advanced strategies",
        icon: "📈",
        color: "from-blue-400 to-indigo-500",
        modules: [
            {
                id: "i1",
                title: "Fundamental Analysis",
                duration: "20 min",
                content: `Fundamental analysis evaluates a company's intrinsic value by examining financial statements and economic factors.

**Key Financial Ratios:**
- **P/E Ratio**: Price / Earnings per Share
- **P/B Ratio**: Price / Book Value per Share
- **ROE**: Return on Equity
- **Debt-to-Equity**: Total Debt / Shareholders' Equity
- **EPS**: Earnings Per Share

**Financial Statements:**
1. **Income Statement**: Revenue, expenses, profit
2. **Balance Sheet**: Assets, liabilities, equity
3. **Cash Flow Statement**: Operating, investing, financing activities

**Valuation Methods:**
- Discounted Cash Flow (DCF)
- Comparable Company Analysis
- Dividend Discount Model`,
                quiz: [
                    { q: "What does P/E ratio measure?", options: ["Price to Earnings", "Profit to Expenses", "Price to Equity", "Performance to Efficiency"], answer: 0 },
                    { q: "Which statement shows a company's assets and liabilities?", options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Annual Report"], answer: 1 }
                ]
            },
            {
                id: "i2",
                title: "Technical Analysis Basics",
                duration: "25 min",
                content: `Technical analysis uses historical price and volume data to predict future price movements.

**Chart Types:**
- **Line Chart**: Simple price trend
- **Candlestick Chart**: Open, High, Low, Close (OHLC)
- **Bar Chart**: Similar to candlestick

**Key Indicators:**
- **Moving Averages (MA)**: SMA, EMA for trend identification
- **RSI (Relative Strength Index)**: Overbought/oversold levels
- **MACD**: Trend and momentum indicator
- **Bollinger Bands**: Volatility indicator

**Support & Resistance:**
- Support: Price level where buying pressure prevents further decline
- Resistance: Price level where selling pressure prevents further rise

**Chart Patterns:**
Head and Shoulders, Double Top/Bottom, Triangles, Flags`,
                quiz: [
                    { q: "What does RSI stand for?", options: ["Real Stock Index", "Relative Strength Index", "Return on Stock Investment", "Risk Security Indicator"], answer: 1 },
                    { q: "What is a support level?", options: ["Where prices tend to stop falling", "Where prices tend to stop rising", "Maximum price", "Average price"], answer: 0 }
                ]
            },
            {
                id: "i3",
                title: "Portfolio Construction",
                duration: "18 min",
                content: `Building a well-balanced portfolio requires strategic asset allocation based on your goals and risk tolerance.

**Asset Classes:**
- Equities (Stocks)
- Fixed Income (Bonds)
- Real Estate
- Commodities (Gold, Silver)
- Cash and Equivalents

**Asset Allocation Strategies:**
- **Age-based**: 100 - Age = Equity % (traditional rule)
- **Goal-based**: Allocate based on investment horizon
- **Risk-based**: Match allocation to risk tolerance

**Rebalancing:**
Periodically adjusting portfolio back to target allocation as market movements change proportions.

**Core-Satellite Approach:**
- Core: Low-cost index funds (70-80%)
- Satellite: Active investments for alpha (20-30%)`,
                quiz: [
                    { q: "What is rebalancing?", options: ["Selling all investments", "Adjusting back to target allocation", "Adding more funds", "Changing brokers"], answer: 1 },
                    { q: "In age-based allocation, if you're 30, what % should be in equity?", options: ["30%", "50%", "70%", "100%"], answer: 2 }
                ]
            },
            {
                id: "i4",
                title: "Tax-Efficient Investing",
                duration: "15 min",
                content: `Understanding tax implications can significantly impact your investment returns.

**Capital Gains Tax (India):**
- **Short-term (< 1 year)**: 15% for equity, slab rate for others
- **Long-term (≥ 1 year)**: 10% above ₹1 lakh for equity

**Tax-Saving Instruments:**
- ELSS Mutual Funds (Section 80C)
- PPF (Public Provident Fund)
- NPS (National Pension System)
- Tax-free bonds

**Strategies:**
- Hold investments for > 1 year for lower tax
- Harvest losses to offset gains
- Use SIP for rupee cost averaging
- Maximize Section 80C deductions`,
                quiz: [
                    { q: "What is the LTCG tax rate for equity above ₹1 lakh?", options: ["5%", "10%", "15%", "20%"], answer: 1 },
                    { q: "Which is a tax-saving investment under 80C?", options: ["Regular savings", "ELSS Funds", "Corporate FDs", "Crypto"], answer: 1 }
                ]
            },
            {
                id: "i5",
                title: "Understanding Market Cycles",
                duration: "12 min",
                content: `Markets move in cycles influenced by economic conditions, investor sentiment, and global events.

**Four Phases:**
1. **Accumulation**: Smart money buys, prices low
2. **Markup**: Prices rise, public participation increases
3. **Distribution**: Smart money sells, prices peak
4. **Markdown**: Prices fall, fear dominates

**Economic Indicators:**
- GDP growth rate
- Inflation (CPI, WPI)
- Interest rates
- Unemployment rate
- Corporate earnings

**Sentiment Indicators:**
- VIX (Volatility Index)
- Put/Call ratio
- Advance/Decline ratio`,
                quiz: [
                    { q: "In which phase does smart money typically buy?", options: ["Markup", "Distribution", "Accumulation", "Markdown"], answer: 2 },
                    { q: "What does VIX measure?", options: ["Stock prices", "Market volatility", "Trading volume", "Company earnings"], answer: 1 }
                ]
            }
        ]
    },
    advanced: {
        title: "Advanced",
        description: "Master complex strategies and market dynamics",
        icon: "🎯",
        color: "from-purple-400 to-pink-500",
        modules: [
            {
                id: "a1",
                title: "Options Trading Fundamentals",
                duration: "30 min",
                content: `Options are derivative contracts giving the right (not obligation) to buy or sell an asset at a predetermined price.

**Options Basics:**
- **Call Option**: Right to buy
- **Put Option**: Right to sell
- **Strike Price**: Agreed transaction price
- **Premium**: Cost of the option
- **Expiry**: Contract end date

**Options Strategies:**
- **Covered Call**: Own stock + sell call
- **Protective Put**: Own stock + buy put
- **Straddle**: Buy call + put at same strike
- **Iron Condor**: Sell OTM put + call, buy further OTM options

**Greeks:**
- Delta: Price sensitivity to underlying
- Gamma: Rate of delta change
- Theta: Time decay
- Vega: Volatility sensitivity`,
                quiz: [
                    { q: "What does a Call option give you?", options: ["Right to sell", "Right to buy", "Obligation to buy", "Obligation to sell"], answer: 1 },
                    { q: "What does Theta measure?", options: ["Price sensitivity", "Time decay", "Volatility", "Interest rates"], answer: 1 }
                ]
            },
            {
                id: "a2",
                title: "Derivatives and Futures",
                duration: "25 min",
                content: `Futures are standardized contracts to buy/sell an asset at a future date at a predetermined price.

**Futures vs Options:**
- Futures: Obligation to transact
- Options: Right, not obligation

**Uses of Futures:**
- **Hedging**: Protect against price movements
- **Speculation**: Profit from price predictions
- **Arbitrage**: Exploit price differentials

**Key Concepts:**
- **Margin**: Initial deposit required
- **Mark-to-Market**: Daily settlement
- **Contango**: Futures > Spot price
- **Backwardation**: Futures < Spot price

**Index Futures:**
NIFTY Futures, Bank NIFTY Futures allow exposure to entire indices.`,
                quiz: [
                    { q: "What is the key difference between futures and options?", options: ["Futures are free", "Futures are obligatory", "Options are obligatory", "No difference"], answer: 1 },
                    { q: "What is Contango?", options: ["Futures < Spot", "Futures > Spot", "Futures = Spot", "Market crash"], answer: 1 }
                ]
            },
            {
                id: "a3",
                title: "Algorithmic Trading Introduction",
                duration: "20 min",
                content: `Algorithmic trading uses computer programs to execute trades based on predefined rules.

**Types of Algo Strategies:**
- **Trend Following**: Moving average crossovers
- **Mean Reversion**: Betting on price return to average
- **Arbitrage**: Exploiting price differences
- **Market Making**: Providing liquidity for spread
- **Momentum**: Trading based on price momentum

**Components:**
1. Strategy logic
2. Risk management rules
3. Execution engine
4. Backtesting framework

**Backtesting:**
Testing strategies on historical data to validate performance before live trading.

**Important Metrics:**
- Sharpe Ratio, Sortino Ratio
- Maximum Drawdown
- Win Rate, Risk-Reward Ratio`,
                quiz: [
                    { q: "What is backtesting?", options: ["Testing strategies on historical data", "Testing hardware", "Customer feedback", "Beta testing"], answer: 0 },
                    { q: "Which strategy bets on price returning to average?", options: ["Trend Following", "Mean Reversion", "Momentum", "Arbitrage"], answer: 1 }
                ]
            },
            {
                id: "a4",
                title: "Global Macro Investing",
                duration: "22 min",
                content: `Global macro investing focuses on large economic and political events to make investment decisions.

**Key Factors:**
- Central bank policies (Fed, RBI, ECB)
- Geopolitical events
- Currency movements
- Commodity cycles
- Trade policies

**Asset Classes:**
- Currencies (Forex)
- Government bonds
- Commodities
- Equity indices

**Analysis Framework:**
1. Identify macro trends
2. Analyze policy implications
3. Select affected asset classes
4. Construct positions
5. Manage risk

**Famous Global Macro Trades:**
- George Soros shorting British Pound (1992)
- Carry trades exploiting interest rate differentials`,
                quiz: [
                    { q: "Global macro investing focuses on:", options: ["Individual stocks", "Large economic events", "Technical analysis only", "Day trading"], answer: 1 },
                    { q: "Who is famous for shorting the British Pound?", options: ["Warren Buffett", "George Soros", "Ray Dalio", "Peter Lynch"], answer: 1 }
                ]
            },
            {
                id: "a5",
                title: "Behavioral Finance",
                duration: "18 min",
                content: `Behavioral finance studies how psychological biases affect investment decisions.

**Common Biases:**
- **Loss Aversion**: Losses hurt more than equivalent gains feel good
- **Confirmation Bias**: Seeking information that confirms beliefs
- **Anchoring**: Over-relying on first piece of information
- **Herd Mentality**: Following the crowd
- **Overconfidence**: Overestimating own abilities
- **Recency Bias**: Overweighting recent events

**Market Implications:**
- Price bubbles and crashes
- Momentum and reversal effects
- Value premium anomaly

**Overcoming Biases:**
1. Follow a systematic investment process
2. Maintain an investment journal
3. Set predetermined exit rules
4. Seek contrary opinions
5. Take breaks during volatile markets`,
                quiz: [
                    { q: "What is loss aversion?", options: ["Fear of investing", "Losses hurt more than gains feel good", "Avoiding all risk", "Selling at loss"], answer: 1 },
                    { q: "What is herd mentality?", options: ["Independent thinking", "Following the crowd", "Contrarian investing", "Long-term holding"], answer: 1 }
                ]
            }
        ]
    }
};

export default function LearningPaths() {
    const [selectedPath, setSelectedPath] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [progress, setProgress] = useState({});
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // Load progress from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("nexus_learning_progress");
        if (saved) {
            setProgress(JSON.parse(saved));
        }
    }, []);

    // Save progress to localStorage
    const saveProgress = (moduleId, completed) => {
        const newProgress = { ...progress, [moduleId]: completed };
        setProgress(newProgress);
        localStorage.setItem("nexus_learning_progress", JSON.stringify(newProgress));
    };

    const getPathProgress = (pathKey) => {
        const modules = learningPathsData[pathKey].modules;
        const completed = modules.filter(m => progress[m.id]).length;
        return Math.round((completed / modules.length) * 100);
    };

    const handleQuizSubmit = () => {
        setQuizSubmitted(true);
        const quiz = selectedModule.quiz;
        const correct = quiz.filter((q, i) => quizAnswers[i] === q.answer).length;
        if (correct === quiz.length) {
            saveProgress(selectedModule.id, true);
        }
    };

    const resetQuiz = () => {
        setQuizAnswers({});
        setQuizSubmitted(false);
        setShowQuiz(false);
    };

    // Path selection view
    if (!selectedPath) {
        return (
            <div className="space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 mb-3">
                        Learning Paths
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Choose your learning journey. Complete modules and quizzes to track your progress.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(learningPathsData).map(([key, path]) => (
                        <motion.div
                            key={key}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedPath(key)}
                            className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                        >
                            <div className="text-4xl mb-4">{path.icon}</div>
                            <h3 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${path.color} mb-2`}>
                                {path.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">{path.description}</p>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{path.modules.length} modules</span>
                                    <span>{getPathProgress(key)}% complete</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${path.color} transition-all duration-500`}
                                        style={{ width: `${getPathProgress(key)}%` }}
                                    />
                                </div>
                            </div>

                            <button className={`w-full py-2 rounded-lg bg-gradient-to-r ${path.color} text-white text-sm font-semibold`}>
                                {getPathProgress(key) > 0 ? "Continue Learning" : "Start Learning"}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    const currentPath = learningPathsData[selectedPath];

    // Module selection view
    if (!selectedModule) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedPath(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    ← Back to Paths
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl">{currentPath.icon}</span>
                    <div>
                        <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${currentPath.color}`}>
                            {currentPath.title} Path
                        </h2>
                        <p className="text-gray-400 text-sm">{currentPath.modules.length} modules • {getPathProgress(selectedPath)}% complete</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {currentPath.modules.map((module, idx) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => { setSelectedModule(module); setShowQuiz(false); setQuizAnswers({}); setQuizSubmitted(false); }}
                            className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-4 ${progress[module.id]
                                    ? "bg-green-900/20 border-green-500/30"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${progress[module.id] ? "bg-green-500 text-black" : "bg-white/10 text-white"
                                }`}>
                                {progress[module.id] ? "✓" : idx + 1}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">{module.title}</h3>
                                <p className="text-xs text-gray-500">{module.duration} read</p>
                            </div>
                            <span className="text-gray-500">→</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    // Module content view
    return (
        <div className="space-y-6">
            <button
                onClick={() => { setSelectedModule(null); resetQuiz(); }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                ← Back to Modules
            </button>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{selectedModule.title}</h2>
                    <span className="text-xs text-gray-500 bg-white/10 px-3 py-1 rounded-full">
                        {selectedModule.duration}
                    </span>
                </div>

                {!showQuiz ? (
                    <>
                        <div className="prose prose-invert max-w-none mb-8">
                            {selectedModule.content.split('\n\n').map((para, i) => (
                                <p key={i} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
                                    {para.split('**').map((part, j) =>
                                        j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
                                    )}
                                </p>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowQuiz(true)}
                            className={`w-full py-3 rounded-xl bg-gradient-to-r ${currentPath.color} text-white font-semibold`}
                        >
                            Take Quiz to Complete Module →
                        </button>
                    </>
                ) : (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Quiz: Test Your Knowledge</h3>

                        {selectedModule.quiz.map((q, i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-4">
                                <p className="text-white font-medium mb-3">{i + 1}. {q.q}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, j) => (
                                        <button
                                            key={j}
                                            onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [i]: j })}
                                            disabled={quizSubmitted}
                                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${quizSubmitted
                                                    ? j === q.answer
                                                        ? "bg-green-500/30 border-green-500 text-green-300"
                                                        : quizAnswers[i] === j
                                                            ? "bg-red-500/30 border-red-500 text-red-300"
                                                            : "bg-white/5 text-gray-400"
                                                    : quizAnswers[i] === j
                                                        ? `bg-gradient-to-r ${currentPath.color} text-white`
                                                        : "bg-white/5 hover:bg-white/10 text-gray-300"
                                                } border border-transparent`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!quizSubmitted ? (
                            <button
                                onClick={handleQuizSubmit}
                                disabled={Object.keys(quizAnswers).length !== selectedModule.quiz.length}
                                className={`w-full py-3 rounded-xl bg-gradient-to-r ${currentPath.color} text-white font-semibold disabled:opacity-50`}
                            >
                                Submit Answers
                            </button>
                        ) : (
                            <div className="text-center space-y-4">
                                {selectedModule.quiz.every((q, i) => quizAnswers[i] === q.answer) ? (
                                    <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
                                        <p className="text-green-400 text-lg font-semibold">🎉 Perfect Score! Module Completed!</p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4">
                                        <p className="text-yellow-400">Some answers were incorrect. Review and try again!</p>
                                    </div>
                                )}
                                <button
                                    onClick={resetQuiz}
                                    className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {progress[selectedModule.id] && (
                <div className="text-center text-green-400 text-sm">
                    ✓ You've completed this module
                </div>
            )}
        </div>
    );
}
