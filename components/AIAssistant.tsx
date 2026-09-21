'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, Loader2, MessageSquare, Lightbulb, Trash2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  "Quels articles réapprovisionner ?",
  "Comment améliorer ma marge ?",
  "Meilleures ventes du mois ?",
  "Articles en rupture ?",
  "Idées pour écouler les invendus ?",
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reponse,
          timestamp: new Date(),
        }]);
        if (data.context?.stats && !suggestions.length) {
          const { getSuggestedQuestions } = await import('@/lib/ai-assistant');
          const ctx = {
            articles: data.context.stats ? [] : undefined,
            stats: data.context.stats,
            userName: 'Commerçante',
          };
          setSuggestions(getSuggestedQuestions(ctx));
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || 'Erreur, réessayez.',
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erreur de connexion.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleSuggestionClick = (q: string) => {
    handleSend(q);
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) inputRef.current?.focus(); }}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all touch-manipulation"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant IA'}
      >
        {isOpen ? <X className="h-7 w-7" /> : <Bot className="h-7 w-7" />}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">IA</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 right-4 sm:max-w-md mx-auto z-50 bg-white rounded-2xl border shadow-2xl overflow-hidden animate-slide-up" style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Agent de ma Boutique</p>
                <p className="text-xs text-gray-500">Conseiller stock & ventes</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white rounded-xl touch-manipulation">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '50vh' }}>
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">Bonjour ! Je suis votre assistant IA pour Ma Boutique.</p>
                <p className="text-xs mt-1">Posez-moi une question sur votre stock, vos prix, vos ventes...</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md flex items-start space-x-2'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                      <Bot className="h-4 w-4 text-white mx-auto my-auto" />
                    </div>
                  )}
                  <div className={`text-sm ${msg.role === 'user' ? '' : 'text-gray-800'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length > 0 && !loading && (
            <div className="px-4 pb-2 border-t">
              <p className="text-xs text-gray-500 mb-2 px-1">Suggestions :</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(q)}
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full text-gray-700 hover:bg-blue-50 hover:border-blue-200 touch-manipulation"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white/50 backdrop-blur-sm sticky bottom-0">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={1}
                disabled={loading}
                style={{ minHeight: '48px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl text-white touch-manipulation active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button onClick={clearChat} className="text-xs text-gray-400 hover:text-gray-600 flex items-center space-x-1">
                <Trash2 className="h-3 w-3" />
                <span>Effacer</span>
              </button>
              <span className="text-[10px] text-gray-400">Entrée pour envoyer</span>
            </div>
          </form>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}