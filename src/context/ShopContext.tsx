import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  increment, 
  signInWithPopup,
  googleProvider,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { Item, Order, SupplierPrivate, BannedUser, ShopSettings, OrderStatus } from '../types';
import { THEMES, applyTheme } from '../themes';
import { cleanPhone, playOrderAlertSound, triggerDesktopNotification } from '../utils';

interface ShopContextType {
  user: User | null;
  authLoading: boolean;
  items: Item[];
  orders: Order[];
  supplierPrivate: Record<string, SupplierPrivate>;
  banned: BannedUser[];
  settings: ShopSettings;
  loading: boolean;
  statusMessage: { text: string; type: 'error' | 'success' | 'info' } | null;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  clearStatusMessage: () => void;
  setStatusMessage: (msg: { text: string; type: 'error' | 'success' | 'info' } | null) => void;
  
  // Auth
  loginWithGoogle: () => Promise<boolean>;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Articles
  saveItem: (
    id: string | null,
    data: { name: string; cat?: string; price?: string; desc?: string; stock?: number | null; imgs: string[] },
    supplier: { supplierName?: string; supplierPhone?: string }
  ) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleItemVisibility: (id: string, visible: boolean) => Promise<boolean>;

  // Commandes
  placeCustomerOrder: (order: {
    itemName: string;
    itemId?: string;
    price?: string;
    name: string;
    tel: string;
    deliveryAddress?: string;
    clientNote?: string;
  }) => Promise<{ success: boolean; error?: string; orderId?: string }>;
  cycleOrderStatus: (orderId: string, currentStatus: OrderStatus, itemId?: string) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;

  // Bannis
  banPhone: (tel: string, note?: string) => Promise<boolean>;
  unbanPhone: (id: string) => Promise<boolean>;
  isPhoneBanned: (tel: string) => boolean;

  // Réglages
  saveSettings: (settings: Partial<ShopSettings>) => Promise<boolean>;

