import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Cpu, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ai, MODELS } from '../services/gemini';
import { ChatMessage } from '../types';
import { Button, TextArea, Card } from './UIComponents';

export const ChatModule: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const modelName = useThinking ? MODELS.TEXT_PRO : MODELS.TEXT;
      
      // Configure thinking if enabled (only supported on certain models)
      const config: any = {};
      if (useThinking) {
        config.thinkingConfig = { thinkingBudget: 1024 }; // modest budget for demo
        config.maxOutputTokens = 4096; // ensure room for response
      }

      // We'll use generateContent for single-turn logic in this demo, 
      // but constructing a chat history string for context is a good practice if not using chat sessions.
      // For simplicity here, we send the last user message + minimal context.
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: input, // In a real app, you'd pass the conversation history here
        config
      });

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "I couldn't generate a response.",
        timestamp: Date.now(),
        isThinking: useThinking
      };

      setMessages(prev => [...prev, modelMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error processing your request.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquareIcon /> Chat Assistant
          </h2>
          <p className="text-sm text-slate-400">
            {useThinking ? "Using Gemini 2.5 Pro (Thinking Enabled)" : "Using Gemini 2.5 Flash"}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    useThinking 
                    ? 'bg-accent/20 text-accent border border-accent/50' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                }`}
            >
                <Cpu size={14} />
                {useThinking ? 'Thinking ON' : 'Thinking OFF'}
            </button>
            <Button variant="ghost" onClick={() => setMessages([])} className="p-2" title="Clear Chat">
                <Trash2 size={18} />
            </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
            <Bot size={48} className="text-slate-700" />
            <p>Start a conversation. Toggle "Thinking" for complex reasoning.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                <Sparkles size={16} className="text-primary" />
              </div>
            )}
            
            <div className={`
              max-w-[80%] rounded-2xl px-5 py-3 
              ${msg.role === 'user' 
                ? 'bg-primary text-white rounded-tr-sm' 
                : 'bg-surface border border-slate-700 text-slate-200 rounded-tl-sm shadow-sm'}
            `}>
              {msg.isThinking && (
                 <div className="flex items-center gap-2 text-xs text-accent mb-2 pb-2 border-b border-slate-700/50">
                    <Cpu size={12} />
                    <span>Reasoning Process Applied</span>
                 </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                    <Sparkles size={16} className="text-primary" />
                 </div>
                 <div className="bg-surface border border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 bg-surface">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[50px] max-h-[150px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="h-[50px] w-[50px] !p-0 flex-shrink-0"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessageSquareIcon = () => <MessageSquare size={20} className="text-primary" />;
import { MessageSquare } from 'lucide-react';
