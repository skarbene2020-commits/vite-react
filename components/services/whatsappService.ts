
import { Order } from '../types';
import { STATUS_LABELS } from '../constants';
import { storageService } from './storageService';

const greetings = [
  "السلام عليكم ورحمة الله وبركاته",
  "مرحباً بك عميلنا العزيز",
  "تحية طيبة وبعد، أهلاً بك",
  "السلام عليكم، نأمل أن تكون بخير",
  "أهلاً ومرحباً بك يا غالي",
  "يسعدنا التواصل معك، طاب يومك",
  "تحية من فريق التوصيل، أهلاً بك",
  "السلام عليكم، طاب صباحك بكل خير",
  "مرحباً بك، نتشرف بخدمتك دائماً",
  "السلام عليكم، كيف حالك اليوم؟",
  "أهلاً بك، يسعدنا إبلاغك بتحديثات طلبك"
];

const signatures = [
  "شكراً لاختيارك لنا.",
  "نسعد دائماً بخدمتكم.",
  "مع تحيات فريق التوصيل.",
  "طاب يومك بكل خير.",
  "شكراً جزيلاً لثقتك بنا.",
  "نحن هنا لخدمتكم دائماً.",
  "مع أطيب التحيات من فريقنا.",
  "شكراً لتفهمكم وتعاونكم."
];

function getRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatPhone(phone: string): string {
  let cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '961' + cleaned.substring(1);
  }
  return cleaned;
}

export const whatsappService = {
  generateMessage: (order: Order): string => {
    const deliveryDate = storageService.getDeliveryDate();
    const greeting = getRandom(greetings);
    const signature = getRandom(signatures);
    
    const notice = `نود إبلاغك بأن طلبك مبرمج للتوصيل (${deliveryDate}) إن شاء الله.`;
    const request = `يرجى تزويدنا بموقعك (Location) أو العنوان بدقة لتأكيد الحجز لليوم المذكور.`;

    const noteLine = order.note ? `\nملاحظة: ${order.note}` : '';

    return `${greeting}

${notice}

📋 تفاصيل طلبك:
- التسلسل: ${order.sequence} (م)
- رقم الشحن: ${order.orderId}
- المنطقة: ${order.country}
- السعر: ${order.price} $ ${noteLine}

📍 ${request}

${signature}`;
  },

  generateLink: (order: Order): string => {
    const message = whatsappService.generateMessage(order);
    const phone = formatPhone(order.phoneNumber);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  generateDirectChatLink: (phone: string): string => {
    const formatted = formatPhone(phone);
    return `https://wa.me/${formatted}`;
  },

  generateManagerReportLink: (order: Order, managerPhone: string): string => {
    const report = `📢 تقرير تحديث طلب:
📦 رقم الشحن: ${order.orderId}
📊 الحالة الحالية: ${STATUS_LABELS[order.status]}
💬 الملاحظة: ${order.statusReason || 'لا يوجد'}
💰 المبلغ المستلم: ${order.paidAmount || 0} $
📍 المنطقة: ${order.country}
📱 هاتف الزبون: ${order.phoneNumber}
🚚 شركة التوصيل: ${order.deliveryCompany || 'غير محدد'}`;

    const phone = formatPhone(managerPhone);
    return `https://wa.me/${phone}?text=${encodeURIComponent(report)}`;
  },

  generatePermissionRequestLink: (order: Order, managerPhone: string): string => {
    const message = `✋ طلب إذن بفتح طرد:
📦 رقم الشحن: ${order.orderId}
📍 المنطقة: ${order.country}
📱 هاتف الزبون: ${order.phoneNumber}
💰 المبلغ المطلوب: ${order.price} $

الزبون يطلب فتح الطرد قبل الدفع، بانتظار قراركم..`;
    const phone = formatPhone(managerPhone);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
};
