export type Role = 'ADMIN' | 'OPERATOR';
export type VehicleSegment = 'SEDAN' | 'SUV' | 'VAN';
export type TicketStatus =
  | 'QUEUED'
  | 'WASHING'
  | 'DETAILING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';
export type MessageType = 'INTAKE' | 'READY' | 'RETENTION';
export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  allowMarketingSms: boolean;
  createdAt: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: number;
  customerId: number;
  plate: string;
  brandModel: string | null;
  segment: VehicleSegment;
  lastVisitAt: string | null;
  customer?: Customer;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  price: string | number;
  durationMinutes: number;
  active: boolean;
}

export interface TicketService {
  id: number;
  serviceId: number;
  price: string | number;
  service: Service;
}

export interface Ticket {
  id: number;
  ticketCode: string;
  status: TicketStatus;
  totalPrice: string | number;
  notes: string | null;
  trackingToken: string;
  estimatedReadyAt: string | null;
  createdAt: string;
  completedAt: string | null;
  vehicle: Vehicle & { customer: Customer };
  services: TicketService[];
}

export interface TrackingStep {
  key: TicketStatus;
  label: string;
  done: boolean;
  current: boolean;
}

export interface TrackingStatus {
  ticketCode: string;
  customerName: string;
  plate: string;
  brandModel: string | null;
  status: TicketStatus;
  statusLabel: string;
  isCompleted: boolean;
  isCancelled: boolean;
  services: string[];
  estimatedReadyAt: string | null;
  remainingMinutes: number | null;
  steps: TrackingStep[];
  createdAt: string;
}

export interface MessageLog {
  id: number;
  phone: string;
  type: MessageType;
  templateName: string | null;
  languageCode: string;
  params: string[] | null;
  preview: string;
  status: MessageStatus;
  retries: number;
  errorLog: string | null;
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  date: string;
  revenue: number;
  completedCount: number;
  intakeCount: number;
  activeCount: number;
  messages: { PENDING: number; SENT: number; FAILED: number; total: number };
}

export type SystemSettings = Record<string, string>;
