import React, { useState, useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { AdminConsole } from './components/AdminConsole';
import { MessageCircle, Shield, ShoppingBag, Sparkles } from 'lucide-react';
import { cleanPhone } from './utils';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const { settings, orders, user } = useShop();

  // Listen to hash changes (e.g. #admin)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else if (window.location.hash === '#store' || window.location.hash === '') {
        setCurrentView('store');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleViewChange = (view: 'store' | 'admin') => {
    setCurrentView(view);
    window.location.hash = view === 'admin' ? '#admin' : '#store';
  };

  const waClean = cleanPhone(settings.wa);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--gm)] transition-colors duration-300">
      {/* Navigation */}
      <Navbar currentView={currentView} onViewChange={handleViewChange} />

      {/* Main View */}
      <div className="flex-1">
        {currentView === 'store' ? <Storefront /> : <AdminConsole />}
      </div>

      {/* Persistent floating action button on mobile if in store mode */}
      {currentView === 'store' && waClean && (
        <a
          href={`https://wa.me/${waClean}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 md:hidden p-3.5 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          title="Discuter sur WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* App Footer */}
      <footer className="bg-[var(--gm)] text-[var(--bg)] border-t-4 border-[var(--ac)] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="font-bebas text-2xl text-[var(--ac)] tracking-wider">
              {settings.shop || 'Kuassy Boutique'}
            </h4>
            <p className="text-xs text-[var(--bg)]/70">
              Système de vente en ligne & gestion de commandes automatisée
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => handleViewChange('store')}
              className={`hover:text-[var(--ac)] transition-colors ${
                currentView === 'store' ? 'text-[var(--ac)]' : 'text-[var(--bg)]/80'
              }`}
            >
              Vitrine Boutique
            </button>
            <span className="opacity-30">•</span>
            <button
              onClick={() => handleViewChange('admin')}
              className={`hover:text-[var(--ac)] transition-colors ${
                currentView === 'admin' ? 'text-[var(--ac)]' : 'text-[var(--bg)]/80'
              }`}
            >
              Tableau de bord Admin {user ? '(Connecté)' : ''}
            </button>
          </div>

          <div className="text-[11px] font-mono text-[var(--bg)]/50">
            Powered by Firebase & Kuassy
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
