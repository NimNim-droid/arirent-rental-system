export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "tenant";
  username?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  property_id: string;
  room_number: string;
}

export interface RegisterResponse {
  message: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    status: string;
    property_id: string;
    room: string;
  };
}

export interface Property {
  id: string;
  name: string;
  city: string;
  address: string;
  rooms_count?: number;
  occupied_count?: number;
}

export interface Room {
  id: string;
  property_id: string;
  room_number: string;
  rent: number;
  status: "vacant" | "reserved" | "occupied";
  property?: Property;
  rooms_count?: number;
  occupied_count?: number;
}

export interface Tenant {
  id: string;
  username?: string;
  name: string;
  email: string;
  phone: string;
  property_id: string;
  property_name?: string;
  property_address?: string;
  room: string;
  status: "pending_approval" | "active" | "inactive";
  balance: number;
  water_rate: number;
  lease_end: string | null;
  vacated_date?: string;
  created_at?: string;
}

export interface TenantUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;
  room?: string;
  water_rate?: number;
  lease_end?: string | null;
}

export interface Bill {
  id: string;
  tenant_id: string;
  rent: number;
  electricity: number;
  elec_usage: number;
  water: number;
  late_fee: number;
  total_amount: number;
  date: string;
  due_date: string;
  status: "unpaid" | "pending_verification" | "paid";
  gcash_ref?: string;
  receipt_url?: string;
  notes?: string;
  payment_date?: string;
  approved_date?: string;
  reject_reason?: string;
  tenant_name?: string;
  room?: string;
  tenant?: {
    name: string;
    room: string;
  };
}

export interface BillGenerateResult {
  message: string;
  generated: number;
  skipped: number;
}

export interface UtilityReading {
  id: string;
  tenant_id: string;
  prev_reading: number;
  curr_reading: number;
  usage_kwh: number;
  amount: number;
  date: string;
  tenant_name?: string;
  room?: string;
}

export interface MaintenanceTicket {
  id: string;
  tenant_id: string;
  property_id: string;
  room: string;
  type: "plumbing" | "electrical" | "appliances" | "general";
  description: string;
  photo_url?: string;
  priority: "normal" | "urgent";
  status: "pending" | "in_progress" | "resolved";
  technician_name?: string;
  admin_notes?: string;
  resolved_date?: string;
  date: string;
  tenant_name?: string;
  created_at?: string;
}

export interface MaintenanceInput {
  type: MaintenanceTicket["type"];
  description: string;
  priority: MaintenanceTicket["priority"];
  photo_url?: string;
}

export interface Settings {
  elec_rate: number;
  water_rate: number;
  gcash_name: string;
  gcash_number: string;
  gcash_qr_path: string;
}

export interface DashboardStats {
  total_revenue: number;
  occupancy_rate: number;
  occupied_rooms: number;
  total_rooms: number;
  pending_applications: number;
  pending_payments: number;
  recent_maintenance: MaintenanceTicket[];
}

export interface TenantDashboardData {
  outstanding_balance: number;
  due_date?: string | null;
  unit?: {
    room: string;
    rent: number;
    water_rate: number;
    lease_end: string | null;
    property_name: string;
    city?: string;
    address?: string;
  } | null;
  electricity?: {
    usage_kwh: number;
    latest_reading: number;
    estimated_charge: number;
    elec_rate: number;
  } | null;
  recent_maintenance?: MaintenanceTicket[];
  settings?: Settings | null;
}

export interface DocumentItem {
  id: string;
  name: string;
  type?: string;
  size?: number | string;
  url?: string;
  uploaded_at?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
}