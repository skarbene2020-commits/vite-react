
import React from 'react';
import { OrderStatus } from './types';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'قيد الانتظار',
  [OrderStatus.DELIVERED]: 'تم التوصيل',
  [OrderStatus.CANCELLED]: 'ملغاة',
  [OrderStatus.POSTPONED]: 'مؤجلة',
  [OrderStatus.NOT_PAID]: 'لم يدفع',
  [OrderStatus.CANCELLED_DELIVERY_PAYMENT]: 'ملغاة دفع التوصيل'
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-slate-800 text-slate-400 border-slate-700',
  [OrderStatus.DELIVERED]: 'bg-green-600 text-white border-green-700',
  [OrderStatus.CANCELLED]: 'bg-red-600 text-white border-red-700',
  [OrderStatus.POSTPONED]: 'bg-blue-600 text-white border-blue-700',
  [OrderStatus.NOT_PAID]: 'bg-orange-600 text-white border-orange-700',
  [OrderStatus.CANCELLED_DELIVERY_PAYMENT]: 'bg-purple-600 text-white border-purple-700'
};

export const ROW_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-transparent hover:bg-slate-800/50 border-r-4 border-r-slate-800',
  [OrderStatus.DELIVERED]: 'bg-green-600/40 hover:bg-green-600/60 border-r-4 border-r-green-500',
  [OrderStatus.CANCELLED]: 'bg-red-600/40 hover:bg-red-600/60 border-r-4 border-r-red-600',
  [OrderStatus.POSTPONED]: 'bg-blue-600/40 hover:bg-blue-600/60 border-r-4 border-r-blue-500',
  [OrderStatus.NOT_PAID]: 'bg-orange-600/40 hover:bg-orange-600/60 border-r-4 border-r-orange-600',
  [OrderStatus.CANCELLED_DELIVERY_PAYMENT]: 'bg-purple-600/40 hover:bg-purple-600/60 border-r-4 border-r-purple-600'
};

export const COLUMN_ALIASES = {
  orderId: ['Number Ship', 'رقم الشحن', 'رقم الطلب', 'order id', 'shipment no', 'رقم الطرد'],
  phoneNumber: ['التلفون', 'تلفون', 'رقم الهاتف', 'phone', 'mobile', 'رقم الموبايل', 'تلفون الزبون'],
  country: ['العنوان', 'عنوان', 'الدولة', 'المنطقة', 'address', 'location', 'السكن'],
  price: ['$', 'السعر', 'price', 'amount', 'صافي', 'القيمة', 'المبلغ'],
  sequence: ['Order', 'التسلسل', 'sequence', 'serial', 'م', 'ترتيب'],
  packageName: ['إسم الزبون', 'اسم الزبون', 'اسم العميل', 'الطرد', 'الزبون', 'customer name'],
  note: ['ملاحظة', 'ملاحظات', 'note', 'البيان', 'تفاصيل'],
  deliveryCompany: ['شركة الديليفري', 'المندوب', 'الشركة', 'delivery company', 'courier', 'driver', 'شركة التوصيل']
};
