import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { THEMES } from '../themes';
import { cleanPhone, formatPhoneDisplay, formatDate, shrinkImage, playOrderAlertSound } from '../utils';
import { OrderStatus, Item } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Phone, 
  MessageSquare, 
  Truck, 
  Ban, 
  Save, 
  Palette, 
  Image as ImageIcon, 
  X, 
  AlertTriangle, 
  Check, 
  RefreshCw, 
  Volume2, 
  Download, 
  Lock, 
  Sparkles, 
  Package, 
  Clock, 
  CheckCircle, 
  ShieldAlert,
  Search,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const {
    user,
    loginWithGoogle,
    login,
    logout,
    items,
    orders,
    supplierPrivate,
    banned,
    settings,
    saveItem,
    deleteItem,
    toggleItemVisibility,
    cycleOrderStatus,
    deleteOrder,
    banPhone,
    unbanPhone,
    saveSettings,
    seedDemoProducts,
    statusMessage,
    clearStatusMessage,
    soundEnabled,
    setSoundEnabled
  } = useShop();

  // Navigation tab inside admin
  const [activeTab, setActiveTab] = useState<'art' | 'cmd' | 'ban' | 'set' | 'stats'>('art');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Article form state
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSupplierPhone, setFormSupplierPhone] = useState('');
  const [formImgs, setFormImgs] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Filter orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Banned form
  const [banInputTel, setBanInputTel] = useState('');
  const [banInputNote, setBanInputNote] = useState('');

  // Settings form
  const [settingsShop, setSettingsShop] = useState(settings.shop);
  const [settingsWa, setSettingsWa] = useState(settings.wa);
  const [settingsBanner, setSettingsBanner] = useState(settings.bannerNotice || '');
  const [settingsTheme, setSettingsTheme] = useState(settings.theme || 'kuba');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    action: () => void;
  } | null>(null);

  // Update settings inputs when settings load
  React.useEffect(() => {
    setSettingsShop(settings.shop);
    setSettingsWa(settings.wa);
    setSettingsBanner(settings.bannerNotice || '');
    setSettingsTheme(settings.theme || 'kuba');
  }, [settings]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    await login(email, password);
    setIsLoggingIn(false);
  };

  // Image Upload with Canvas Resizing
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const availableSlots = 4 - formImgs.length;
    if (availableSlots <= 0) return;

    setIsProcessingImages(true);
    const filesToProcess = files.slice(0, availableSlots);
    const newImages: string[] = [];

    for (const file of filesToProcess) {
      try {
        const compressed = await shrinkImage(file);
        newImages.push(compressed);
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }

    setFormImgs((prev) => [...prev, ...newImages]);
    setIsProcessingImages(false);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setFormImgs((prev) => prev.filter((_, i) => i !== index));
  };

  // Open edit for item
  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id);
    setFormName(item.name || '');
    setFormCat(item.cat || '');
    setFormPrice(item.price || '');
    setFormStock(item.stock !== undefined && item.stock !== null ? String(item.stock) : '');
    setFormDesc(item.desc || '');
    setFormImgs(item.imgs && item.imgs.length > 0 ? [...item.imgs] : item.img ? [item.img] : []);

    const sup = supplierPrivate[item.id] || {};
    setFormSupplierName(sup.supplierName || '');
    setFormSupplierPhone(sup.supplierPhone || '');

    setShowArticleForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetArticleForm = () => {
    setEditingItemId(null);
    setFormName('');
    setFormCat('');
    setFormPrice('');
    setFormStock('');
    setFormDesc('');
    setFormSupplierName('');
    setFormSupplierPhone('');
    setFormImgs([]);
    setShowArticleForm(false);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockVal = formStock.trim() === '' ? null : Number(formStock.trim());

    const ok = await saveItem(
      editingItemId,
      {
        name: formName,
        cat: formCat,
        price: formPrice,
        desc: formDesc,
        stock: stockVal,
        imgs: formImgs
      },
      {
        supplierName: formSupplierName,
        supplierPhone: formSupplierPhone
      }
    );

    if (ok) {
      handleResetArticleForm();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings({
      shop: settingsShop,
      wa: settingsWa,
      bannerNotice: settingsBanner,
      theme: settingsTheme
    });
  };

  const handleBanAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banInputTel.trim()) return;
    const ok = await banPhone(banInputTel, banInputNote);
    if (ok) {
      setBanInputTel('');
      setBanInputNote('');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const term = orderSearch.toLowerCase().trim();
    const matchSearch =
      !term ||
      o.itemName.toLowerCase().includes(term) ||
      o.name.toLowerCase().includes(term) ||
      o.tel.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // Calculate statistics
  const totalRevenue = orders
    .filter((o) => o.status === 'Confirmée' || o.status === 'Livrée')
    .reduce((acc, o) => {
      const num = parseInt(cleanPhone(o.price || ''), 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);

  // If user is not authenticated: show Login panel
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--gm)] p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-[var(--card)] border-2 border-[var(--gm)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[var(--gm)] text-[var(--ac)] mx-auto flex items-center justify-center shadow">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-bebas text-4xl text-[var(--gm)]">Connexion Administrateur</h2>
            <p className="text-xs text-[var(--mut)] uppercase tracking-wider font-mono">
              Espace sécurisé Firebase KuassyShop
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 border-2 ${
                statusMessage.type === 'error'
                  ? 'bg-red-100 border-red-500 text-red-800'
                  : 'bg-emerald-100 border-emerald-500 text-emerald-800'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button onClick={clearStatusMessage} className="text-inherit hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Primary 1-Click Google Login provisioned by Firebase */}
          <div className="space-y-4">
            <button
              onClick={() => loginWithGoogle()}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-[var(--gm)] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google (Admin 1-Clic)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[var(--gm)]/20"></div>
              <span className="flex-shrink mx-3 text-xs uppercase font-bold text-[var(--mut)]">ou par e-mail</span>
              <div className="flex-grow border-t border-[var(--gm)]/20"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--gm)] uppercase tracking-wider mb-1">
                Adresse E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kuassyshop.com"
                className="w-full p-3 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:ring-2 focus:ring-[var(--ac)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--gm)] uppercase tracking-wider mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:ring-2 focus:ring-[var(--ac)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[var(--ac)] text-[var(--gm)] hover:brightness-105 active:scale-[0.99] rounded-xl font-bebas text-2xl transition-all shadow-md disabled:opacity-50"
            >
              {isLoggingIn ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
          </div>

          <div className="pt-4 border-t border-[var(--gm)]/15 text-center">
            <p className="text-xs text-[var(--mut)]">
              Accès réservé au propriétaire de la boutique <strong>{settings.shop}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--gm)] pb-24">
      {/* Admin Action Bar */}
      <div className="bg-[var(--card)] border-b-2 border-[var(--gm)] sticky top-[57px] z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            {[
              { id: 'art', label: `Articles (${items.length})`, icon: Package },
              { id: 'cmd', label: `Commandes (${orders.length})`, icon: Clock },
              { id: 'ban', label: `Bannis (${banned.length})`, icon: Ban },
              { id: 'set', label: 'Réglages', icon: Palette },
              { id: 'stats', label: 'Statistiques', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    clearStatusMessage();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bebas text-lg sm:text-xl transition-all border-2 ${
                    isActive
                      ? 'bg-[var(--ac)] text-[var(--gm)] border-[var(--gm)] shadow-xs font-bold'
                      : 'bg-[var(--bg)] text-[var(--gm)] border-transparent hover:border-[var(--gm)]/30'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => playOrderAlertSound()}
              className="p-1.5 rounded-lg border-2 border-[var(--gm)] bg-[var(--bg)] hover:bg-[var(--card)] text-xs font-medium flex items-center gap-1"
              title="Tester le son d'alerte (880Hz)"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline font-mono text-[11px]">Bip test</span>
            </button>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg border-2 border-red-700 text-red-700 bg-red-50 hover:bg-red-100 font-bebas text-lg"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div
            className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 text-sm font-semibold shadow-xs ${
              statusMessage.type === 'error'
                ? 'bg-red-100 border-red-600 text-red-800'
                : statusMessage.type === 'success'
                ? 'bg-emerald-100 border-emerald-600 text-emerald-800'
                : 'bg-amber-100 border-amber-600 text-amber-800'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={clearStatusMessage} className="p-1 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ==================================================== */}
        {/* TAB: ARTICLES */}
        {/* ==================================================== */}
        {activeTab === 'art' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--card)] border-2 border-[var(--gm)] p-4 rounded-xl">
              <div>
                <h3 className="font-bebas text-3xl text-[var(--gm)] leading-none">Gestion des Articles</h3>
                <p className="text-xs text-[var(--mut)]">
                  {items.length} articles au total ({items.filter((i) => i.visible !== false).length} visibles en vitrine)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {items.length === 0 && (
                  <button
                    onClick={() => seedDemoProducts()}
                    className="px-3.5 py-2 border-2 border-[var(--gm)] rounded-lg font-bebas text-lg bg-[var(--bg)] hover:bg-white flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-[var(--ac)]" />
                    <span>Créer des exemples</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (showArticleForm) {
                      handleResetArticleForm();
                    } else {
                      setShowArticleForm(true);
                    }
                  }}
                  className="px-4 py-2 bg-[var(--ac)] text-[var(--gm)] rounded-lg font-bebas text-xl flex items-center gap-1.5 hover:brightness-105 shadow"
                >
                  {showArticleForm ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Fermer le formulaire</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ Ajouter un article</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Form */}
            {showArticleForm && (
              <div className="bg-[var(--card)] border-2 border-[var(--gm)] rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--gm)] mb-6">
                  <h4 className="font-bebas text-3xl text-[var(--gm)]">
                    {editingItemId ? 'Modifier l’article' : 'Nouvel article'}
                  </h4>
                  <button onClick={handleResetArticleForm} className="p-1 rounded hover:bg-black/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveArticle} className="space-y-6">
                  {/* Photos Uploader */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)]">
                      Photos de l'article (4 maximum, compressées automatiquement)
                    </label>

                    {/* Previews */}
                    <div className="flex flex-wrap gap-3 items-center">
                      {formImgs.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded-lg border-2 border-[var(--gm)] overflow-hidden group bg-black/10"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow"
                            title="Supprimer la photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {formImgs.length < 4 && (
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[var(--gm)] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--bg)] transition-colors bg-[var(--bg)]/50">
                          <ImageIcon className="w-6 h-6 text-[var(--mut)] mb-1" />
                          <span className="text-[10px] font-bold uppercase text-[var(--mut)]">Ajouter</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {isProcessingImages && (
                      <p className="text-xs text-[var(--ac)] font-semibold animate-pulse">
                        Optimisation et compression des images en cours...
                      </p>
                    )}
                  </div>

                  {/* Standard Form Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                        Nom de l'article <span className="text-[var(--ac)]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: Montre Chrono Luxe"
                        className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                        Catégorie
                      </label>
                      <input
                        type="text"
                        value={formCat}
                        onChange={(e) => setFormCat(e.target.value)}
                        placeholder="Ex: Mode, High-Tech, Chaussures..."
                        className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                        Prix affiché
                      </label>
                      <input
                        type="text"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="Ex: 15 000 FCFA"
                        className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                        Stock (vide = illimité)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        placeholder="Ex: 10"
                        className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
                      />
                    </div>
                  </div>

                  {/* Supplier Info (Private collection) */}
                  <div className="p-4 rounded-xl border-2 border-[var(--gm)]/30 bg-[var(--bg)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--mut)]">
                      <Truck className="w-4 h-4 text-[var(--ac)]" />
                      <span>Informations Fournisseur (Confidentiel Admin)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--gm)] mb-1">
                          Nom du fournisseur
                        </label>
                        <input
                          type="text"
                          value={formSupplierName}
                          onChange={(e) => setFormSupplierName(e.target.value)}
                          placeholder="Ex: Grossiste Treichville"
                          className="w-full p-2.5 bg-[var(--card)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--gm)] mb-1">
                          Téléphone WhatsApp du fournisseur
                        </label>
                        <input
                          type="tel"
                          value={formSupplierPhone}
                          onChange={(e) => setFormSupplierPhone(e.target.value)}
                          placeholder="Ex: +225 07 11 22 33 44"
                          className="w-full p-2.5 bg-[var(--card)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                      Description de l'article
                    </label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Détails, matière, garanties, conseils d'utilisation..."
                      className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ac)]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[var(--gm)]">
                    <button
                      type="button"
                      onClick={handleResetArticleForm}
                      className="px-5 py-2.5 border-2 border-[var(--gm)] rounded-lg font-bebas text-xl hover:bg-[var(--bg)]"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[var(--ac)] text-[var(--gm)] rounded-lg font-bebas text-xl hover:brightness-105 shadow flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>{editingItemId ? 'Mettre à jour l’article' : 'Enregistrer l’article'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Articles List Grid */}
            {items.length === 0 ? (
              <div className="p-12 text-center bg-[var(--card)] border-2 border-dashed border-[var(--gm)] rounded-2xl">
                <Package className="w-12 h-12 text-[var(--mut)] mx-auto mb-2" />
                <h4 className="font-bebas text-3xl text-[var(--gm)]">Aucun article enregistré</h4>
                <p className="text-sm text-[var(--mut)] mb-4">
                  Cliquez sur "+ Ajouter un article" pour créer votre premier produit en boutique.
                </p>
                <button
                  onClick={() => seedDemoProducts()}
                  className="px-4 py-2 bg-[var(--ac)] text-[var(--gm)] rounded-lg font-bebas text-xl shadow"
                >
                  Charger 4 articles modèles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => {
                  const sup = supplierPrivate[item.id] || {};
                  const isVisible = item.visible !== false;
                  const coverImg = item.img || (item.imgs && item.imgs[0]) || '';
                  const supPhoneClean = cleanPhone(sup.supplierPhone);

                  return (
                    <div
                      key={item.id}
                      className={`bg-[var(--card)] border-2 border-[var(--gm)] rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
                        isVisible ? 'shadow-sm' : 'opacity-60 bg-neutral-100'
                      }`}
                    >
                      <div>
                        {/* Cover Image */}
                        <div className="relative aspect-square w-full bg-[var(--bd)] overflow-hidden">
                          {coverImg ? (
                            <img src={coverImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--mut)]">
                              <ImageIcon className="w-10 h-10 stroke-1" />
                            </div>
                          )}

                          {/* Visibility badge */}
                          <div className="absolute top-2 right-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold shadow ${
                                isVisible ? 'bg-emerald-600 text-white' : 'bg-neutral-600 text-white'
                              }`}
                            >
                              {isVisible ? 'Visible' : 'Caché'}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 space-y-2">
                          <h4 className="font-bebas text-2xl text-[var(--gm)] leading-none truncate">
                            {item.name}
                          </h4>

                          {item.cat && (
                            <div className="text-[11px] text-[var(--mut)] uppercase font-semibold">
                              {item.cat}
                            </div>
                          )}

                          {item.price && (
                            <div className="font-bebas text-xl text-[var(--ac)] bg-[var(--gm)] px-2 py-0.5 rounded inline-block">
                              {item.price}
                            </div>
                          )}

                          <div className="text-xs text-[var(--mut)] font-mono">
                            {typeof item.stock === 'number'
                              ? item.stock > 0
                                ? `Stock : ${item.stock}`
                                : 'Épuisé (0)'
                              : 'Stock : Illimité'}
                          </div>

                          {/* Supplier details badge */}
                          {(sup.supplierName || sup.supplierPhone) && (
                            <div className="text-[11px] p-2 bg-[var(--bg)] rounded border border-[var(--gm)]/15">
                              <div className="font-bold text-[var(--gm)]">Fournisseur :</div>
                              <div>{sup.supplierName || 'Non spécifié'}</div>
                              {sup.supplierPhone && (
                                <a
                                  href={`https://wa.me/${supPhoneClean}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 font-semibold underline flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{sup.supplierPhone}</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls Footer */}
                      <div className="p-3 border-t border-[var(--gm)]/15 bg-[var(--bg)] flex items-center justify-between gap-1.5">
                        <label className="flex items-center gap-1 text-xs font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => toggleItemVisibility(item.id, e.target.checked)}
                            className="rounded border-[var(--gm)] text-[var(--ac)] focus:ring-[var(--ac)]"
                          />
                          <span>En ligne</span>
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 border border-[var(--gm)] rounded hover:bg-[var(--card)]"
                            title="Modifier"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[var(--gm)]" />
                          </button>

                          <button
                            onClick={() =>
                              setConfirmDialog({
                                message: `Supprimer définitivement l'article "${item.name}" ?`,
                                action: () => deleteItem(item.id)
                              })
                            }
                            className="p-1.5 border border-red-600 rounded text-red-600 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: COMMANDES */}
        {/* ==================================================== */}
        {activeTab === 'cmd' && (
          <div className="space-y-6">
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)] border-2 border-[var(--gm)] p-4 rounded-xl">
              <div>
                <h3 className="font-bebas text-3xl text-[var(--gm)] leading-none">
                  Gestion des Commandes ({orders.length})
                </h3>
                <p className="text-xs text-[var(--mut)]">
                  Mettez à jour les statuts, contactez les clients et notifiez vos fournisseurs en 1 clic.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'À confirmer', 'Confirmée', 'Livrée'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      orderStatusFilter === st
                        ? 'bg-[var(--ac)] text-[var(--gm)] border-[var(--gm)]'
                        : 'bg-[var(--bg)] text-[var(--gm)] border-[var(--gm)]/20 hover:border-[var(--gm)]'
                    }`}
                  >
                    {st === 'all' ? `Toutes (${orders.length})` : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mut)]" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Rechercher par client, article ou numéro de téléphone..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)]"
              />
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-[var(--card)] border-2 border-dashed border-[var(--gm)] rounded-2xl">
                <Clock className="w-12 h-12 text-[var(--mut)] mx-auto mb-2" />
                <h4 className="font-bebas text-3xl text-[var(--gm)]">Aucune commande trouvée</h4>
                <p className="text-sm text-[var(--mut)]">
                  {orderSearch || orderStatusFilter !== 'all'
                    ? 'Aucun résultat ne correspond à vos filtres.'
                    : 'Les nouvelles commandes de vos clients s’afficheront ici en direct avec alerte sonore.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const clientClean = cleanPhone(order.tel);
                  const sup = order.itemId ? supplierPrivate[order.itemId] || {} : {};
                  const supClean = cleanPhone(sup.supplierPhone);

                  const statusColors: Record<OrderStatus, string> = {
                    'À confirmer': 'bg-amber-500 text-white',
                    'Confirmée': 'bg-blue-600 text-white',
                    'Livrée': 'bg-emerald-600 text-white'
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-[var(--card)] border-2 border-[var(--gm)] rounded-xl p-4 sm:p-5 shadow-sm space-y-4 hover:border-[var(--ac)] transition-colors"
                    >
                      {/* Top Order Information */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bebas text-2xl sm:text-3xl text-[var(--gm)] leading-none">
                              {order.itemName}
                            </h4>
                            {order.price && (
                              <span className="font-bebas text-xl text-[var(--ac)] bg-[var(--gm)] px-2 py-0.5 rounded">
                                {order.price}
                              </span>
                            )}
                          </div>

                          <div className="text-xs sm:text-sm text-[var(--mut)] flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[var(--gm)]">{order.name}</span>
                            <span>•</span>
                            <span className="font-mono">{formatPhoneDisplay(order.tel)}</span>
                            <span>•</span>
                            <span>{formatDate(order.ts)}</span>
                          </div>

                          {/* Address & Note if specified */}
                          {(order.deliveryAddress || order.clientNote) && (
                            <div className="text-xs bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--gm)]/15 space-y-1 mt-2">
                              {order.deliveryAddress && (
                                <div>
                                  <span className="font-bold text-[var(--gm)]">Livraison:</span>{' '}
                                  {order.deliveryAddress}
                                </div>
                              )}
                              {order.clientNote && (
                                <div>
                                  <span className="font-bold text-[var(--gm)]">Note:</span>{' '}
                                  {order.clientNote}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status Switch Button */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => cycleOrderStatus(order.id, order.status, order.itemId)}
                            className={`px-3 py-1.5 rounded-lg font-bebas text-xl shadow flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all ${
                              statusColors[order.status] || 'bg-[var(--gm)] text-[var(--bg)]'
                            }`}
                            title="Cliquez pour passer au statut suivant (À confirmer -> Confirmée -> Livrée)"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>{order.status}</span>
                          </button>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--gm)]/15">
                        {/* Write to Client */}
                        <a
                          href={`https://wa.me/${clientClean}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Écrire au client</span>
                        </a>

                        {/* Write to Supplier if supplier phone is present */}
                        {supClean && (
                          <a
                            href={`https://wa.me/${supClean}?text=${encodeURIComponent(
                              `Bonjour, confirmation : mon client ${order.name} (${order.tel}) souhaite acheter : ${order.itemName}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-[var(--gm)] hover:opacity-90 text-[var(--bg)] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5 text-[var(--ac)]" />
                            <span>Écrire au fournisseur</span>
                          </a>
                        )}

                        {/* Ban Client */}
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              message: `Bannir le numéro ${order.tel} (${order.name}) de la boutique ?`,
                              action: () => banPhone(order.tel, order.name)
                            })
                          }
                          className="px-3 py-2 border-2 border-amber-600 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Bannir</span>
                        </button>

                        {/* Delete Order */}
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              message: `Supprimer cette commande de ${order.name} ?`,
                              action: () => deleteOrder(order.id)
                            })
                          }
                          className="px-3 py-2 border-2 border-red-600 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: BANNIS */}
        {/* ==================================================== */}
        {activeTab === 'ban' && (
          <div className="space-y-6">
            <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-4 sm:p-6 rounded-xl space-y-4">
              <div>
                <h3 className="font-bebas text-3xl text-[var(--gm)] leading-none">Numéros Bloqués / Liste Noire</h3>
                <p className="text-xs text-[var(--mut)]">
                  Les numéros enregistrés ici ne pourront plus passer de commandes sur votre vitrine.
                </p>
              </div>

              {/* Add to banned form */}
              <form onSubmit={handleBanAdd} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                    Numéro à bannir (avec indicatif)
                  </label>
                  <input
                    type="tel"
                    required
                    value={banInputTel}
                    onChange={(e) => setBanInputTel(e.target.value)}
                    placeholder="Ex: +225 07 00 11 22 33"
                    className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)]"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                    Motif / Nom du client
                  </label>
                  <input
                    type="text"
                    value={banInputNote}
                    onChange={(e) => setBanInputNote(e.target.value)}
                    placeholder="Ex: Faux rendez-vous, non joignable"
                    className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-lg font-bebas text-xl hover:bg-red-700 shadow flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Bannir</span>
                </button>
              </form>
            </div>

            {/* Banned List */}
            {banned.length === 0 ? (
              <div className="p-12 text-center bg-[var(--card)] border-2 border-dashed border-[var(--gm)] rounded-2xl">
                <ShieldAlert className="w-12 h-12 text-[var(--mut)] mx-auto mb-2" />
                <h4 className="font-bebas text-3xl text-[var(--gm)]">Aucun numéro banni</h4>
                <p className="text-sm text-[var(--mut)]">Tous vos clients ont accès normal à la boutique.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {banned.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[var(--card)] border-2 border-red-700/40 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-sm text-[var(--gm)]">{b.tel}</div>
                      {b.note && <div className="text-xs text-[var(--mut)] mt-0.5">{b.note}</div>}
                    </div>

                    <button
                      onClick={() => unbanPhone(b.id)}
                      className="px-3 py-1.5 border-2 border-[var(--gm)] rounded-lg font-bebas text-lg hover:bg-[var(--bg)] text-[var(--gm)]"
                      title="Débannir"
                    >
                      Débannir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: RÉGLAGES */}
        {/* ==================================================== */}
        {activeTab === 'set' && (
          <div className="space-y-6">
            <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-6 rounded-2xl shadow-sm">
              <div className="pb-4 border-b-2 border-[var(--gm)] mb-6">
                <h3 className="font-bebas text-3xl text-[var(--gm)] leading-none">Réglages de la Boutique</h3>
                <p className="text-xs text-[var(--mut)]">
                  Personnalisez l’identité, les contacts WhatsApp et le thème visuel complet de votre boutique.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                      Nom de la boutique
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsShop}
                      onChange={(e) => setSettingsShop(e.target.value)}
                      placeholder="Ex: Kuassy Boutique"
                      className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                      Votre numéro WhatsApp (avec indicatif)
                    </label>
                    <input
                      type="tel"
                      required
                      value={settingsWa}
                      onChange={(e) => setSettingsWa(e.target.value)}
                      placeholder="Ex: +225 07 12 34 56 78"
                      className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)] mb-1">
                    Message d’annonce en haut de page (optionnel)
                  </label>
                  <input
                    type="text"
                    value={settingsBanner}
                    onChange={(e) => setSettingsBanner(e.target.value)}
                    placeholder="Ex: Livraison gratuite à partir de 25 000 FCFA !"
                    className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium"
                  />
                </div>

                {/* Theme Palette Chooser */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--gm)]">
                    Palette de couleurs de la boutique (9 Thèmes Authentiques)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.values(THEMES).map((th) => {
                      const isSelected = settingsTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setSettingsTheme(th.id)}
                          className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'border-[var(--ac)] ring-3 ring-[var(--ac)] bg-[var(--bg)]'
                              : 'border-[var(--gm)] bg-[var(--card)] hover:bg-[var(--bg)]'
                          }`}
                        >
                          {/* Mini gradient strip preview */}
                          <div
                            className="w-12 h-8 rounded-md border border-black/30 shrink-0 shadow-inner"
                            style={{
                              background: `linear-gradient(90deg, ${th.gm} 34%, ${th.ac} 34% 67%, ${th.bg} 67%)`
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate text-[var(--gm)]">{th.label}</div>
                            <div className="text-[10px] text-[var(--mut)] font-mono">{th.id}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 ml-auto text-[var(--ac)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t-2 border-[var(--gm)] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[var(--ac)] text-[var(--gm)] rounded-lg font-bebas text-xl hover:brightness-105 shadow flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Enregistrer les réglages</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: STATS & EXPORT */}
        {/* ==================================================== */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-4 rounded-xl">
                <div className="text-xs font-bold text-[var(--mut)] uppercase">Total Commandes</div>
                <div className="font-bebas text-4xl text-[var(--gm)] mt-1">{orders.length}</div>
                <div className="text-xs text-[var(--mut)]">
                  {orders.filter((o) => o.status === 'À confirmer').length} en attente
                </div>
              </div>

              <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-4 rounded-xl">
                <div className="text-xs font-bold text-[var(--mut)] uppercase">Commandes Confirmées / Livrées</div>
                <div className="font-bebas text-4xl text-emerald-600 mt-1">
                  {orders.filter((o) => o.status === 'Confirmée' || o.status === 'Livrée').length}
                </div>
                <div className="text-xs text-[var(--mut)]">Ventes finalisées</div>
              </div>

              <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-4 rounded-xl">
                <div className="text-xs font-bold text-[var(--mut)] uppercase">Articles en vitrine</div>
                <div className="font-bebas text-4xl text-[var(--ac)] mt-1">
                  {items.filter((i) => i.visible !== false).length}
                </div>
                <div className="text-xs text-[var(--mut)]">sur {items.length} au catalogue</div>
              </div>

              <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-4 rounded-xl">
                <div className="text-xs font-bold text-[var(--mut)] uppercase">Ruptures de stock</div>
                <div className="font-bebas text-4xl text-amber-600 mt-1">
                  {items.filter((i) => typeof i.stock === 'number' && i.stock <= 0).length}
                </div>
                <div className="text-xs text-[var(--mut)]">articles épuisés</div>
              </div>
            </div>

            {/* Quick Export tools */}
            <div className="bg-[var(--card)] border-2 border-[var(--gm)] p-6 rounded-2xl space-y-4">
              <h4 className="font-bebas text-2xl text-[var(--gm)]">Exportation des Données</h4>
              <p className="text-xs text-[var(--mut)]">
                Téléchargez facilement vos commandes ou votre catalogue sous format CSV compatible Excel / Google Sheets.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const csvRows = [
                      ['ID', 'Article', 'Prix', 'Client', 'Telephone', 'Statut', 'Date', 'Adresse', 'Note'].join(',')
                    ];
                    orders.forEach((o) => {
                      csvRows.push(
                        [
                          `"${o.id}"`,
                          `"${(o.itemName || '').replace(/"/g, '""')}"`,
                          `"${(o.price || '').replace(/"/g, '""')}"`,
                          `"${(o.name || '').replace(/"/g, '""')}"`,
                          `"${(o.tel || '').replace(/"/g, '""')}"`,
                          `"${o.status}"`,
                          `"${formatDate(o.ts)}"`,
                          `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
                          `"${(o.clientNote || '').replace(/"/g, '""')}"`
                        ].join(',')
                      );
                    });
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `commandes_${settings.shop || 'kuassy'}_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 border-2 border-[var(--gm)] rounded-lg font-bebas text-lg bg-[var(--bg)] hover:bg-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[var(--ac)]" />
                  <span>Exporter les Commandes (CSV)</span>
                </button>

                <button
                  onClick={() => {
                    const csvRows = [
                      ['ID', 'Nom', 'Categorie', 'Prix', 'Stock', 'Visible', 'Description'].join(',')
                    ];
                    items.forEach((i) => {
                      csvRows.push(
                        [
                          `"${i.id}"`,
                          `"${(i.name || '').replace(/"/g, '""')}"`,
                          `"${(i.cat || '').replace(/"/g, '""')}"`,
                          `"${(i.price || '').replace(/"/g, '""')}"`,
                          `"${i.stock ?? 'Illimité'}"`,
                          `"${i.visible !== false ? 'Oui' : 'Non'}"`,
                          `"${(i.desc || '').replace(/"/g, '""')}"`
                        ].join(',')
                      );
                    });
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `catalogue_${settings.shop || 'kuassy'}_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 border-2 border-[var(--gm)] rounded-lg font-bebas text-lg bg-[var(--bg)] hover:bg-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[var(--gm)]" />
                  <span>Exporter le Catalogue (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--card)] border-2 border-[var(--gm)] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="font-bebas text-2xl text-[var(--gm)] leading-none">Confirmation</h4>
            </div>

            <p className="text-sm text-[var(--gm)] leading-normal">{confirmDialog.message}</p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border-2 border-[var(--gm)] rounded-lg font-bebas text-lg hover:bg-[var(--bg)]"
              >
                Non / Annuler
              </button>
              <button
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog(null);
                }}
                className="px-5 py-2 bg-[var(--ac)] text-[var(--gm)] rounded-lg font-bebas text-lg hover:brightness-105"
              >
                Oui, Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
