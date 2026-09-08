export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "tenant";
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
}

export interface Tenant {
  id: string;
  username: string;
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
}

export interface UtilityReading {
  id: string;
  tenant_id: string;
  prev_reading: number;
  curr_reading: number;
  usage_kwh: number;
  amount: number;
  date: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  links: { first: string; last: string; prev: string | null; next: string | null };
  meta: { current_page: number; per_page: number; total: number };
}