  // Seed sample products
  seedDemoProducts: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplierPrivate, setSupplierPrivate] = useState<Record<string, SupplierPrivate>>({});
  const [banned, setBanned] = useState<BannedUser[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    shop: 'Kuassy Boutique',
    wa: '+225 07 00 00 00 00',
    theme: 'kuba',
    bannerNotice: 'Livraison rapide à Abidjan & expédition partout dans le monde. Commandez en 1 clic !'
  });
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const initialOrdersLoaded = useRef(false);

  const notifyOrder = useCallback((order: Order) => {
    if (soundEnabled) {
      playOrderAlertSound();
    }
    triggerDesktopNotification('🛒 Nouvelle commande reçue !', `${order.itemName} par ${order.name} (${order.tel})`);
    setStatusMessage({
      text: `🛒 Nouvelle commande : ${order.itemName} (${order.name})`,
      type: 'success'
    });
  }, [soundEnabled]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time Settings & Public Items & Banned (Always listened to for Storefront)
  useEffect(() => {
    // 1. Settings listener
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ShopSettings;
          setSettings((prev) => ({
            ...prev,
            ...data,
            theme: data.theme || 'kuba'
          }));
          applyTheme(data.theme || 'kuba');
        } else {
          applyTheme('kuba');
        }
      },
      (err) => {
        console.warn('Settings listener info:', err);
        applyTheme('kuba');
      }
    );

    // 2. Items listener
    const unsubItems = onSnapshot(
      collection(db, 'items'),
      (snap) => {
        const list: Item[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        } as Item));
        list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Items listener info:', err);
        setLoading(false);
      }
    );

    // 3. Banned numbers listener (public read allowed to verify at checkout)
    const unsubBanned = onSnapshot(
      collection(db, 'banned'),
      (snap) => {
        const banList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        } as BannedUser));
        setBanned(banList);
      },
      (err) => console.warn('Banned listener info:', err)
    );

    return () => {
      unsubSettings();
      unsubItems();
      unsubBanned();
    };
  }, []);

  // Admin Data Listeners (When user is authenticated)
  useEffect(() => {
    if (!user) {
      setSupplierPrivate({});
      setOrders([]);
      return;
    }

    // 1. Supplier private data (Admin only)
    const unsubSup = onSnapshot(
      collection(db, 'supplierPrivate'),
      (snap) => {
        const supMap: Record<string, SupplierPrivate> = {};
        snap.docs.forEach((d) => {
          supMap[d.id] = d.data() as SupplierPrivate;
        });
        setSupplierPrivate(supMap);
      },
      (err) => {
        console.warn('Supplier private listener error:', err);
      }
    );

    // 2. Orders listener with real-time new order sound (Admin only)
    initialOrdersLoaded.current = false;
    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        if (!initialOrdersLoaded.current) {
          initialOrdersLoaded.current = true;
        } else {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              notifyOrder(change.doc.data() as Order);
            }
          });
        }
        const orderList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        } as Order));
        orderList.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setOrders(orderList);
      },
      (err) => {
        console.warn('Orders listener error:', err);
      }
    );

    return () => {
      unsubSup();
      unsubOrders();
    };
  }, [user, notifyOrder]);

  // Auth methods
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      await signInWithPopup(auth, googleProvider);
      setStatusMessage({ text: 'Connexion Google réussie ! Bienvenue.', type: 'success' });
      return true;
    } catch (err: unknown) {
      console.error('Google Sign-in error:', err);
      const code = (err as { code?: string })?.code || '';
      let msg = 'Échec de connexion Google.';
      if (code === 'auth/popup-closed-by-user') {
        msg = 'Fenêtre de connexion fermée avant la fin.';
      } else if (code === 'auth/cancelled-popup-request') {
        msg = 'Requête de connexion annulée.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setStatusMessage({ text: msg, type: 'error' });
      return false;
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setStatusMessage({ text: 'Connexion réussie ! Bienvenue dans votre boutique.', type: 'success' });
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      let msg = 'Connexion impossible.';
      if (/invalid-credential|wrong-password|user-not-found/.test(code)) {
        msg = 'E-mail ou mot de passe incorrect. Vous pouvez aussi utiliser "Connexion Google 1-clic".';
      } else if (/invalid-email/.test(code)) {
        msg = 'Adresse e-mail invalide.';
      } else if (/network/.test(code)) {
        msg = 'Problème réseau / connexion Firebase.';
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setStatusMessage({ text: msg, type: 'error' });
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setStatusMessage({ text: 'Déconnexion effectuée.', type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  // Check if a phone is banned
  const isPhoneBanned = (tel: string): boolean => {
    const clean = cleanPhone(tel);
    if (!clean || clean.length < 6) return false;
    const last8 = clean.slice(-8);
    return banned.some((b) => {
      const bClean = cleanPhone(b.tel);
      return b.id === last8 || bClean === clean || bClean.endsWith(last8);
    });
  };

  // Save Item (Batch with supplierPrivate)
  const saveItem = async (
    id: string | null,
    data: { name: string; cat?: string; price?: string; desc?: string; stock?: number | null; imgs: string[] },
    supplier: { supplierName?: string; supplierPhone?: string }
  ): Promise<boolean> => {
    try {
      if (!data.name.trim()) {
        setStatusMessage({ text: 'Le nom de l’article est obligatoire.', type: 'error' });
        return false;
      }

      const itemId = id || 'a' + Date.now();
      const batch = writeBatch(db);

      const itemPayload: Partial<Item> = {
        name: data.name.trim(),
        cat: (data.cat || '').trim(),
        price: (data.price || '').trim(),
        desc: (data.desc || '').trim(),
        stock: data.stock !== undefined ? data.stock : null,
        imgs: data.imgs || [],
        img: data.imgs?.[0] || '',
      };

      if (!id) {
        itemPayload.visible = false;
        itemPayload.ts = Date.now();
      }

      batch.set(doc(db, 'items', itemId), itemPayload, { merge: true });
      batch.set(doc(db, 'supplierPrivate', itemId), {
        supplierName: (supplier.supplierName || '').trim(),
        supplierPhone: (supplier.supplierPhone || '').trim()
      }, { merge: true });

      await batch.commit();
      setStatusMessage({ text: id ? 'Article mis à jour avec succès.' : 'Nouvel article ajouté !', type: 'success' });
      return true;
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage({ text: `Erreur: ${(err as Error)?.message || 'Échec de sauvegarde'}`, type: 'error' });
      return false;
    }
  };

  // Delete Item
  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'items', id));
      batch.delete(doc(db, 'supplierPrivate', id));
      await batch.commit();
      setStatusMessage({ text: 'Article supprimé.', type: 'info' });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Impossible de supprimer cet article.', type: 'error' });
      return false;
    }
  };

  // Toggle Visibility
  const toggleItemVisibility = async (id: string, visible: boolean): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'items', id), { visible });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur lors du changement de visibilité.', type: 'error' });
      return false;
    }
  };

  // Place Customer Order
  const placeCustomerOrder = async (orderData: {
    itemName: string;
    itemId?: string;
    price?: string;
    name: string;
    tel: string;
    deliveryAddress?: string;
    clientNote?: string;
  }): Promise<{ success: boolean; error?: string; orderId?: string }> => {
    const cleanTel = cleanPhone(orderData.tel);
    if (cleanTel.length < 8) {
      return { success: false, error: 'Veuillez saisir un numéro de téléphone valide.' };
    }

    if (isPhoneBanned(orderData.tel)) {
      return { success: false, error: 'Ce numéro ne peut pas passer de commande sur notre boutique.' };
    }

    try {
      const orderId = 'cmd_' + Date.now();
      const payload: Order = {
        id: orderId,
        itemName: orderData.itemName,
        itemId: orderData.itemId || '',
        price: orderData.price || '',
        name: orderData.name.trim(),
        tel: orderData.tel.trim(),
        status: 'À confirmer',
        ts: Date.now(),
        deliveryAddress: (orderData.deliveryAddress || '').trim(),
        clientNote: (orderData.clientNote || '').trim()
      };

      await setDoc(doc(db, 'orders', orderId), payload);
      return { success: true, orderId };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Erreur lors de l’envoi de votre commande. Veuillez réessayer.' };
    }
  };

  // Cycle order status: 'À confirmer' -> 'Confirmée' -> 'Livrée'
  const cycleOrderStatus = async (orderId: string, currentStatus: OrderStatus, itemId?: string): Promise<boolean> => {
    const statusCycle: OrderStatus[] = ['À confirmer', 'Confirmée', 'Livrée'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'orders', orderId), { status: nextStatus });

      if (nextStatus === 'Confirmée' && itemId) {
        const itemObj = items.find((i) => i.id === itemId);
        if (itemObj && typeof itemObj.stock === 'number' && itemObj.stock > 0) {
          batch.update(doc(db, 'items', itemId), {
            stock: increment(-1)
          });
        }
      }

      await batch.commit();
      setStatusMessage({ text: `Statut commande changé à : "${nextStatus}"`, type: 'info' });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur mise à jour statut commande.', type: 'error' });
      return false;
    }
  };

  // Delete Order
  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setStatusMessage({ text: 'Commande supprimée.', type: 'info' });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Impossible de supprimer la commande.', type: 'error' });
      return false;
    }
  };

  // Ban Phone
  const banPhone = async (tel: string, note?: string): Promise<boolean> => {
    const clean = cleanPhone(tel);
    if (clean.length < 7) {
      setStatusMessage({ text: 'Numéro invalide pour le bannissement.', type: 'error' });
      return false;
    }
    const docId = clean.slice(-8);
    try {
      await setDoc(doc(db, 'banned', docId), {
        tel: clean,
        note: (note || '').trim(),
        ts: Date.now()
      });
      setStatusMessage({ text: `Numéro ${tel} banni.`, type: 'info' });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur lors du bannissement.', type: 'error' });
      return false;
    }
  };

  // Unban Phone
  const unbanPhone = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'banned', id));
      setStatusMessage({ text: 'Numéro retiré de la liste noire.', type: 'info' });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur lors du débannissement.', type: 'error' });
      return false;
    }
  };

  // Save Settings
  const saveSettings = async (newSettings: Partial<ShopSettings>): Promise<boolean> => {
    try {
      const merged = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'main'), merged, { merge: true });
      setSettings(merged);
      if (merged.theme) {
        applyTheme(merged.theme);
      }
      setStatusMessage({ text: 'Réglages enregistrés avec succès !', type: 'success' });
      return true;
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Impossible d’enregistrer les réglages.', type: 'error' });
      return false;
    }
  };

  // Seed sample products if empty
  const seedDemoProducts = async () => {
    try {
      const sampleItems = [
        {
          name: 'Montre Chrono Luxe Edition Cuir',
          cat: 'Horlogerie & Bijoux',
          price: '28 000 FCFA',
          stock: 12,
          desc: 'Élégance intemporelle avec cadran guilloché et bracelet en cuir véritable. Résistante aux éclaboussures.',
          img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
          imgs: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80'],
          visible: true,
          supplierName: 'Horlogerie Moderne Abidjan',
          supplierPhone: '+2250708091011'
        },
        {
          name: 'Sneakers Urban Drift V2',
          cat: 'Chaussures & Baskets',
          price: '22 500 FCFA',
          stock: 8,
          desc: 'Semelle ergonomique anti-choc, finition respirante premium. Parfaites pour le style streetwear et le confort quotidien.',
          img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
          imgs: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
          visible: true,
          supplierName: 'Sneaker Palace Treichville',
          supplierPhone: '+2250506070809'
        },
        {
          name: 'Ensemble Traditionnel Tissé Kuba',
          cat: 'Mode & Textile',
          price: '45 000 FCFA',
          stock: 5,
          desc: 'Tissage traditionnel authentique aux motifs géométriques iconiques. Coupe royale et finitions soignées.',
          img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
          imgs: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80'],
          visible: true,
          supplierName: 'Atelier Maître Kouassi',
          supplierPhone: '+2250102030405'
        },
        {
          name: 'Écouteurs Sans Fil Pro Bass ANC',
          cat: 'High-Tech & Audio',
          price: '18 000 FCFA',
          stock: 15,
          desc: 'Réduction active du bruit, autonomie 30 heures avec boîtier de charge rapide. Bluetooth 5.3.',
          img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
          imgs: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'],
          visible: true,
          supplierName: 'TechHub Plateau',
          supplierPhone: '+2250700112233'
        }
      ];

      const batch = writeBatch(db);
      for (const item of sampleItems) {
        const id = 'demo_' + Math.random().toString(36).substring(2, 9);
        batch.set(doc(db, 'items', id), {
          name: item.name,
          cat: item.cat,
          price: item.price,
          stock: item.stock,
          desc: item.desc,
          img: item.img,
          imgs: item.imgs,
          visible: item.visible,
          ts: Date.now()
        });
        batch.set(doc(db, 'supplierPrivate', id), {
          supplierName: item.supplierName,
          supplierPhone: item.supplierPhone
        });
      }
      await batch.commit();
      setStatusMessage({ text: 'Articles d’exemple ajoutés avec succès !', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur lors de la génération des exemples.', type: 'error' });
    }
  };

  const clearStatusMessage = () => setStatusMessage(null);

  return (
    <ShopContext.Provider
      value={{
        user,
        authLoading,
        items,
        orders,
        supplierPrivate,
        banned,
        settings,
        loading,
        statusMessage,
        soundEnabled,
        setSoundEnabled,
        clearStatusMessage,
        setStatusMessage,
        loginWithGoogle,
        login,
        logout,
        saveItem,
        deleteItem,
        toggleItemVisibility,
        placeCustomerOrder,
        cycleOrderStatus,
        deleteOrder,
        banPhone,
        unbanPhone,
        isPhoneBanned,
        saveSettings,
        seedDemoProducts
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
};
