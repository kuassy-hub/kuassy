import React, { useState, useMemo } from 'react';
import { useShop } from '../context/ShopContext';
import { Item } from '../types';
import { cleanPhone, getWhatsAppShopOrderLink } from '../utils';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Tag, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  MapPin, 
  FileText, 
  X, 
  Sparkles,
  ArrowRight,
  MessageCircle,
  Eye,
  SlidersHorizontal,
  PackageOpen
} from 'lucide-react';

export const Storefront: React.FC = () => {
  const { items, settings, placeCustomerOrder, isPhoneBanned, seedDemoProducts } = useShop();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [orderingItem, setOrderingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Order form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    item: Item;
    name: string;
    phone: string;
    address: string;
    note: string;
  } | null>(null);

  // Filter items that are visible
  const visibleItems = useMemo(() => {
    return items.filter((item) => item.visible !== false);
  }, [items]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    visibleItems.forEach((i) => {
      if (i.cat && i.cat.trim()) set.add(i.cat.trim());
    });
    return Array.from(set);
  }, [visibleItems]);

  // Filtered items by category and search
  const filteredItems = useMemo(() => {
    return visibleItems.filter((i) => {
      const matchCat = selectedCat === 'all' || i.cat === selectedCat;
      const term = search.toLowerCase().trim();
      const matchSearch =
        !term ||
        i.name.toLowerCase().includes(term) ||
        (i.desc && i.desc.toLowerCase().includes(term)) ||
        (i.cat && i.cat.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [visibleItems, selectedCat, search]);

  const handleOpenOrder = (item: Item) => {
    setOrderingItem(item);
    setOrderError(null);
    setOrderSuccess(null);
  };

  const handleCloseOrder = () => {
    setOrderingItem(null);
    setOrderError(null);
    setOrderSuccess(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerNote('');
  };

  const handleOpenDetails = (item: Item) => {
    setViewingItem(item);
    setActivePhotoIdx(0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingItem) return;

    if (!customerName.trim()) {
      setOrderError('Veuillez indiquer votre nom complet.');
      return;
    }

    const cleanTel = cleanPhone(customerPhone);
    if (cleanTel.length < 8) {
      setOrderError('Veuillez entrer un numéro de téléphone valide (au moins 8 chiffres).');
      return;
    }

    if (isPhoneBanned(customerPhone)) {
      setOrderError('Désolé, les commandes pour ce numéro sont actuellement bloquées.');
      return;
    }

    if (typeof orderingItem.stock === 'number' && orderingItem.stock <= 0) {
      setOrderError('Cet article est actuellement en rupture de stock.');
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    const res = await placeCustomerOrder({
      itemName: orderingItem.name,
      itemId: orderingItem.id,
      price: orderingItem.price,
      name: customerName,
      tel: customerPhone,
      deliveryAddress: customerAddress,
      clientNote: customerNote
    });

    setIsSubmitting(false);

    if (res.success && res.orderId) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setOrderSuccess({
        orderId: res.orderId,
        item: orderingItem,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        note: customerNote
      });
    } else {
      setOrderError(res.error || 'Erreur lors de la prise de commande.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--gm)] pb-24">
      {/* Hero Presentation */}
      <section className="relative overflow-hidden bg-[var(--card)] border-b-2 border-[var(--gm)] px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gm)] text-[var(--bg)] text-xs font-mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[var(--ac)]" />
                <span>Boutique En Ligne Directe</span>
              </div>
              <h2 className="font-bebas text-4xl sm:text-6xl text-[var(--gm)] tracking-wide leading-tight">
                Découvrez nos collections & <span className="text-[var(--ac)]">commandez en 1 clic</span>
              </h2>
              <p className="text-[var(--mut)] text-base sm:text-lg">
                Produits authentiques, prix transparents et livraison soignée. Commandez directement en ligne avec suivi WhatsApp.
              </p>
            </div>

            {/* Quick Stats or Highlights */}
            <div className="flex items-center gap-4 border-2 border-[var(--gm)] p-4 rounded-xl bg-[var(--bg)] self-start md:self-auto shadow-sm">
              <div className="text-center px-3 border-r border-[var(--gm)]/30">
                <div className="font-bebas text-3xl text-[var(--ac)]">{visibleItems.length}</div>
                <div className="text-[11px] font-semibold text-[var(--mut)] uppercase">Articles dispo</div>
              </div>
              <div className="text-center px-3 border-r border-[var(--gm)]/30">
                <div className="font-bebas text-3xl text-[var(--gm)]">24/48h</div>
                <div className="text-[11px] font-semibold text-[var(--mut)] uppercase">Expédition</div>
              </div>
              <div className="text-center px-3">
                <div className="font-bebas text-3xl text-emerald-600">100%</div>
                <div className="text-[11px] font-semibold text-[var(--mut)] uppercase">Garanti</div>
              </div>
            </div>
          </div>

          {/* Search Bar & Filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--mut)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un article, un vêtement, une montre..."
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-[var(--gm)] placeholder-[var(--mut)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ac)] font-medium text-sm sm:text-base shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mut)] hover:text-[var(--gm)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category selection */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border-2 border-[var(--gm)] ${
                    selectedCat === 'all'
                      ? 'bg-[var(--ac)] text-[var(--gm)]'
                      : 'bg-[var(--bg)] text-[var(--gm)] hover:bg-[var(--card)]'
                  }`}
                >
                  Tous ({visibleItems.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border-2 border-[var(--gm)] ${
                      selectedCat === cat
                        ? 'bg-[var(--ac)] text-[var(--gm)]'
                        : 'bg-[var(--bg)] text-[var(--gm)] hover:bg-[var(--card)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[var(--card)] border-2 border-dashed border-[var(--gm)] rounded-2xl max-w-lg mx-auto">
            <PackageOpen className="w-16 h-16 text-[var(--mut)] mx-auto mb-4 stroke-1" />
            <h3 className="font-bebas text-3xl text-[var(--gm)] mb-2">Aucun article trouvé</h3>
            <p className="text-sm text-[var(--mut)] mb-6">
              {search || selectedCat !== 'all'
                ? 'Essayez de modifier votre recherche ou sélectionnez une autre catégorie.'
                : 'La boutique est actuellement en cours de réapprovisionnement.'}
            </p>
            {visibleItems.length === 0 && (
              <button
                onClick={() => seedDemoProducts()}
                className="px-5 py-2.5 bg-[var(--ac)] text-[var(--gm)] font-bebas text-xl rounded-lg hover:brightness-110 shadow"
              >
                + Charger des articles d'exemple
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const hasMultiplePhotos = item.imgs && item.imgs.length > 1;
              const isOutOfStock = typeof item.stock === 'number' && item.stock <= 0;
              const coverImg = item.img || (item.imgs && item.imgs[0]) || '';

              return (
                <article
                  key={item.id}
                  className="group bg-[var(--card)] border-2 border-[var(--gm)] rounded-xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Photo area */}
                  <div className="relative aspect-square w-full bg-[var(--bd)] overflow-hidden">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--mut)]/60">
                        <ShoppingBag className="w-12 h-12 stroke-1" />
                        <span className="text-xs font-mono mt-1">Photo Kuassy</span>
                      </div>
                    )}

                    {/* Stock badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white shadow">
                          Épuisé
                        </span>
                      ) : typeof item.stock === 'number' ? (
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[var(--gm)] text-[var(--bg)] shadow">
                          Stock: {item.stock}
                        </span>
                      ) : null}

                      {hasMultiplePhotos && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-xs">
                          {item.imgs?.length} photos
                        </span>
                      )}
                    </div>

                    {/* Quick view button */}
                    <button
                      onClick={() => handleOpenDetails(item)}
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-[var(--gm)]/80 text-[var(--bg)] hover:bg-[var(--gm)] opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow"
                      title="Aperçu rapide"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      {item.cat && (
                        <span className="text-[11px] font-bold text-[var(--mut)] uppercase tracking-wider">
                          {item.cat}
                        </span>
                      )}
                      <h3 className="font-bebas text-2xl text-[var(--gm)] tracking-wide leading-tight line-clamp-2 mt-0.5">
                        {item.name}
                      </h3>
                      {item.desc && (
                        <p className="text-xs text-[var(--mut)] line-clamp-2 mt-1">
                          {item.desc}
                        </p>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="pt-2 border-t border-[var(--gm)]/15 flex items-center justify-between gap-2">
                      <div className="font-bebas text-2xl text-[var(--ac)] bg-[var(--gm)] px-2.5 py-0.5 rounded shadow-xs">
                        {item.price || 'Sur demande'}
                      </div>

                      <button
                        onClick={() => handleOpenOrder(item)}
                        disabled={isOutOfStock}
                        className={`px-3 py-2 rounded-md font-bebas text-lg flex items-center gap-1.5 transition-all shadow-sm ${
                          isOutOfStock
                            ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                            : 'bg-[var(--ac)] text-[var(--gm)] hover:brightness-105 active:scale-95'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Commander</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border-2 border-[var(--gm)] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b-2 border-[var(--gm)] bg-[var(--gm)] text-[var(--bg)] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[var(--ac)] font-mono">Détails de l'article</span>
                <h3 className="font-bebas text-3xl leading-none text-[var(--bg)]">{viewingItem.name}</h3>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1 rounded hover:bg-white/10 text-[var(--bg)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Photo gallery */}
              <div className="space-y-3">
                <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-[var(--gm)] bg-[var(--bd)]">
                  {viewingItem.imgs && viewingItem.imgs[activePhotoIdx] ? (
                    <img
                      src={viewingItem.imgs[activePhotoIdx]}
                      alt={viewingItem.name}
                      className="w-full h-full object-contain bg-black/10"
                    />
                  ) : viewingItem.img ? (
                    <img
                      src={viewingItem.img}
                      alt={viewingItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--mut)]">
                      Pas d'image
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {viewingItem.imgs && viewingItem.imgs.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {viewingItem.imgs.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIdx(i)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activePhotoIdx === i
                            ? 'border-[var(--ac)] ring-2 ring-[var(--ac)]'
                            : 'border-[var(--gm)] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Information */}
              <div className="grid grid-cols-2 gap-4 border-2 border-[var(--gm)]/20 p-4 rounded-xl bg-[var(--bg)]">
                <div>
                  <div className="text-xs text-[var(--mut)] uppercase font-semibold">Prix</div>
                  <div className="font-bebas text-3xl text-[var(--ac)]">{viewingItem.price || 'À convenir'}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--mut)] uppercase font-semibold">Disponibilité</div>
                  <div className="font-bebas text-2xl text-[var(--gm)]">
                    {typeof viewingItem.stock === 'number'
                      ? viewingItem.stock > 0
                        ? `${viewingItem.stock} en stock`
                        : 'Épuisé'
                      : 'Stock disponible'}
                  </div>
                </div>
                {viewingItem.cat && (
                  <div className="col-span-2">
                    <div className="text-xs text-[var(--mut)] uppercase font-semibold">Catégorie</div>
                    <div className="text-sm font-bold text-[var(--gm)]">{viewingItem.cat}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewingItem.desc && (
                <div>
                  <h4 className="font-bebas text-xl text-[var(--gm)] mb-1">Description</h4>
                  <p className="text-sm text-[var(--gm)] whitespace-pre-line leading-relaxed bg-[var(--bg)]/50 p-4 rounded-xl border border-[var(--gm)]/15">
                    {viewingItem.desc}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-[var(--gm)] bg-[var(--bg)] flex items-center justify-between gap-3">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 border-2 border-[var(--gm)] rounded-lg font-bebas text-lg hover:bg-[var(--card)]"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setViewingItem(null);
                  handleOpenOrder(viewingItem);
                }}
                className="px-6 py-2.5 bg-[var(--ac)] text-[var(--gm)] rounded-lg font-bebas text-xl flex items-center gap-2 hover:brightness-105 shadow"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Passer la commande</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal (Instant Checkout) */}
      {orderingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border-2 border-[var(--gm)] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-[var(--gm)] text-[var(--bg)] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[var(--ac)] font-mono">Commande Directe</span>
                <h3 className="font-bebas text-2xl sm:text-3xl leading-none text-[var(--bg)]">
                  {orderSuccess ? 'Commande Validée !' : orderingItem.name}
                </h3>
              </div>
              <button
                onClick={handleCloseOrder}
                className="p-1 rounded hover:bg-white/10 text-[var(--bg)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content: Form or Success */}
            <div className="overflow-y-auto p-6">
              {orderSuccess ? (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bebas text-3xl text-[var(--gm)]">Merci {orderSuccess.name} !</h4>
                    <p className="text-sm text-[var(--mut)] max-w-sm mx-auto">
                      Votre commande pour <strong className="text-[var(--gm)]">{orderSuccess.item.name}</strong> a bien été enregistrée dans notre système.
                    </p>
                  </div>

                  <div className="bg-[var(--bg)] border-2 border-[var(--gm)] p-4 rounded-xl text-left text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--mut)]">Numéro de commande:</span>
                      <span className="font-bold">{orderSuccess.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--mut)]">Montant:</span>
                      <span className="font-bold text-[var(--ac)]">{orderSuccess.item.price || 'À convenir'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--mut)]">Contact client:</span>
                      <span>{orderSuccess.phone}</span>
                    </div>
                    {orderSuccess.address && (
                      <div className="flex justify-between">
                        <span className="text-[var(--mut)]">Livraison:</span>
                        <span>{orderSuccess.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Direct WhatsApp link to speed up merchant confirmation */}
                  <div className="space-y-3 pt-2">
                    <a
                      href={getWhatsAppShopOrderLink(
                        settings.wa,
                        orderSuccess.item.name,
                        orderSuccess.item.price || '',
                        orderSuccess.name,
                        orderSuccess.phone,
                        orderSuccess.address,
                        orderSuccess.note
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm sm:text-base"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Confirmer sur WhatsApp avec le vendeur</span>
                    </a>

                    <button
                      onClick={handleCloseOrder}
                      className="w-full py-2.5 border-2 border-[var(--gm)] text-[var(--gm)] rounded-xl font-bebas text-lg hover:bg-[var(--bg)]"
                    >
                      Retourner à la boutique
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  {/* Selected Item Summary banner */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-xl">
                    <img
                      src={orderingItem.img || (orderingItem.imgs && orderingItem.imgs[0]) || ''}
                      alt={orderingItem.name}
                      className="w-14 h-14 object-cover rounded-lg border border-[var(--gm)]"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[var(--gm)] truncate">{orderingItem.name}</h4>
                      <div className="font-bebas text-xl text-[var(--ac)]">{orderingItem.price || 'Prix sur demande'}</div>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3 bg-red-100 border-2 border-red-500 text-red-800 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Customer Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--gm)] uppercase tracking-wider mb-1">
                      Votre Nom & Prénom <span className="text-[var(--ac)]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mut)]" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Jean Kouadio"
                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:ring-2 focus:ring-[var(--ac)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Customer WhatsApp Phone */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--gm)] uppercase tracking-wider mb-1">
                      Numéro WhatsApp / Téléphone <span className="text-[var(--ac)]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mut)]" />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ex: +225 07 12 34 56 78"
                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:ring-2 focus:ring-[var(--ac)] focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-[var(--mut)] mt-1">
                      Nous vous contacterons sur ce numéro pour valider la livraison.
                    </p>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--gm)] uppercase tracking-wider mb-1">
                      Adresse ou Commune de livraison
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--mut)]" />
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Ex: Cocody Angré, Abidjan"
                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:ring-2 focus:ring-[var(--ac)] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-bold text-[var(--gm)] uppercase tracking-wider mb-1">
                      Note spécifique (taille, couleur, horaire...)
                    </label>
                    <textarea
                      rows={2}
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Ex: Taille 42 ou livraison après 17h..."
                      className="w-full p-2.5 bg-[var(--bg)] border-2 border-[var(--gm)] rounded-lg text-sm text-[var(--gm)] font-medium focus:ring-2 focus:ring-[var(--ac)] focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[var(--ac)] hover:brightness-105 active:scale-[0.99] text-[var(--gm)] rounded-xl font-bebas text-2xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Envoi en cours...</span>
                    ) : (
                      <>
                        <span>Confirmer ma commande</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
