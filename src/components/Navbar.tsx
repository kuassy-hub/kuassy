import React from 'react';
import { useShop } from '../context/ShopContext';
import { THEMES } from '../themes';
import { cleanPhone } from '../utils';
import { 
  ShoppingBag, 
  ShieldCheck, 
  MessageCircle, 
  Palette, 
  Volume2, 
  VolumeX, 
  LogOut,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentView: 'store' | 'admin';
  onViewChange: (view: 'store' | 'admin') => void;
  onOpenThemeModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  const { settings, orders, user, logout, soundEnabled, setSoundEnabled } = useShop();

  const pendingOrdersCount = orders.filter((o) => o.status === 'À confirmer').length;
  const currentTheme = THEMES[settings.theme] || THEMES.kuba;
  const waClean = cleanPhone(settings.wa);

  return (
    <header className="sticky top-0 z-40 w-full shadow-md bg-[var(--gm)] text-[var(--bg)] transition-colors duration-300">
      {/* Top micro announcement banner */}
      {settings.bannerNotice && (
        <div className="bg-[var(--ac)] text-[var(--gm)] text-xs sm:text-sm font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{settings.bannerNotice}</span>
        </div>
      )}

      {/* Main Bar with Kuba signature styling */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Name */}
        <div 
          onClick={() => onViewChange('store')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--ac)] text-[var(--gm)] flex items-center justify-center font-bebas text-2xl shadow-inner group-hover:scale-105 transition-transform">
            K
          </div>
          <div>
            <h1 className="font-bebas text-3xl sm:text-4xl text-[var(--ac)] tracking-wider leading-none group-hover:opacity-90 transition-opacity">
              {settings.shop || 'Kuassy Boutique'}
            </h1>
            <p className="text-[11px] text-[var(--bg)]/70 uppercase tracking-widest font-mono">
              Boutique & Gestion Officielle
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View Mode Toggle Switch */}
          <div className="inline-flex rounded-lg p-1 bg-black/20 border border-[var(--bg)]/15">
            <button
              onClick={() => onViewChange('store')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'store'
                  ? 'bg-[var(--ac)] text-[var(--gm)] font-bold shadow'
                  : 'text-[var(--bg)]/80 hover:text-[var(--bg)]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Boutique</span>
            </button>
            <button
              onClick={() => onViewChange('admin')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentView === 'admin'
                  ? 'bg-[var(--ac)] text-[var(--gm)] font-bold shadow'
                  : 'text-[var(--bg)]/80 hover:text-[var(--bg)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
              {pendingOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-[var(--ac)] text-[var(--gm)] ring-2 ring-[var(--gm)] animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </div>

          {/* Direct WhatsApp Shop Contact */}
          {waClean && (
            <a
              href={`https://wa.me/${waClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
              title="Contacter sur WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {/* Sound Toggle (for admin audio alerts) */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg border border-[var(--bg)]/20 hover:bg-white/10 text-[var(--bg)] transition-colors"
            title={soundEnabled ? 'Alertes sonores activées' : 'Alertes sonores muettes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 opacity-50" />}
          </button>

          {/* Logout if authenticated and in admin */}
          {user && (
            <button
              onClick={() => logout()}
              className="p-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs flex items-center gap-1 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          )}
        </div>
      </div>

      {/* Signature Kuba Border Gradient */}
      <div className="kuba-border-gradient w-full h-[6px]"></div>
    </header>
  );
};
