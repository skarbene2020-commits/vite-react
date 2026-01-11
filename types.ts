
export enum OrderStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  NOT_PAID = 'not_paid',
  CANCELLED_DELIVERY_PAYMENT = 'cancelled_delivery_payment'
}

export interface Order {
  id: string;
  orderId: string;
  phoneNumber: string;
  country: string;
  detailedAddress?: string; 
  deliveryCompany?: string;
  price: number;
  note: string;
  sequence: string;
  packageName: string;
  status: OrderStatus;
  statusReason?: string;
  paidAmount?: number;
  orderImage?: string; 
  statusUpdatedAt: string;
  createdAt: string;
  isContacted?: boolean;
  isManager1Contacted?: boolean;
  isManager2Contacted?: boolean;
}

export interface ArchiveRound {
  id: string;
  date: string;
  stats: Stats;
  orders: Order[];
}

export interface ImageReference {
  path: string;
  name: string;
  startingIndex: number;
}

export interface Stats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  postponedOrders: number;
  notPaidOrders: number;
  cancelledDeliveryPaymentOrders: number;
  totalRevenue: number;
  deliveredRevenue: number;
  totalCashInHand: number;
  netRevenue: number;
}
