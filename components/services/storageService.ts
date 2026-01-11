
import { Order, OrderStatus, Stats, ArchiveRound } from '../types';

const STORAGE_KEY_ORDERS = 'da_orders';
const STORAGE_KEY_MANAGER_PHONE = 'da_manager_phone';
const STORAGE_KEY_MANAGER_PHONE_2 = 'da_manager_phone_2';
const STORAGE_KEY_DELIVERY_DATE = 'da_delivery_date';
const STORAGE_KEY_ARCHIVES = 'da_archives';
const STORAGE_KEY_EXPIRY = 'da_app_expiry';
const STORAGE_KEY_PREMIUM = 'da_premium_status';

export const storageService = {
  isActivated: (): boolean => {
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    if (!expiry) return false;
    return new Date().getTime() < parseInt(expiry);
  },
  
  activateApp: (code: string): boolean => {
    const regex = /^126342\.(1|2|3|12)$/;
    const match = code.match(regex);
    if (match) {
      const months = parseInt(match[1]);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + months);
      localStorage.setItem(STORAGE_KEY_EXPIRY, expiryDate.getTime().toString());
      return true;
    }
    return false;
  },

  getExpiryDate: (): string | null => {
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    if (!expiry) return null;
    return new Date(parseInt(expiry)).toLocaleDateString('ar-EG');
  },

  isPremium: (): boolean => {
    return localStorage.getItem(STORAGE_KEY_PREMIUM) === 'true';
  },
  
  upgradeToPremium: (code: string): boolean => {
    if (code === '126342madzo') {
      localStorage.setItem(STORAGE_KEY_PREMIUM, 'true');
      return true;
    }
    return false;
  },

  getOrders: (): Order[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveOrders: (orders: Order[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("⚠️ الذاكرة ممتلئة! يرجى حذف الصور القديمة أو أرشفة الدورة الحالية.");
      }
    }
  },

  getDeliveryDate: (): string => {
    return localStorage.getItem(STORAGE_KEY_DELIVERY_DATE) || 'غداً';
  },

  setDeliveryDate: (date: string) => {
    localStorage.setItem(STORAGE_KEY_DELIVERY_DATE, date);
  },

  getManagerPhone: (): string => {
    return localStorage.getItem(STORAGE_KEY_MANAGER_PHONE) || '81648433';
  },

  setManagerPhone: (phone: string) => {
    localStorage.setItem(STORAGE_KEY_MANAGER_PHONE, phone);
  },

  getSecondaryManagerPhone: (): string => {
    return localStorage.getItem(STORAGE_KEY_MANAGER_PHONE_2) || '';
  },

  setSecondaryManagerPhone: (phone: string) => {
    localStorage.setItem(STORAGE_KEY_MANAGER_PHONE_2, phone);
  },

  updateOrderStatus: (id: string, status: OrderStatus, reason?: string, paidAmount?: number) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === id ? { 
      ...o, 
      status, 
      statusReason: reason !== undefined ? reason : o.statusReason,
      paidAmount: paidAmount !== undefined ? paidAmount : o.paidAmount,
      statusUpdatedAt: new Date().toISOString() 
    } : o);
    storageService.saveOrders(updated);
  },

  bulkUpdateStatus: (ids: string[], status: OrderStatus) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => ids.includes(o.id) ? { 
      ...o, 
      status, 
      statusUpdatedAt: new Date().toISOString() 
    } : o);
    storageService.saveOrders(updated);
  },

  bulkUpdateCompany: (ids: string[], company: string) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => ids.includes(o.id) ? { 
      ...o, 
      deliveryCompany: company 
    } : o);
    storageService.saveOrders(updated);
  },

  updateDetailedAddress: (id: string, detailedAddress: string) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === id ? { ...o, detailedAddress } : o);
    storageService.saveOrders(updated);
  },

  markAsContacted: (id: string) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === id ? { ...o, isContacted: true } : o);
    storageService.saveOrders(updated);
  },

  markManagerContacted: (id: string, managerIndex: 1 | 2) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => {
      if (o.id === id) {
        if (managerIndex === 1) return { ...o, isManager1Contacted: true };
        return { ...o, isManager2Contacted: true };
      }
      return o;
    });
    storageService.saveOrders(updated);
  },

  // Fix: Added missing addManualOrder function
  addManualOrder: (orderData: Partial<Order>): Order[] => {
    const orders = storageService.getOrders();
    const lastSeq = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.sequence) || 0)) : 0;
    
    const newOrder: Order = {
      id: `man-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderId: String(orderData.orderId || '').trim(),
      phoneNumber: String(orderData.phoneNumber || '').trim(),
      country: String(orderData.country || '').trim(),
      price: orderData.price || 0,
      deliveryCompany: orderData.deliveryCompany || '',
      note: orderData.note || '',
      sequence: String(lastSeq + 1),
      packageName: orderData.packageName || 'طلب يدوي',
      status: OrderStatus.PENDING,
      statusUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isContacted: false
    };

    const updated = [newOrder, ...orders];
    storageService.saveOrders(updated);
    return updated;
  },

  getStats: (): Stats => {
    const orders = storageService.getOrders();
    const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const cancelledWithPay = orders.filter(o => o.status === OrderStatus.CANCELLED_DELIVERY_PAYMENT);
    const notPaid = orders.filter(o => o.status === OrderStatus.NOT_PAID);

    const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const deliveredCash = delivered.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const partialCash = cancelledWithPay.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
    const totalCashInHand = deliveredCash + partialCash;
    const totalDeliveryActions = delivered.length + cancelledWithPay.length + notPaid.length;
    const netRevenue = totalCashInHand - (totalDeliveryActions * 1);

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === OrderStatus.PENDING).length,
      deliveredOrders: delivered.length,
      cancelledOrders: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
      postponedOrders: orders.filter(o => o.status === OrderStatus.POSTPONED).length,
      notPaidOrders: notPaid.length,
      cancelledDeliveryPaymentOrders: cancelledWithPay.length,
      totalRevenue,
      deliveredRevenue: deliveredCash,
      totalCashInHand,
      netRevenue
    };
  },

  getArchives: (): ArchiveRound[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ARCHIVES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  deleteArchive: (id: string) => {
    try {
      const archives = storageService.getArchives();
      const updated = archives.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify(updated));
    } catch (e) {
      console.error("Storage Error:", e);
    }
  },

  archiveCurrentRound: () => {
    const orders = storageService.getOrders();
    if (orders.length === 0) return;
    const stats = storageService.getStats();
    const archives = storageService.getArchives();
    const ordersToArchive = orders.map(o => ({ ...o, orderImage: undefined }));
    const newRound: ArchiveRound = { id: `round-${Date.now()}`, date: new Date().toLocaleString('ar-EG'), stats, orders: ordersToArchive };
    try {
      localStorage.setItem(STORAGE_KEY_ARCHIVES, JSON.stringify([newRound, ...archives]));
      storageService.saveOrders([]);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("⚠️ فشلت الأرشفة بسبب امتلاء الذاكرة! يرجى حذف جولات قديمة أولاً.");
      }
    }
  },

  clearImages: (): Order[] => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => ({ ...o, orderImage: undefined }));
    storageService.saveOrders(updated);
    return updated;
  },

  deleteSingleOrderImage: (id: string): Order | null => {
    const orders = storageService.getOrders();
    let updatedOrder: Order | null = null;
    const updated = orders.map(o => {
      if (o.id === id) {
        updatedOrder = { ...o, orderImage: undefined };
        return updatedOrder;
      }
      return o;
    });
    storageService.saveOrders(updated);
    return updatedOrder;
  },

  updateOrderPrice: (id: string, price: number) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === id ? { ...o, price } : o);
    storageService.saveOrders(updated);
  },

  updateOrderAddress: (id: string, country: string) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === id ? { ...o, country } : o);
    storageService.saveOrders(updated);
  },

  updateOrderPhone: (id: string, phoneNumber: string) => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === id ? { ...o, phoneNumber } : o);
    storageService.saveOrders(updated);
  },

  resetEverything: () => {
    const phone = localStorage.getItem(STORAGE_KEY_MANAGER_PHONE);
    const phone2 = localStorage.getItem(STORAGE_KEY_MANAGER_PHONE_2);
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);
    const premium = localStorage.getItem(STORAGE_KEY_PREMIUM);
    const date = localStorage.getItem(STORAGE_KEY_DELIVERY_DATE);
    localStorage.clear();
    if (phone) localStorage.setItem(STORAGE_KEY_MANAGER_PHONE, phone);
    if (phone2) localStorage.setItem(STORAGE_KEY_MANAGER_PHONE_2, phone2);
    if (expiry) localStorage.setItem(STORAGE_KEY_EXPIRY, expiry);
    if (premium) localStorage.setItem(STORAGE_KEY_PREMIUM, premium);
    if (date) localStorage.setItem(STORAGE_KEY_DELIVERY_DATE, date);
    localStorage.setItem(STORAGE_KEY_ORDERS, '[]');
    localStorage.setItem(STORAGE_KEY_ARCHIVES, '[]');
  }
};
