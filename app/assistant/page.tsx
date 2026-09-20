'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Send, Loader2, Mic, X, Menu, MessageSquare, Brain, Zap, Shield } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
};

type Suggestion = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
};

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setLoading(true);

    const userMsg = { id: `user-${Date.now()}`, role: 'user' as const, content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg = { id: `assistant-${Date.now()}`, role: 'assistant' as const, content: data.response, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);

        // Update suggestions based on response
        const lower = data.response.toLowerCase();
        let newSuggs: Array<{label: string; prompt: string; icon: React.ReactNode}> = [];
        if (lower.includes('marge') || lower.includes('profit') || lower.includes('bénéfice')) {
          newSuggs.push({label: "Améliorer ma marge", prompt: "Comment puis-je augmenter ma marge sur cet article ?", icon: <Sparkles className="h-4 w-4" />});
          newSuggs.push({label: "Analyse des coûts", prompt: "Quels sont mes coûts principaux qui réduisent ma marge ?", icon: <Sparkles className="h-4 w-4" />});
        }
        if (lower.includes('rupture') || lower.includes('stock') || lower.includes('réapprovisionner')) {
          newSuggs.push({label: "Articles à réapprovisionner", prompt: "Quels articles dois-je commander cette semaine ?", icon: <Package className="h-4 w-4" />});
          newSuggs.push({label: "Prévision des ventes", prompt: "Quelle quantité devrais-je prévoir pour le mois prochain ?", icon: <Package className="h-4 w-4" />});
        }
        if (lower.includes('vente') || lower.includes('ca') || lower.includes('chiffre d\'affaires')) {
          newSuggs.push({label: "Booster mes ventes", prompt: "Quelles actions puis-je mettre en place pour augmenter mes ventes ?", icon: <TrendingUp className="h-4 w-4" />});
          newSuggs.push({label: "Meilleures ventes", prompt: "Quels sont mes articles les plus vendus ce mois-ci ?", icon: <TrendingUp className="h-4 w-4" />});
        }
        if (lower.includes('prix') || lower.includes('tarif')) {
          newSuggs.push({label: "Fixer un bon prix", prompt: "Comment déterminer le prix de vente optimal pour un nouveau produit ?", icon: <DollarSign className="h-4 w-4" />});
          newSuggs.push({label: "Analyse de la concurrence", prompt: "Quels sont les prix pratiqués par la concurrence pour des produits similaires ?", icon: <DollarSign className="h-4 w-4" />});
        }
        if (lower.includes('whatsapp') || lower.includes('instagram') || lower.includes('marketing')) {
          newSuggs.push({label: "Idées marketing", prompt: "Donne-moi 3 idées de promotions WhatsApp pour attirer plus de clients.", icon: <MessageSquare className="h-4 w-4" />});
          newSuggs.push({label: "Créer une offre spéciale", prompt: "Comment créer une offre « 2 pour le prix d'1 » efficace ?", icon: <Sparkles className="h-4 w-4" />});
        }
        if (newSuggs.length === 0) {
          newSuggs = [
            {label: "Stock à réapprovisionner", prompt: "Quels articles dois-je réapprovisionner cette semaine ?", icon: <Package className="h-4 w-4" />},
            {label: "Améliorer mes marges", prompt: "Comment améliorer ma marge globale ?", icon: <Sparkles className="h-4 w-4" />},
            {label: "Meilleures ventes du mois", prompt: "Quels sont mes meilleures ventes du mois ?", icon: <TrendingUp className="h-4 w-4" />}
          ];
        }
        setSuggestions(newSuggs.slice(0, 6));
      } else {
        setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.error || 'Erreur', timestamp: new Date() }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: 'Erreur de connexion', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => handleSend(prompt);

  const handleClear = () => { setMessages([]); setSuggestions([]); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) handleSend(input);
  }

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header Expert */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/stock" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Expert Ma Boutique</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Powered by GLM 4.5 Flash</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700 dark:bg-green-200 dark:text-green-800' : 'bg-orange-100 text-orange-700 dark:bg-orange-200 dark:text-orange-800'}`}>
                {isOnline ? <Zap className="h-3 w-3" /> : <span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />}
                <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar - Horizontal Scroll */}
      <div className="px-4 pb-4 -mx-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center space-x-2 min-w-max pb-2">
          {suggestions.map((sugg, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(sugg.prompt)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-400 active:bg-blue-100 dark:active:bg-blue-200 touch-manipulation transition-all disabled:opacity-50 flex-shrink-0"
            >
              <span className="text-lg">{sugg.icon}</span>
              <span>{sugg.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4">
        <div className="flex-1 overflow-y-auto space-y-6 pb-4" style={{ paddingBottom: '120px' }}>
          {messages.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Bonjour ! Je suis votre expert.</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">Je connais votre stock, vos ventes et vos marges. Posez-moi n'importe quelle question business.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                {suggestions.slice(0, 3).map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sugg.prompt)}
                    className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-left hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400 dark:hover:bg-blue-400 touch-manipulation transition-all"
                  >
                    <p className="text-lg">{sugg.icon}</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-600 mt-1">{sugg.label}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[85%] ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-sm border border-gray-300 dark:border-gray-600 flex items-start space-x-3'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 flex-shrink-0 mt-0.5 flex items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className={`p-4 ${msg.role === 'user' ? 'pr-4' : 'pl-4'}`}>
                      <p className={`${msg.streaming ? 'whitespace-pre-wrap text-base leading-relaxed text-gray-600' : 'whitespace-pre-wrap text-base leading-relaxed text-gray-600 dark:text-gray-400'}`}>
                        {msg.content}
                      </p>
                      {msg.streaming && (
                        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                      )}
                      <p className={`${msg.role === 'user' ? 'text-xs mt-2 text-blue-100 dark:text-blue-100' : 'text-xs mt-2 text-gray-400 dark:text-gray-600'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 pb-4">
          <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-300 dark:border-gray-600 p-3 shadow-lg">
            <div className="flex items-end space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loading ? "Réflexion en cours..." : "Posez votre question..."}
                className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={1}
                maxRows={5}
                disabled={loading}
                style={{ minHeight: '48px', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 rounded-xl text-white dark:text-gray-100 touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button onClick={handleClear} className="text-xs text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 flex items-center space-x-1">
                <X className="h-3 w-3" />
                <span>Effacer</span>
              </button>
              <span className="text-[10px] text-gray-400 dark:text-gray-300">Entrée pour envoyer • Shift+Entrée pour nouvelle ligne</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}