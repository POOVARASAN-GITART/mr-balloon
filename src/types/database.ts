export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type EventCategory = 'birthday' | 'marriage' | 'party' | 'corporate';

export interface CatalogPackage {
  id: string;
  title: string;
  slug: string;
  category: EventCategory;
  sub_category: string | null;
  base_price: number;
  discounted_price: number | null;
  description: string | null;
  features: Json;
  images: string[];
  gallery_images: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  title: string | null;
  event_type: EventCategory | null;
  package_id: string | null;
  images: string[];
  venue_name: string | null;
  location_city: string | null;
  event_date: string | null;
  client_testimonial: string | null;
  is_featured: boolean;
  created_at: string;
}

export type OrderStatus = 
  | 'draft'
  | 'submitted'
  | 'quoted'
  | 'accepted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'pending' | 'advance_paid' | 'paid' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  event_type: EventCategory;
  event_subtype: string | null;
  venue_name: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string | null;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  alternate_phone: string | null;
  event_date: string;
  setup_start_time: string | null;
  setup_complete_by: string;
  dismantle_time: string | null;
  package_id: string | null;
  custom_requirements: string | null;
  reference_images: string[];
  estimated_amount: number | null;
  final_amount: number | null;
  advance_paid: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  owner_id: string | null;
  owner_notes: string | null;
  quoted_amount: number | null;
  quote_sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  source: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export type NotificationType = 
  | 'order_submitted'
  | 'order_accepted'
  | 'order_rejected'
  | 'quote_received'
  | 'payment_due'
  | 'setup_reminder'
  | 'order_completed'
  | 'general';

export interface Notification {
  id: string;
  user_id: string;
  order_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  channels: string[];
  is_read: boolean;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export type PaymentType = 'advance' | 'full' | 'refund';
export type PaymentGateway = 'razorpay' | 'stripe' | 'phonepe' | 'cash' | 'upi';

export interface Payment {
  id: string;
  order_id: string;
  user_id: string | null;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  gateway: PaymentGateway | null;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  paid_at: string | null;
  created_at: string;
}

// Form types
export interface BookingFormData {
  eventType: EventCategory;
  eventSubtype?: string;
  venueName: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  alternatePhone?: string;
  eventDate: string; // YYYY-MM-DD format from date input
  setupCompleteBy: string; // HH:mm
  dismantleTime?: string;
  packageId?: string;
  customRequirements?: string;
  referenceImages?: string[];
  budgetRange?: 'under_25k' | '25k_50k' | '50k_1l' | '1l_plus' | 'custom';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Event types with subcategories
export const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday', icon: '🎂', color: 'from-pink-400 to-rose-500' },
  { value: 'marriage', label: 'Marriage / Reception', icon: '💍', color: 'from-amber-400 to-orange-500' },
  { value: 'party', label: 'Party / Event', icon: '🎉', color: 'from-violet-400 to-purple-500' },
  { value: 'corporate', label: 'Corporate', icon: '🏢', color: 'from-blue-400 to-cyan-500' },
] as const;

export const EVENT_SUBTYPES: Record<EventCategory, string[]> = {
  birthday: ['1st Birthday', 'Kids Birthday', 'Milestone (18th, 21st, 50th)', 'Surprise Party'],
  marriage: ['Wedding Reception', 'Engagement', 'Mehndi / Sangeet', 'Haldi', 'Bridal Shower'],
  party: ['Anniversary', 'Baby Shower', 'Gender Reveal', 'Farewell', 'Housewarming', 'Festival'],
  corporate: ['Product Launch', 'Annual Day', 'Conference', 'Team Building', 'Awards Night'],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'text-slate-500', icon: '📝' },
  submitted: { label: 'New Order', color: 'text-amber-700', icon: '🔔' },
  quoted: { label: 'Quoted', color: 'text-blue-700', icon: '💰' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', icon: '✅' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-700', icon: '🔒' },
  in_progress: { label: 'In Progress', color: 'text-violet-700', icon: '🚚' },
  completed: { label: 'Completed', color: 'text-slate-700', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: 'text-rose-700', icon: '❌' },
  rejected: { label: 'Rejected', color: 'text-rose-700', icon: '🚫' },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600' },
  advance_paid: { label: 'Advance Paid', color: 'text-blue-600' },
  paid: { label: 'Fully Paid', color: 'text-emerald-600' },
  refunded: { label: 'Refunded', color: 'text-slate-600' },
};