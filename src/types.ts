export interface Item {
  id: string;
  name: string;
  cat?: string;
  price?: string;
  desc?: string;
  stock?: number | null;
  imgs?: string[];
  img?: string;
  visible?: boolean;
  ts?: number;
}

export interface SupplierPrivate {
  supplierName?: string;
  supplierPhone?: string;
}

export type OrderStatus = 'À confirmer' | 'Confirmée' | 'Livrée';

export interface Order {
  id: string;
  itemName: string;
  itemId?: string;
  price?: string;
  name: string;
  tel: string;
  status: OrderStatus;
  ts: number;
  quantity?: number;
  deliveryAddress?: string;
  clientNote?: string;
}

export interface BannedUser {
  id: string;
  tel: string;
  note?: string;
  ts?: number;
}

export interface ShopSettings {
  shop: string;
  wa: string;
  theme: string;
  bannerNotice?: string;
  currency?: string;
}

export interface ThemeConfig {
  id: string;
  label: string;
  gm: string; // primary dark
  ac: string; // accent / call to action
  bg: string; // main background
  card: string; // card container background
  mut: string; // muted text color
}
