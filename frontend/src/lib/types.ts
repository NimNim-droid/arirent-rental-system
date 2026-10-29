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

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordResponse {
  message: string;
  token: string;
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
  property?: Property;
  room: string;
  status: "pending_approval" | "active" | "inactive";
  balance: number;
  water_rate: number;
  room_rent?: number;
  latest_reading?: number;
  move_in_date?: string | null;
  billing_day?: number;
  advance_paid?: number;
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
  move_in_date?: string | null;
  advance_paid?: number;
  lease_end?: string | null;
}

export interface Payment {
  id: string;
  bill_id: string;
  tenant_id: string;
  amount: number;
  payment_method: string;
  transaction_reference: string;
  status: "pending" | "confirmed" | "failed";
  receipt_url?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ExcessCharge {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  room?: string;
  bill_id?: string | null;
  title: string;
  description?: string | null;
  amount: number;
  charge_date: string;
  status: "pending" | "billed" | "paid" | "waived";
  created_at?: string;
}

export interface DelinquentTenant {
  tenant_id: number;
  tenant_name: string;
  room: string;
  property_name: string;
  overdue_count: number;
  total_overdue: number;
  bills: Array<{
    id: number;
    total_amount: number;
    paid_amount: number;
    remaining_balance: number;
    due_date: string;
    status: string;
  }>;
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
  paid_amount?: number;
  remaining_balance?: number;
  date: string;
  due_date: string;
  status: "unpaid" | "partially_paid" | "pending_verification" | "paid" | "overdue" | "voided";
  gcash_ref?: string;
  receipt_url?: string;
  notes?: string;
  created_at?: string;
  payment_date?: string;
  approved_date?: string;
  reject_reason?: string;
  tenant_name?: string;
  room?: string;
  property_name?: string;
  tenant?: {
    name: string;
    room: string;
    property?: {
      id?: string;
      name?: string;
    };
  };
  payments?: Payment[];
  excess_charges?: ExcessCharge[];
  readings?: UtilityReading[];
}

export interface CreateBillPayload {
  tenant_id: string;
  rent: number;
  electricity?: number;
  elec_usage?: number;
  water?: number;
  late_fee?: number;
  date: string;
  due_date: string;
  notes?: string;
  prev_reading?: number;
  curr_reading?: number;
  excess_charge_ids?: string[];
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
  meter_photo_url?: string | null;
  type?: "electricity" | "water";
  date: string;
  tenant_name?: string;
  room?: string;
  property_name?: string;
  status?: "posted" | "pending";
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
  status: "pending" | "in_progress" | "resolved" | "archived";
  technician_name?: string;
  admin_notes?: string;
  resolved_date?: string;
  date: string;
  tenant_name?: string;
  property_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceInput {
  tenant_id?: string;
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
    last_reading_date?: string | null;
  } | null;
  recent_maintenance?: MaintenanceTicket[];
  settings?: Settings | null;
}

export interface DocumentItem {
  id: string;
  name: string;
  category?: string;
  type?: string;
  size?: number | string;
  url?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  description?: string;
}

export interface TicketStatusCounts {
  pending: number;
  in_progress: number;
  resolved: number;
  archived: number;
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
    status_counts?: TicketStatusCounts;
  };
}