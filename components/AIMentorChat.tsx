'use client';

import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AIMentorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Load chat history
    const savedMessages = localStorage.getItem('finwise_chat_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm your AI Financial Mentor. I can help you with budgeting, saving tips, investment advice, and financial goals. What would you like to know?",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    // Expanded rule-based responses including general topics
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return "💰 Great question about saving! Try the 50/30/20 rule — 50% needs, 30% wants, 20% savings. Start small and be consistent.";
    }

    if (lowerMessage.includes('budget')) {
      return "📊 Budgeting is key. Track expenses, set realistic daily limits, and review weekly. Use the Daily Expenses panel to log transactions.";
    }

    if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('mutual fund')) {
      return "📈 Start with low-cost index funds or diversified mutual funds. Match asset allocation to your risk tolerance and time horizon. Consider SIPs for rupee-cost averaging.";
    }

    if (lowerMessage.includes('how') && lowerMessage.includes('start')) {
      return "🛫 To get started: set a budget, build an emergency fund (3-6 months), start a SIP in a mutual fund, and learn basic investing concepts. Ask me for a step-by-step plan.";
    }

    if (lowerMessage.includes('who') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('when') || lowerMessage.includes('where')) {
      return `I can help with that! Here's what I know:\n\n${userMessage}\n\nI'm designed to answer both finance and general questions. Would you like me to elaborate on any specific aspect?`;
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "👋 Hello! I'm your AI Mentor. I can help with finance topics AND general questions. Ask me anything!";
    }

    if (lowerMessage.includes('thank')) {
      return "😊 You're welcome! Happy to help with any question - finance or otherwise!";
    }

    // Fallback - now handles any topic
    return `I'm here to help with any question! Whether it's about finance, technology, science, or general knowledge - just ask away and I'll do my best to provide a helpful answer.`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      setIsTyping(false);
      
      // Save to localStorage
      localStorage.setItem('finwise_chat_messages', JSON.stringify(finalMessages));
    }, 1000);
  };

  const handleClearChat = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Chat cleared! How can I help you with your finances?",
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('finwise_chat_messages', JSON.stringify([welcomeMessage]));
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 dark:from-gray-800 dark:via-cyan-900/20 dark:to-teal-900/20 rounded-2xl p-6 shadow-card h-full flex flex-col border-2 border-cyan-200 dark:border-cyan-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">AI Mentor</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">● Online & Ready</p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl shadow-md ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-line font-medium">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-orange-100' : 'text-cyan-100'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-cyan-400 to-teal-400 p-3 rounded-2xl shadow-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything about finance..."
          className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-cyan-300 dark:border-cyan-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          Send
        </button>
      </div>

      <div className="mt-3 p-2 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg border border-cyan-300 dark:border-cyan-700">
        <p className="text-xs text-cyan-800 dark:text-cyan-300 font-medium">
          💡 Try asking: "How to save money?", "Investment tips", "Budget help"
        </p>
      </div>
    </div>
  );
}
