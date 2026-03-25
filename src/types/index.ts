export interface ChildEntry {
  id: string;
  name: string;
  photo?: string;
  entryTime: Date;
  service: "juego" | "paquete" | "evento";
  packageName?: string;
  durationMinutes: number;
  extraCharges?: number;
  status: "active" | "expired" | "warning";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cajero" | "monitor" | "mesero";
  permissions: string[];
}

export interface SystemStatus {
  database: "connected" | "disconnected" | "error" | "loading";
  printer: "connected" | "disconnected" | "error" | "loading";
  cashBox: "open" | "closed" | "loading";
  drawer: "connected" | "disconnected" | "loading";
  nfcReaders: number; // 0 = ninguno detectado
  currentTime: Date;
  isOnline: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

// ============ DATABASE TYPES ============

export interface Client {
  id: number;
  name: string;
  parent_name?: string;
  phone?: string;
  photo_path?: string;
  created_at: string;
}

export interface ActiveSession {
  id: number;
  client_id: number;
  start_time: string;
  package_id?: number;
  status: "active" | "completed" | "pending";
  client_name: string;
  photo_path?: string;
  package_name?: string;
  duration_minutes?: number;
  is_paid?: boolean;
}

export interface ProductService {
  id: number;
  name: string;
  price: number;
  type:
    | "time"
    | "snack"
    | "drink"
    | "food"
    | "package"
    | "event"
    | "rental"
    | "membership";
  category: string;
  barcode?: string;
  stock?: number;
  duration_minutes?: number;
  created_at: string;
}

export interface Sale {
  id: number;
  client_id?: number;
  client_name?: string;
  total: number;
  timestamp: string;
  payment_method?: string;
}

export interface DailyStats {
  total_sales: number;
  total_revenue: number;
  unique_clients: number;
}

// ============ POS TYPES ============

export interface SaleItem {
  id: string;
  product_id: number;
  product_name: string;
  product_type:
    | "time"
    | "snack"
    | "drink"
    | "food"
    | "package"
    | "event"
    | "rental"
    | "membership";
  quantity: number;
  unit_price: number;
  subtotal: number;
  duration_minutes?: number;
  active_session_id?: number;
}

export interface CurrentSale {
  client_id?: number;
  client_name?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discount_percentage?: number;
  total: number;
  payment_method?: "cash" | "card" | "transfer";
  notes?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  type:
    | "time"
    | "snack"
    | "drink"
    | "food"
    | "package"
    | "event"
    | "rental"
    | "membership";
  color: string;
}

export interface PaymentDetails {
  method: "cash" | "card" | "transfer";
  amount_received?: number;
  change?: number;
  reference?: string;
}

// ============ USER MANAGEMENT TYPES ============

export interface SystemUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  photo_path?: string;
  role: "admin" | "gerente" | "cajero" | "monitor" | "mesero";
  is_active: boolean;
  last_login?: string;
  created_at: string;
  created_by?: number;
  updated_by?: number;
  created_by_username?: string;
  updated_by_username?: string;
  permissions?: UserPermission[];
}

export interface UserPermission {
  id?: number;
  user_id: number;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface UserAuditLog {
  id: number;
  user_id: number;
  action: string;
  target_user_id?: number;
  details: string;
  ip_address?: string;
  created_at: string;
  user_username: string;
  user_first_name: string;
  user_last_name: string;
  target_username?: string;
  target_first_name?: string;
  target_last_name?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: SystemUser;
}
