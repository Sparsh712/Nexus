"use client";

import { useState } from "react";

const Chatbot = ({ selectedFund }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  
  // Format AI response text into clean numbered points
  const formatResponse = (text) => {
    // Remove any <think> tags and their content
    text = text.replace(/<think>.*?<\/think>/gs, "");
    
    // Split into lines and clean up
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line);
      
    // Ensure proper numbering
    return lines.map((line, index) => {
      // If line already starts with a number, leave it
      if (/^\d+\./.test(line)) return line;
      // Otherwise, add number
      return `${index + 1}. ${line}`;
    }).join('\n');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const prompt = selectedFund
      ? `Context: Discussing ${selectedFund.name} (${selectedFund.code}).\nQuestion: ${input}\n\nProvide a clear, concise analysis or advice about this investment, focusing on the specific query. Format the response in 2-5 key points. ${webSearchEnabled ? 'Use current market data and recent information when available.' : ''}`
      : `Question: ${input}\n\nProvide general investment guidance or mutual fund advice, formatted in 2-5 key points. Focus on education and clarity. ${webSearchEnabled ? 'Include recent market trends and current information when relevant.' : ''}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt,
          enableWebSearch: webSearchEnabled 
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Chat API error:', response.status, errorData);
        throw new Error(errorData || "Failed to get response");
      }

      const reader = response.body.getReader();
      let botResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        botResponse += chunk;
        
        // Update the messages in real-time as chunks arrive
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage?.role === "assistant") {
            lastMessage.content = botResponse;
          } else {
            newMessages.push({ role: "assistant", content: botResponse });
          }
          
          return newMessages;
        });
      }

      // Format the response into clean numbered points
      const cleanedResponse = formatResponse(botResponse);

      // Update with final formatted response
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === "assistant") {
          newMessages[newMessages.length - 1].content = cleanedResponse;
        }
        return newMessages;
      });

    } catch (error) {
      console.error("Chat error:", error);
      
      let errorMessage = "Oops! Something went wrong. Please try again in a moment.";
      
      try {
        const errorData = error.message && error.message.startsWith('{')
          ? JSON.parse(error.message)
          : null;

        if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (error.message === "Failed to fetch") {
          errorMessage = "Unable to connect to the chat service. Please check your internet connection.";
        }
      } catch (e) {
        console.error("Error parsing error message:", e);
      }

      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-linear-to-r from-purple-600 to-cyan-500 rounded-full text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="bg-[#181f31] rounded-xl shadow-lg w-96 h-[490px] flex flex-col border border-gray-700">
          <div className="flex justify-between items-center p-4 bg-linear-to-r from-[#0d1020] to-[#0b0b12] rounded-t-xl border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h3 className="text-white font-semibold">Investment Assistant</h3>
              {webSearchEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 0V3m-9 9a9 9 0 019-9" />
                  </svg>
                  Live Data
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                  webSearchEnabled 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
                title={webSearchEnabled ? "Disable web search" : "Enable web search"}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Web
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-[#181f31] text-white">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Ask me about {selectedFund ? selectedFund.name : "investments"}!
                {webSearchEnabled && (
                  <span className="block mt-1 text-xs text-green-400">
                    📡 Live market data enabled
                  </span>
                )}
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <span
                    className={`inline-block p-3 rounded-lg whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-linear-to-r from-purple-600 to-cyan-500"
                        : "bg-[#232b44]"
                    }`}
                  >
                    {msg.content}
                  </span>
                </div>
              ))
            )}
            {loading && (
              <div className="text-left mb-3">
                <span className="inline-block p-3 bg-[#232b44] rounded-lg text-gray-300">
                  Thinking...
                </span>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-700 bg-[#181f31] rounded-b-xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-3 bg-[#232b44] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Type your question..."
              rows="2"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className={`mt-2 w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-all transform ${
                loading
                  ? "opacity-50 cursor-not-allowed bg-gray-600"
                  : "bg-linear-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 hover:scale-[1.02]"
              }`}
            >
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;