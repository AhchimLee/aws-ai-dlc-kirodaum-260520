export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image_url: string;
  is_sold_out: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface CartItem {
  menu: MenuItem;
  quantity: number;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_name: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  table_id: string;
  session_id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface StoreConfig {
  store_id: string;
  table_id: string;
  session_id?: string;
}

export interface AdminAuth {
  token: string;
  admin_id: string;
  store_id: string;
  expires_at: string;
}
