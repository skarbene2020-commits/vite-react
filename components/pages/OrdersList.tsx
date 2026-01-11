
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Order, OrderStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS, ROW_COLORS } from '../constants';
import { ImageIcon, X, MessageCircle, Send, ChevronDown, Truck, MapPin, CheckSquare, Square, RefreshCw, Layers, Plus, MapPinned, Search, Check, Save, UserCheck, CheckCircle2 } from 'lucide-react';
import { whatsappService } from '../services/whatsappService';

interface FilterDropdownProps {
  label: string;
  options: { label: string; count: number }[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  icon: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onToggle, onSelectAll, onClear, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-5 py-3 rounded-xl text-[14px] font-black border-2 transition-all ${
          selected.size > 0 ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-slate-800'
        }`}
      >
        {icon}
        <span className="uppercase tracking-wider font-black">{label} {selected.size > 0 ? `(${selected.size})` : ''}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-slate-800 flex gap-2">
            <button onClick={onSelectAll} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black text-white">اختيار الكل</button>
            <button onClick={onClear} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black text-white">إلغاء الكل</button>
          </div>
          <div className="max-h-80 overflow-y-auto p-1 custom-scrollbar">
            {options.map(opt => (
              <button
                key={opt.label}
                onClick={() => onToggle(opt.label)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-[13px] font-black transition-all ${
                  selected.has(opt.label) ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  {selected.has(opt.label) && <Check size={14} />}
                  {opt.label || 'غير محدد'}
                </span>
                <span className="bg-slate-800 px-2 py-1 rounded-lg text-[10px] text-white font-black">{opt.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface OrdersListProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  statusFilters: Set<OrderStatus>;
  setStatusFilters: (s: Set<OrderStatus>) => void;
  selectedCompanies: Set<string>;
  setSelectedCompanies: (s: Set<string>) => void;
  selectedAreas: Set<string>;
  setSelectedAreas: (s: Set<string>) => void;
  onViewDetail: (order: Order, autoUpdate?: boolean) => void;
  isPremium: boolean;
  onShowPremiumModal: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ 
  searchTerm, setSearchTerm, 
  statusFilters, setStatusFilters,
  selectedCompanies, setSelectedCompanies,
  selectedAreas, setSelectedAreas,
  onViewDetail, isPremium, onShowPremiumModal 
}) => {
  const [orders, setOrders] = useState<Order[]>(() => storageService.getOrders());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [bulkUpdateMode, setBulkUpdateMode] = useState<'status' | 'company' | null>(null);
  const [bulkValue, setBulkValue] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineAddressValue, setInlineAddressValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ orderId: '', phoneNumber: '', country: '', price: '' });

  const managerPhone = storageService.getManagerPhone();
  const managerPhone2 = storageService.getSecondaryManagerPhone();

  const refreshList = () => {
    const fresh = storageService.getOrders();
    setOrders([...fresh]);
  };

  const filtered = useMemo(() => {
    return orders
      .filter(o => {
        const matchSearch = (o.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (o.phoneNumber || '').includes(searchTerm) || 
                            (o.country || '').toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilters.size === 0 || statusFilters.has(o.status);
        const companyMatch = selectedCompanies.size === 0 || selectedCompanies.has(o.deliveryCompany || '');
        const areaMatch = selectedAreas.size === 0 || selectedAreas.has(o.country || '');
        return matchSearch && statusMatch && companyMatch && areaMatch;
      })
      .sort((a, b) => (parseInt(a.sequence) || 0) - (parseInt(b.sequence) || 0));
  }, [orders, searchTerm, statusFilters, selectedCompanies, selectedAreas]);

  const areaOptions = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const val = o.country || '';
      map[val] = (map[val] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [orders]);

  const companyOptions = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const val = o.deliveryCompany || '';
      map[val] = (map[val] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    Object.values(OrderStatus).forEach(s => {
      counts[s] = orders.filter(o => o.status === s).length;
    });
    return counts;
  }, [orders]);

  const handleToggleSet = (val: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const newSet = new Set(set);
    if (newSet.has(val)) newSet.delete(val);
    else newSet.add(val);
    setter(newSet);
  };

  const executeBulkUpdate = () => {
    const ids = Array.from(selectedIds) as string[];
    if (bulkUpdateMode === 'status') {
      storageService.bulkUpdateStatus(ids, bulkValue as OrderStatus);
    } else if (bulkUpdateMode === 'company') {
      storageService.bulkUpdateCompany(ids, bulkValue);
    }
    setBulkUpdateMode(null);
    setBulkValue('');
    setSelectedIds(new Set());
    refreshList();
  };

  const handleAddManual = () => {
    if (!newOrder.phoneNumber || !newOrder.price) {
      alert("يرجى إدخال الهاتف والسعر على الأقل");
      return;
    }
    storageService.addManualOrder({
      orderId: newOrder.orderId,
      phoneNumber: newOrder.phoneNumber,
      country: newOrder.country,
      price: parseFloat(newOrder.price) || 0
    });
    setNewOrder({ orderId: '', phoneNumber: '', country: '', price: '' });
    setShowAddModal(false);
    refreshList();
  };

  const startInlineEdit = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setInlineEditingId(order.id);
    setInlineAddressValue(order.detailedAddress || '');
  };

  const saveInlineEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    storageService.updateDetailedAddress(id, inlineAddressValue);
    setInlineEditingId(null);
    refreshList();
  };

  return (
    <div className="space-y-4 p-1 md:p-4 arabic-text pb-24">
      {/* نافذة إضافة طلب */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md space-y-6 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-white font-black text-center text-lg">إضافة طلب يدوي جديد</h3>
              <div className="space-y-4">
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-black outline-none focus:border-green-500" placeholder="رقم الشحن (اختياري)" value={newOrder.orderId} onChange={e => setNewOrder({...newOrder, orderId: e.target.value})} />
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-black outline-none focus:border-green-500" placeholder="رقم هاتف الزبون" value={newOrder.phoneNumber} onChange={e => setNewOrder({...newOrder, phoneNumber: e.target.value})} />
                 <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-black outline-none focus:border-green-500" placeholder="المنطقة" value={newOrder.country} onChange={e => setNewOrder({...newOrder, country: e.target.value})} />
                 <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-black outline-none focus:border-green-500" placeholder="السعر ($)" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-4">
                 <button onClick={handleAddManual} className="flex-1 bg-green-600 py-4 rounded-xl font-black text-white">إضافة</button>
                 <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-800 py-4 rounded-xl text-slate-400 font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-[9000] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl border-2 border-white/10" alt="Preview" />
          <button className="absolute top-6 left-6 p-4 bg-slate-800 rounded-full text-white"><X size={24}/></button>
        </div>
      )}

      {/* شريط الأدوات والفلاتر */}
      <div className="sticky top-0 z-[100] bg-slate-950/90 backdrop-blur-md pt-2 pb-4 space-y-4 border-b border-slate-900">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          {selectedIds.size > 0 ? (
            <div className="flex gap-2 animate-in slide-in-from-right-2 shrink-0">
               <button onClick={() => setBulkUpdateMode('status')} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg hover:bg-blue-500 transition-colors"><Layers size={14} className="inline ml-1"/> تعديل الحالة</button>
               <button onClick={() => setBulkUpdateMode('company')} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black shadow-lg hover:bg-purple-500 transition-colors"><Truck size={14} className="inline ml-1"/> تغيير الشركة</button>
               <button onClick={() => setSelectedIds(new Set())} className="p-2.5 bg-slate-800 text-slate-400 rounded-xl"><X size={16}/></button>
               <div className="flex items-center px-4 bg-slate-900 rounded-xl border border-blue-500/30 font-black text-[10px] text-blue-400">مختار ({selectedIds.size})</div>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0 w-full">
               <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black shadow-lg flex items-center gap-2 hover:bg-green-500 transition-all active:scale-95"><Plus size={14}/> إضافة طلب</button>
               <div className="flex-1 relative">
                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={14}/>
                 <input className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white outline-none focus:border-slate-600 font-black" placeholder="ابحث برقم الشحن أو الهاتف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <button onClick={refreshList} className="p-2.5 bg-slate-800 text-blue-400 rounded-xl border border-slate-700 active:rotate-180 transition-all"><RefreshCw size={16}/></button>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
          <button onClick={() => setStatusFilters(new Set())} className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap border-2 transition-all ${statusFilters.size === 0 ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>الكل ({statusCounts.all})</button>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => handleToggleSet(k as any, statusFilters, setStatusFilters)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap border-2 transition-all ${statusFilters.has(k as any) ? STATUS_COLORS[k as any] + ' border-transparent scale-105 shadow-lg' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>{v} ({statusCounts[k]})</button>
          ))}
        </div>

        <div className="flex gap-3 px-1">
          <FilterDropdown 
            label="المناطق" 
            options={areaOptions} 
            selected={selectedAreas} 
            onToggle={(v) => handleToggleSet(v, selectedAreas, setSelectedAreas)}
            onSelectAll={() => setSelectedAreas(new Set(areaOptions.map(o => o.label)))}
            onClear={() => setSelectedAreas(new Set())}
            icon={<MapPinned size={16} className="text-purple-500" />}
          />
          <FilterDropdown 
            label="الشركات" 
            options={companyOptions} 
            selected={selectedCompanies} 
            onToggle={(v) => handleToggleSet(v, selectedCompanies, setSelectedCompanies)}
            onSelectAll={() => setSelectedCompanies(new Set(companyOptions.map(o => o.label)))}
            onClear={() => setSelectedCompanies(new Set())}
            icon={<Truck size={16} className="text-blue-500" />}
          />
        </div>
      </div>

      {bulkUpdateMode && (
        <div className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-white font-black text-center text-lg">{bulkUpdateMode === 'status' ? 'تعديل الحالة جماعياً' : 'تغيير الشركة'}</h3>
            {bulkUpdateMode === 'status' ? (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setBulkValue(k)} className={`w-full py-4 rounded-xl font-black text-[12px] border-2 transition-all ${bulkValue === k ? STATUS_COLORS[k as OrderStatus] : 'bg-slate-800 text-slate-400'}`}>{v}</button>
                ))}
              </div>
            ) : (
              <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-center font-black outline-none focus:border-purple-500" placeholder="اسم الشركة..." value={bulkValue} onChange={e => setBulkValue(e.target.value)} />
            )}
            <div className="flex gap-2 pt-4">
               <button onClick={executeBulkUpdate} className="flex-1 bg-green-600 py-4 rounded-xl font-black text-white shadow-xl hover:bg-green-500 transition-colors">تحديث الكل</button>
               <button onClick={() => setBulkUpdateMode(null)} className="flex-1 bg-slate-800 py-4 rounded-xl text-slate-400 font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase border-b border-slate-800">
              <tr>
                <th className="p-3 w-8" onClick={() => { if(selectedIds.size === filtered.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map(o => o.id))); }}>
                   <div className={`w-5 h-5 mx-auto rounded-lg flex items-center justify-center cursor-pointer transition-all ${selectedIds.size === filtered.length && filtered.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800'}`}>{selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={14}/> : <Square size={14}/>}</div>
                </th>
                <th className="p-3 w-8 text-center">م</th>
                <th className="p-3 w-12 text-center">الطلب</th>
                <th className="p-3 min-w-[150px]">بيانات الشحن</th>
                <th className="p-3 text-center w-52">تواصل</th>
                <th className="p-3 w-36 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-bold">
              {filtered.map(order => (
                <tr key={order.id} className={`transition-all hover:bg-white/5 cursor-pointer ${ROW_COLORS[order.status]} ${selectedIds.has(order.id) ? 'bg-blue-500/10' : ''}`} onClick={() => onViewDetail(order)}>
                  <td className="p-2 text-center" onClick={(e) => { e.stopPropagation(); handleToggleSet(order.id, selectedIds, setSelectedIds); }}>
                    <div className={`w-5 h-5 mx-auto rounded-lg flex items-center justify-center transition-all ${selectedIds.has(order.id) ? 'bg-blue-600 text-white' : 'bg-slate-950 border border-slate-800'}`}>{selectedIds.has(order.id) ? <CheckSquare size={14}/> : <Square size={14}/>}</div>
                  </td>
                  <td className="p-1 text-center"><div className="text-[9px] font-black text-slate-500 bg-slate-800/50 w-6 h-6 flex items-center justify-center rounded-full mx-auto">{order.sequence}</div></td>
                  <td className="p-1 text-center">
                    <div className="w-11 h-11 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden mx-auto shadow-inner group relative" onClick={(e) => { e.stopPropagation(); if(order.orderImage) setPreviewImage(order.orderImage); else onViewDetail(order); }}>
                      {order.orderImage ? <img src={order.orderImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-800" size={14} />}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-white font-black text-[12px]">
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-black">#{order.orderId || '---'}</span>
                        <span className="truncate max-w-[120px]">{order.country || '---'}</span>
                        <button onClick={(e) => startInlineEdit(e, order)} className="p-1 bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors" title="تعديل العنوان"><MapPin size={10}/></button>
                      </div>
                      
                      {inlineEditingId === order.id ? (
                        <div className="flex items-center gap-1 mt-1 animate-in slide-in-from-right-1" onClick={e => e.stopPropagation()}>
                           <input autoFocus className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-[10px] text-white outline-none w-32 font-black" value={inlineAddressValue} onChange={e => setInlineAddressValue(e.target.value)} />
                           <button onClick={(e) => saveInlineEdit(e, order.id)} className="p-1 bg-green-600 rounded-md text-white"><CheckCircle2 size={10}/></button>
                           <button onClick={(e) => {e.stopPropagation(); setInlineEditingId(null);}} className="p-1 bg-slate-800 rounded-md text-slate-400"><X size={10}/></button>
                        </div>
                      ) : (
                        order.detailedAddress && <div className="text-[10px] text-slate-500 font-bold italic truncate max-w-[150px]">📍 {order.detailedAddress}</div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-black">{order.deliveryCompany || 'غير محدد'}</div>
                        <div className="text-green-500 text-[11px] font-black">{order.price}$</div>
                        {order.status === OrderStatus.CANCELLED_DELIVERY_PAYMENT && order.paidAmount > 0 && (
                          <div className="text-purple-400 text-[9px] font-black bg-purple-500/10 px-1.5 rounded border border-purple-500/20">تحصيل: {order.paidAmount}$</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1.5 justify-center">
                       <button onClick={() => window.location.href = whatsappService.generateDirectChatLink(order.phoneNumber)} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all" title="دردشة"><MessageCircle size={14}/></button>
                       <button onClick={() => { storageService.markAsContacted(order.id); refreshList(); window.location.href = whatsappService.generateLink(order); }} className={`p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all ${order.isContacted ? 'bg-slate-800 text-green-500 border-green-500/20' : 'bg-green-600 text-white border-green-700'}`} title="إرسال إشعار"><Send size={14}/></button>
                       <button onClick={() => { if(isPremium) { storageService.markManagerContacted(order.id, 1); refreshList(); window.location.href = whatsappService.generateManagerReportLink(order, managerPhone); } else onShowPremiumModal(); }} className={`p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all ${order.isManager1Contacted ? 'bg-slate-800 text-purple-500 border-purple-500/20' : 'bg-purple-600 text-white border-purple-700'}`} title="مدير 1"><UserCheck size={14}/></button>
                       {managerPhone2 && (
                         <button onClick={() => { if(isPremium) { storageService.markManagerContacted(order.id, 2); refreshList(); window.location.href = whatsappService.generateManagerReportLink(order, managerPhone2); } else onShowPremiumModal(); }} className={`p-2.5 rounded-xl border shadow-lg active:scale-90 transition-all ${order.isManager2Contacted ? 'bg-slate-800 text-amber-500 border-amber-500/20' : 'bg-amber-600 text-white border-amber-700'}`} title="مدير 2"><UserCheck size={14}/></button>
                       )}
                    </div>
                  </td>
                  <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setEditingOrderId(order.id)} className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black border-2 transition-all active:scale-95 shadow-md ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]} <ChevronDown size={12} />
                      </button>
                      {order.statusReason && <div className="text-[8px] text-slate-500 italic truncate max-w-[120px] mx-auto bg-slate-950/50 px-1.5 rounded-full">س: {order.statusReason}</div>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingOrderId && (
        <div className="fixed inset-0 bg-black/95 z-[5000] flex items-center justify-center p-6 backdrop-blur-md">
           <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
               {!pendingStatus ? (
                 <div className="grid grid-cols-1 gap-3 animate-in zoom-in-95">
                   <h3 className="text-white font-black text-center mb-2 font-black">تحديث حالة الطلب</h3>
                   {Object.entries(STATUS_LABELS).map(([k, v]) => (
                     <button key={k} onClick={() => { if(k === OrderStatus.DELIVERED) { storageService.updateOrderStatus(editingOrderId, k as OrderStatus, '', 0); refreshList(); setEditingOrderId(null); } else { setPendingStatus(k as OrderStatus); setPaidAmount(0); } }} className={`w-full py-5 rounded-2xl font-black text-sm border-2 shadow-xl ${STATUS_COLORS[k as OrderStatus]}`}>{v}</button>
                   ))}
                   <button onClick={() => setEditingOrderId(null)} className="p-4 text-slate-500 font-black text-sm text-center w-full hover:text-white transition-colors">إلغاء النافذة</button>
                 </div>
               ) : (
                 <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-white font-black text-lg">تحديث: {STATUS_LABELS[pendingStatus]}</h3>
                    {pendingStatus === OrderStatus.CANCELLED_DELIVERY_PAYMENT && (
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 font-black px-1">المبلغ المحصل ($)</label>
                        <input type="number" value={paidAmount || ''} onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-lg font-black outline-none focus:border-purple-500" placeholder="0.00" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-black px-1">السبب / الملاحظة</label>
                      <textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-xs font-bold min-h-[120px] outline-none" placeholder="اكتب السبب هنا..." />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { storageService.updateOrderStatus(editingOrderId, pendingStatus, statusReason, paidAmount); refreshList(); setEditingOrderId(null); setPendingStatus(null); setStatusReason(''); }} className="flex-1 bg-green-600 py-4 rounded-xl font-black text-white hover:bg-green-500 shadow-xl transition-colors">تأكيد</button>
                       <button onClick={() => setPendingStatus(null)} className="flex-1 bg-slate-800 py-4 rounded-xl text-slate-400 font-black">رجوع</button>
                    </div>
                 </div>
               )}
            </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;
