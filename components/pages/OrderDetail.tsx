
import React, { useState, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { 
  ArrowRight, MessageSquare, MapPin, 
  Smartphone, Check,
  ImageIcon, Download, Trash2, MessageCircle, Send, FileEdit, X, ChevronDown, MapPinned, ShieldAlert, Edit2, Upload, Camera, RefreshCcw
} from 'lucide-react';
import { whatsappService } from '../services/whatsappService';
import { storageService } from '../services/storageService';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => reject("فشل قراءة الملف");
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onerror = () => reject("فشل تحميل الصورة");
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // دقة 3000px للوضوح في الـ PDF كما طلب المستخدم
        const maxWidth = 3000; 
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        // استخدام جودة 0.3 لتقليل حجم التخزين بشكل ملحوظ
        resolve(canvas.toDataURL('image/jpeg', 0.3));
      };
    };
  });
};

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  isPremium: boolean;
  onShowPremiumModal: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order: initialOrder, onBack, isPremium, onShowPremiumModal }) => {
  const [order, setOrder] = useState(initialOrder);
  const [showStatusGrid, setShowStatusGrid] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(initialOrder.country || '');
  
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState(initialOrder.phoneNumber || '');

  const [isEditingDetailedAddress, setIsEditingDetailedAddress] = useState(false);
  const [detailedAddressInput, setDetailedAddressInput] = useState(initialOrder.detailedAddress || '');

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(initialOrder.note || '');

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(initialOrder.price));

  const managerPhone = storageService.getManagerPhone();

  const handleStatusSelect = (status: OrderStatus) => {
    if (status === OrderStatus.DELIVERED) {
      storageService.updateOrderStatus(order.id, status, '', 0);
      setOrder(prev => ({ ...prev, status, statusReason: '', paidAmount: 0 }));
      setShowStatusGrid(false);
    } else {
      setPendingStatus(status);
      setStatusReason(order.statusReason || '');
    }
  };

  const finalizeStatus = () => {
    if (!pendingStatus) return;
    storageService.updateOrderStatus(order.id, pendingStatus, statusReason, 0);
    setOrder(prev => ({ ...prev, status: pendingStatus, statusReason }));
    setShowStatusGrid(false);
    setPendingStatus(null);
  };

  const handleSaveAddress = () => {
    storageService.updateOrderAddress(order.id, addressInput);
    setOrder(prev => ({ ...prev, country: addressInput }));
    setIsEditingAddress(false);
  };

  const handleSavePhone = () => {
    storageService.updateOrderPhone(order.id, phoneInput);
    setOrder(prev => ({ ...prev, phoneNumber: phoneInput }));
    setIsEditingPhone(false);
  };

  const handleSaveDetailedAddress = () => {
    storageService.updateDetailedAddress(order.id, detailedAddressInput);
    setOrder(prev => ({ ...prev, detailedAddress: detailedAddressInput }));
    setIsEditingDetailedAddress(false);
  };

  const handleSaveNote = () => {
    const orders = storageService.getOrders();
    const updated = orders.map(o => o.id === order.id ? { ...o, note: noteInput } : o);
    storageService.saveOrders(updated);
    setOrder(prev => ({ ...prev, note: noteInput }));
    setIsEditingNote(false);
  };

  const handleSavePrice = () => {
    const newPrice = parseFloat(priceInput) || 0;
    storageService.updateOrderPrice(order.id, newPrice);
    setOrder(prev => ({ ...prev, price: newPrice }));
    setIsEditingPrice(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      
      const allOrders = storageService.getOrders();
      const updatedOrders = allOrders.map(o => o.id === order.id ? { ...o, orderImage: compressed } : o);
      
      storageService.saveOrders(updatedOrders);
      setOrder(prev => ({ ...prev, orderImage: compressed }));
    } catch (err) {
      console.error(err);
      alert("خطأ في معالجة أو تخزين الصورة. قد تكون الذاكرة ممتلئة.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleWhatsAppSend = () => {
    storageService.markAsContacted(order.id);
    setOrder(prev => ({ ...prev, isContacted: true }));
    window.location.href = whatsappService.generateLink(order);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 pb-32 arabic-text animate-in fade-in duration-300">
      {/* المنبثقة: الحالات */}
      {showStatusGrid && (
        <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-6 backdrop-blur-md" onClick={() => !pendingStatus && setShowStatusGrid(false)}>
          <div className="w-full max-sm" onClick={e => e.stopPropagation()}>
            {!pendingStatus ? (
              <div className="grid grid-cols-1 gap-4 animate-in zoom-in-95 duration-200">
                <h3 className="text-white font-black text-center mb-2">تحديث حالة الطلب</h3>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => handleStatusSelect(k as OrderStatus)} className={`w-full py-6 rounded-[2rem] font-black text-base border-2 shadow-2xl transition-all active:scale-95 ${STATUS_COLORS[k as OrderStatus]}`}>{v}</button>
                ))}
                <button onClick={() => setShowStatusGrid(false)} className="mt-4 p-4 text-slate-500 font-black text-sm text-center w-full hover:text-white transition-colors">إغلاق النافذة</button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center"><span className="font-black text-white text-lg">ملاحظة التحديث: {STATUS_LABELS[pendingStatus]}</span><button onClick={() => setPendingStatus(null)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button></div>
                <textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-5 text-white text-sm outline-none focus:border-blue-500 transition-all min-h-[120px]" placeholder="مثلاً: الزبون طلب التأجيل ليوم الخميس..." />
                <div className="flex gap-3">
                   <button onClick={finalizeStatus} className="flex-1 bg-green-600 py-5 rounded-[2rem] font-black text-white shadow-xl active:scale-95 transition-all text-lg hover:bg-green-500">حفظ الحالة</button>
                   <button onClick={() => setPendingStatus(null)} className="flex-1 bg-slate-800 py-5 rounded-[2rem] font-black text-slate-400">تراجع</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isFullImageOpen && order.orderImage && (
        <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={() => setIsFullImageOpen(false)}>
          <img src={order.orderImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Full order" />
          <button className="absolute top-6 left-6 p-4 bg-slate-800 rounded-full text-white"><X size={24}/></button>
        </div>
      )}

      <button onClick={onBack} className="flex items-center gap-3 text-slate-400 font-black bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 mb-2 active:scale-95 transition-all hover:bg-slate-800 hover:text-white">
        <ArrowRight size={24} /> العودة لقائمة الطلبات
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white">رقم الطرد: {order.orderId || '---'}</h2>
                <div className="mt-4">
                  <button onClick={() => setShowStatusGrid(true)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm border-2 shadow-lg transition-all active:scale-95 hover:brightness-110 ${STATUS_COLORS[order.status]}`}>
                    الحالة: {STATUS_LABELS[order.status]} <ChevronDown size={20} />
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col items-end shrink-0">
                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">المبلغ المطلوب تحصيله</div>
                {isEditingPrice ? (
                   <div className="flex gap-1 justify-end animate-in zoom-in-95">
                     <input type="number" className="w-24 bg-slate-950 border-2 border-green-500 rounded-xl px-3 py-2 text-white text-2xl font-black outline-none" value={priceInput} onChange={e => setPriceInput(e.target.value)} autoFocus />
                     <button onClick={handleSavePrice} className="bg-green-600 p-2.5 rounded-xl text-white shadow-lg hover:bg-green-500"><Check size={20}/></button>
                   </div>
                ) : (
                   <div className="flex items-center gap-3 bg-slate-950/50 px-5 py-3 rounded-2xl border border-slate-800">
                      <div className="text-3xl font-black text-green-500">{order.price} $</div>
                      <button onClick={() => setIsEditingPrice(true)} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                        <Edit2 size={18} />
                      </button>
                   </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between group transition-colors hover:border-slate-600">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><MapPin size={28} /></div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">المنطقة</div>
                    {isEditingAddress ? (
                      <div className="flex gap-1 mt-1">
                        <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs outline-none" value={addressInput} onChange={e => setAddressInput(e.target.value)} autoFocus />
                        <button onClick={handleSaveAddress} className="bg-green-600 p-1.5 rounded-lg text-white"><Check size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{order.country || '---'}</span>
                        <button onClick={() => setIsEditingAddress(true)} className="text-slate-600 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={14}/></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between group transition-colors hover:border-slate-600">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><MapPinned size={28} /></div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">تفاصيل العنوان / الشارع</div>
                    {isEditingDetailedAddress ? (
                       <div className="flex gap-2 mt-1">
                         <input className="flex-1 bg-slate-800 rounded-lg px-2 py-1 text-white text-xs outline-none" value={detailedAddressInput} onChange={e => setDetailedAddressInput(e.target.value)} />
                         <button onClick={handleSaveDetailedAddress} className="bg-orange-600 p-1.5 rounded-lg text-white"><Check size={16}/></button>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-white">{order.detailedAddress || 'لا توجد تفاصيل إضافية'}</span>
                         <button onClick={() => setIsEditingDetailedAddress(true)} className="text-slate-600 hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={14}/></button>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between group transition-colors hover:border-slate-600">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Smartphone size={28} /></div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">رقم هاتف الزبون</div>
                    {isEditingPhone ? (
                      <div className="flex gap-1 mt-1">
                        <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs outline-none" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} autoFocus />
                        <button onClick={handleSavePhone} className="bg-green-600 p-1.5 rounded-lg text-white"><Check size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{order.phoneNumber || '---'}</span>
                        <button onClick={() => setIsEditingPhone(true)} className="text-slate-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"><Edit2 size={14}/></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => isPremium ? storageService.markManagerContacted(order.id, 1) : onShowPremiumModal()} className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all text-xs ${order.isManager1Contacted ? 'bg-slate-800 text-purple-500 border border-purple-500/20' : 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'}`}>
                {order.isManager1Contacted ? <Check size={18}/> : <Send size={18}/>}
                تقرير للمدير 1
              </button>
              <button onClick={() => isPremium ? window.location.href = whatsappService.generatePermissionRequestLink(order, managerPhone) : onShowPremiumModal()} className="w-full py-5 bg-slate-800 border border-slate-700 rounded-2xl font-black flex items-center justify-center gap-2 text-amber-500 text-xs hover:bg-slate-700 transition-colors">
                <ShieldAlert size={16} /> طلب إذن فتح الطرد
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-800 shadow-lg">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black flex items-center gap-2 text-white"><MessageSquare className="text-green-500" /> الملاحظات والبيان</h3>
                {!isEditingNote && <button onClick={() => setIsEditingNote(true)} className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"><FileEdit size={14} /> تعديل</button>}
             </div>
             {isEditingNote ? (
               <div className="flex gap-2 mb-6 animate-in slide-in-from-right-2">
                 <input className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-bold outline-none focus:border-blue-500" value={noteInput} onChange={e => setNoteInput(e.target.value)} />
                 <button onClick={handleSaveNote} className="bg-green-600 px-6 rounded-xl text-white font-black text-xs hover:bg-green-500 transition-colors">حفظ</button>
                 <button onClick={() => setIsEditingNote(false)} className="bg-slate-800 px-4 rounded-xl text-slate-400 font-black text-xs">إلغاء</button>
               </div>
             ) : (
               <div className="p-5 bg-slate-950 rounded-2xl text-slate-400 text-xs italic mb-8 border border-slate-800/50 leading-relaxed">
                 {order.note || 'لا توجد ملاحظات مسجلة لهذا الطلب.'}
               </div>
             )}
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => window.location.href = whatsappService.generateDirectChatLink(order.phoneNumber)} className="py-5 bg-blue-600 rounded-2xl font-black text-xs text-white shadow-xl flex items-center justify-center gap-3 hover:bg-blue-500 active:scale-95 transition-all">
                  <MessageCircle size={22}/> دردشة مباشرة
               </button>
               <button onClick={handleWhatsAppSend} className={`py-5 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${order.isContacted ? 'bg-slate-800 text-green-500' : 'bg-green-600 text-white'}`}>
                  {order.isContacted ? <Check size={22}/> : <MessageSquare size={22}/>}
                  {order.isContacted ? 'تم إرسال الإشعار' : 'إشعار واتساب'}
               </button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 text-center sticky top-24 shadow-xl">
            <h3 className="text-xs font-black mb-6 text-slate-500 uppercase tracking-widest">صورة الطرد (بدقة 3000px للـ PDF)</h3>
            
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

            {order.orderImage ? (
              <div className="space-y-4 animate-in zoom-in-95 duration-300">
                <div className="aspect-square bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 cursor-pointer group relative shadow-inner" onClick={() => setIsFullImageOpen(true)}>
                  <img src={order.orderImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Order package" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="text-white w-8 h-8" />
                      <span className="text-white text-[8px] font-black">اضغط للتكبير</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                   <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"><RefreshCcw size={16}/> استبدال الصورة</button>
                   <button onClick={() => { if(window.confirm("هل أنت متأكد من حذف صورة هذا الطرد؟")) { storageService.deleteSingleOrderImage(order.id); setOrder(prev => ({ ...prev, orderImage: undefined })); } }} className="w-full p-4 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 font-black text-xs"><Trash2 size={16}/> حذف الصورة</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="h-56 bg-slate-950 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-800 italic transition-colors hover:border-slate-600">
                  <ImageIcon size={48} className="opacity-10 mb-2" />
                  <span className="text-[10px] font-black opacity-30">لا توجد صورة حالياً</span>
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full py-5 bg-green-600 rounded-2xl font-black text-sm text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUploading ? (
                    <><RefreshCcw className="animate-spin" size={20}/> جاري معالجة الصورة...</>
                  ) : (
                    <><Upload size={20}/> إضافة صورة الطرد</>
                  )}
                </button>
              </div>
            )}
            <p className="mt-4 text-[9px] text-slate-600 font-bold leading-relaxed px-2">يتم ضغط الصور برمجياً لتوفير مساحة في الذاكرة مع الحفاظ على دقة الطباعة.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
