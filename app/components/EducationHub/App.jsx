import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LearningPaths from "./LearningPaths";
import FinancialGlossary from "./FinancialGlossary";
import InvestmentCalculators from "./InvestmentCalculators";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

const initialVideos = [
  { title: "Stock Market for Beginners", videoId: "p7HKvqRI_Bo" },
  { title: "How to Invest in ETFs", videoId: "PHe0bXAIuk0" },
  { title: "Mutual Funds Explained", videoId: "1d_jYPL6uUI" },
  { title: "Cryptocurrency Investing", videoId: "9nlhmVrkv1Q" },
  { title: "What Are Bonds & How Do They Work?", videoId: "xVU4byInxk4" },
  { title: "Ethereum and Smart Contracts", videoId: "pWGLtjG-F5c" },
];

// Tabs for the Education Hub
const tabs = [
  { id: "videos", name: "Video Library", icon: "🎬" },
  { id: "courses", name: "Learning Paths", icon: "📚" },
  { id: "calculators", name: "Calculators", icon: "🧮" },
  { id: "glossary", name: "Glossary", icon: "📖" },
  { id: "news", name: "Market News", icon: "📰" },
];

const EducationHub = () => {
  const [activeTab, setActiveTab] = useState("videos");
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newsLoading, setNewsLoading] = useState(false);
  const [news, setNews] = useState([]);

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/news/latest`);
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      } else {
        // Fallback to static news if API fails
        setNews([
          {
            title: "Markets Rally on Positive Economic Data",
            summary: "Indian stock markets saw gains as manufacturing PMI beats expectations.",
            source: "Economic Times",
            timestamp: new Date().toISOString(),
            url: "https://economictimes.indiatimes.com/markets"
          },
          {
            title: "RBI Holds Rates Steady",
            summary: "The Reserve Bank of India maintains repo rate at 6.5% citing inflation concerns.",
            source: "Mint",
            timestamp: new Date().toISOString(),
            url: "https://www.livemint.com/economy"
          },
          {
            title: "Tech Stocks Lead NIFTY IT Higher",
            summary: "IT sector gains momentum with strong quarterly results from major companies.",
            source: "MoneyControl",
            timestamp: new Date().toISOString(),
            url: "https://www.moneycontrol.com/news/business/markets"
          },
          {
            title: "Cryptocurrency Market Update",
            summary: "Bitcoin and Ethereum show stability as institutional interest grows.",
            source: "CoinDesk",
            timestamp: new Date().toISOString(),
            url: "https://www.coindesk.com"
          },
          {
            title: "IPO Market Sees Strong Investor Interest",
            summary: "Recent IPOs oversubscribed as retail participation continues to grow.",
            source: "Business Standard",
            timestamp: new Date().toISOString(),
            url: "https://www.business-standard.com/markets"
          },
          {
            title: "Global Markets: Fed Decision Awaited",
            summary: "Asian markets trade mixed ahead of US Federal Reserve policy announcement.",
            source: "Reuters",
            timestamp: new Date().toISOString(),
            url: "https://www.reuters.com/markets"
          }
        ]);
      }
    } catch (err) {
      console.error("News fetch error:", err);
      // Use fallback news
      setNews([
        {
          title: "Markets Rally on Positive Economic Data",
          summary: "Indian stock markets saw gains as manufacturing PMI beats expectations.",
          source: "Economic Times",
          timestamp: new Date().toISOString(),
          url: "https://economictimes.indiatimes.com/markets"
        },
        {
          title: "RBI Policy Update",
          summary: "Reserve Bank maintains accommodative stance to support growth.",
          source: "Mint",
          timestamp: new Date().toISOString(),
          url: "https://www.livemint.com/economy"
        }
      ]);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchVideos = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a search term.");
      return;
    }
    if (!YOUTUBE_API_KEY) {
      setError("YouTube API key not configured. Showing default videos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query + " investing finance"
      )}&type=video&maxResults=6&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data.items || data.items.length === 0) throw new Error("No videos found.");
      setVideos(
        data.items.map((item) => ({
          title: item.snippet.title,
          videoId: item.id.videoId,
        }))
      );
    } catch (err) {
      setError(`Failed to fetch videos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0"></div>
      <div className="fixed top-20 left-10 w-[500px] h-[500px] bg-green-900/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-20 right-10 w-[600px] h-[600px] bg-purple-900/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-blue-300 to-purple-300 mb-6">
            Financial Education Hub
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Master the markets with courses, calculators, and expert insights.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div>
              {/* Search Section */}
              <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto mb-12 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg opacity-20 blur-md"></div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && fetchVideos()}
                  placeholder="Search financial topics (e.g. 'Options Trading')..."
                  className="relative flex-1 p-4 rounded-lg bg-[#0a0a12] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-500"
                />
                <motion.button
                  onClick={fetchVideos}
                  className="relative py-4 px-8 font-bold text-black bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Search Library
                </motion.button>
              </div>

              {loading && <div className="text-center py-10"><span className="animate-spin text-4xl inline-block">⏳</span></div>}
              {error && <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg mb-8 border border-red-500/30">{error}</div>}

              {/* VideoGrid */}
              {videos.length > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-white">Featured Videos</h2>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video, index) => (
                      <motion.div
                        key={index}
                        className="group bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all hover:border-green-500/30 hover:shadow-2xl hover:shadow-green-900/20"
                        whileHover={{ scale: 1.02 }}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="mb-4 rounded-xl overflow-hidden shadow-lg border border-black/50">
                          <iframe
                            width="100%"
                            height="200"
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            frameBorder="0"
                            allowFullScreen
                            title={video.title}
                            className="w-full"
                          />
                        </div>
                        <h3 className="font-bold text-gray-100 text-lg leading-snug group-hover:text-green-400 transition-colors">
                          {video.title}
                        </h3>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Learning Paths Tab */}
          {activeTab === "courses" && <LearningPaths />}

          {/* Calculators Tab */}
          {activeTab === "calculators" && <InvestmentCalculators />}

          {/* Glossary Tab */}
          {activeTab === "glossary" && <FinancialGlossary />}

          {/* News Tab */}
          {activeTab === "news" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-white">Latest Market News</h2>
                  <div className="h-px bg-white/10 flex-1 min-w-[100px]"></div>
                </div>
                <button
                  onClick={fetchNews}
                  disabled={newsLoading}
                  className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-sm border border-white/10"
                >
                  {newsLoading ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </div>

              {newsLoading ? (
                <div className="flex justify-center py-10">
                  <span className="animate-spin text-4xl">⏳</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {news.map((item, index) => (
                    <motion.a
                      key={index}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all flex flex-col"
                      whileHover={{ scale: 1.01 }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-1 rounded">
                          {item.source || "NEWS"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Today"}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed flex-1 line-clamp-3">
                        {item.summary}
                      </p>
                      <span className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        Read more ↗
                      </span>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Extra Spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default EducationHub;
