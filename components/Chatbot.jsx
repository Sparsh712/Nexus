"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

export default function Chatbot({ selectedFund }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "bot", text: "Hello! I am NexiBot, your AI financial assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: "bot",
                text: `I'm analyzing ${selectedFund?.name || 'the market'} for you. This is a simulated response as I don't have a backend connected yet.`
            }]);
            setLoading(false);
        }, 1000);
    };

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                {isOpen ? <X /> : <MessageCircle />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-[#181f31] border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">AI</span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">NexiBot</h3>
                                <p className="text-xs text-gray-400">Online</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                            ? 'bg-purple-600 text-white rounded-tr-none'
                                            : 'bg-gray-700 text-gray-200 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-4 py-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about stocks..."
                                    className="flex-1 bg-gray-900 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <button
                                    onClick={handleSend}
                                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
