import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, Volume2, HelpCircle, Sparkles } from 'lucide-react';

const ScholarshipChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm ScholarBot 👋 How can I help you with your scholarship application today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Stop audio when chat closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isOpen]);

  const quickQuestions = [
    "How do I register?",
    "What documents do I need?",
    "How long does verification take?",
    "How to track my application?"
  ];

  const faqCategories = [
    {
      category: "Registration",
      icon: "📝",
      questions: [
        "How do I register on the platform?",
        "What information do I need for registration?"
      ]
    },
    {
      category: "Documents",
      icon: "📄",
      questions: [
        "What documents are required?",
        "What file formats are supported?"
      ]
    },
    {
      category: "Verification",
      icon: "✅",
      questions: [
        "How does AI verification work?",
        "How long does SAG verification take?"
      ]
    },
    {
      category: "Disbursement",
      icon: "💰",
      questions: [
        "How will I receive my scholarship?",
        "What is a blockchain transaction hash?"
      ]
    }
  ];

  const sendMessage = async (text = inputMessage) => {
    if (!text.trim()) return;

    const userMessage = {
      type: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowFAQ(false);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          user_role: 'student'
        })
      });

      const data = await response.json();

      const botMessage = {
        type: 'bot',
        text: data.text_response,
        timestamp: new Date(),
        audioPath: data.audio_file_path
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again or contact support@scholarshipplatform.com",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (audioPath) => {
    if (audioPath && audioRef.current) {
      try {
        audioRef.current.src = `${API_BASE_URL}/audio/${audioPath}`;
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group animate-pulse hover:animate-none"
          aria-label="Open chat"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl transform group-hover:-translate-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Need help? Chat with us!</span>
            </div>
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100 backdrop-blur-sm">
          {/* Header with animated gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/30">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg">ScholarBot</h3>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ring-4 ring-green-400/30"></div>
                </div>
                <p className="text-xs text-blue-100 font-medium">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 relative z-10">
              <button
                onClick={() => setShowFAQ(!showFAQ)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 transform hover:scale-110"
                aria-label="Show FAQ"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-90"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* FAQ Panel with enhanced styling */}
          {showFAQ && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 border-b border-gray-200 max-h-48 overflow-y-auto">
              <h4 className="font-bold text-sm mb-3 text-gray-800 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Quick Help Topics</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {faqCategories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(cat.questions[0])}
                    className="text-left p-3 bg-white rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200 text-xs shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <p className="font-semibold text-gray-800 mt-1">{cat.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area with gradient background */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white text-gray-800 shadow-md border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <div className="flex items-center justify-between mt-2 space-x-2">
                    <span className={`text-xs font-medium ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.type === 'bot' && message.audioPath && (
                      <button
                        onClick={() => playAudio(message.audioPath)}
                        className="text-purple-600 hover:text-purple-700 transition-all duration-300 transform hover:scale-110 p-1 rounded-full hover:bg-purple-100"
                        aria-label="Play audio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-pink-600 to-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions with enhanced styling */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Quick questions:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(question)}
                    className="text-xs px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border border-blue-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 font-medium"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area with enhanced styling */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-300 bg-gray-50 hover:bg-white"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center font-medium flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Powered by AI • Available 24/7</span>
            </p>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ScholarshipChatbot;