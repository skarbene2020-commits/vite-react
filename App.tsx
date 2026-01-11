import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrdersList from './pages/OrdersList';
import OrderDetail from './pages/OrderDetail';
import PreviousRounds from './pages/PreviousRounds';
import { Order, OrderStatus } from './types';
import { storageService } from './services/storageService';
import { Save, CheckCircle, Loader2, Menu, Bell, Printer, RefreshCcw, X, Truck, Users, ImageMinus, Lock, Crown, ArrowLeft, ShieldCheck, CheckCircle2, Gem, Calendar, History, Archive, Trash2, Clock } from 'lucide-react';
import PrintableReport from './components/PrintableReport';

const App: React.FC = () => {
  const [isActivated, setIsActivated] = useState<boolean>(storageService.isActivated());
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState('');

  const [isPremium, setIsPremium] = useState<boolean>(storageService.isPremium());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumCode, setPremiumCode] = useState('');
  const [premiumError, setPremiumError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // حالة الفلاتر المستمرة
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<OrderStatus>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());

  const [managerPhone, setManagerPhone] = useState(storageService.getManagerPhone());
  const [managerPhone2, setManagerPhone2] = useState(storageService.getSecondaryManagerPhone());
  const [deliveryDate, setDeliveryDate] = useState(storageService.getDeliveryDate());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [ordersForReport, setOrdersForReport] = useState<Order[]>([]);
  const [reportTitle, setReportTitle] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleAppActivation = () => {
    if (storageService.activateApp(activationCode)) {
      setIsActivated(true);
      setActivationError('');
    } else {
      setActivationError("كود غير صحيح");
    }
  };

  const handlePremiumUpgrade = () => {
    if (storageService.upgradeToPremium(premiumCode)) {
      setIsPremium(true);
      setShowPremiumModal(false);
      setPremiumError('');
    } else {
      setPremiumError("كود الترقية غير صحيح");
    }
  };

  const checkPremiumAndExecute = (action: () => void) => {
    if (isPremium) action();
    else setShowPremiumModal(true);
  };

  const handleNavigateToOrders = (status: OrderStatus | 'all') => {
    if (status === 'all') setStatusFilters(new Set());
    else setStatusFilters(new Set([status]));
    setActiveTab('orders');
    setSelectedOrder(null);
  };

  // Fix: Added missing handleViewDetail function
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleSaveSettings = () => {
    storageService.setManagerPhone(managerPhone);
    storageService.setSecondaryManagerPhone(managerPhone2);
    storageService.setDeliveryDate(deliveryDate);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleArchiveRound = () => {
    const orders = storageService.getOrders();
    if (orders.length === 0) {
      alert("لا توجد طلبات للأرشفة.");
      return;
    }
    if (window.confirm("هل أنت متأكد من أرشفة الدورة ومسح البيانات الحالية؟")) {
      storageService.archiveCurrentRound();
      setActiveTab('archives');
    }
  };

  const generatePDF = (filteredOrders: Order[], title: string) => {
    setOrdersForReport(filteredOrders);
    setReportTitle(title);
    setIsExporting(true);
    setShowExportOptions(false);

    setTimeout(() => {
      const element = document.getElementById('printable-content');
      if (element) {
        const opt = {
          margin: 0.2,
          filename: `${title}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        (window as any).html2pdf().set(opt).from(element).save().then(() => {
          setIsExporting(false);
          setOrdersForReport([]);
        });
      }
    }, 1000);
  };

  const isAliHaider = (company?: string): boolean => {
    if (!company) return false;
    const norm = company.toLowerCase().trim();
    return norm.includes('ali') || norm.includes('haider') || norm.includes('haidar');
  };

  const handleExportOption = (option: 'ali' | 'others') => {
    const all = storageService.getOrders();
    if (option === 'ali') {
      const filtered = all.filter(o => isAliHaider(o.deliveryCompany));
      generatePDF(filtered, 'كشف شركة علي حيدر');
    } else {
      const filtered = all.filter(o => !isAliHaider(o.deliveryCompany));
      generatePDF(filtered, 'كشف شركات الديليفري الأخرى');
    }
  };

  if (!isActivated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 arabic-text">
        <div className="bg-slate-900 border-2 border-green-500/20 rounded-[3rem] w-full max-w-sm p-10 text-center shadow-2xl">
           <ShieldCheck size={48} className="text-green-500 mx-auto mb-8" />
           <h1 className="text-2xl font-black text-white mb-2">تفعيل الدخول</h1>
           <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-white text-center font-black outline-none focus:border-green-500 tracking-[0.5em] text-xl" value={activationCode} onChange={e => setActivationCode(e.target.value)} />
           {activationError && <p className="text-red-500 text-xs mt-2 font-black">{activationError}</p>}
           <button onClick={handleAppActivation} className="w-full bg-green-600 mt-6 py-4 rounded-2xl text-white font-black hover:bg-green-500 shadow-xl">تفعيل</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (selectedOrder) return <OrderDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} isPremium={isPremium} onShowPremiumModal={() => setShowPremiumModal(true)} />;
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigateToOrders={handleNavigateToOrders} onExportPDF={() => checkPremiumAndExecute(() => setShowExportOptions(true))} onShowPremiumModal={() => setShowPremiumModal(true)} />;
      case 'orders': return (
        <OrdersList 
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilters={statusFilters} setStatusFilters={setStatusFilters}
          selectedCompanies={selectedCompanies} setSelectedCompanies={setSelectedCompanies}
          selectedAreas={selectedAreas} setSelectedAreas={setSelectedAreas}
          onViewDetail={handleViewDetail} isPremium={isPremium} onShowPremiumModal={() => setShowPremiumModal(true)} 
        />
      );
      case 'archives': return <PreviousRounds />;
      case 'settings': return (
        <div className="max-w-xl mx-auto py-10 space-y-6 px-4 arabic-text">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
             <span className="text-xs font-bold text-slate-400">تاريخ انتهاء الاشتراك:</span>
             <span className="text-sm font-black text-green-500">{storageService.getExpiryDate()}</span>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-8 shadow-2xl">
             <div className="space-y-4">
               <h3 className="text-sm font-black text-green-500 flex items-center gap-2"><Clock size={18}/> موعد التوصيل الافتراضي</h3>
               <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-center font-black outline-none focus:border-green-500" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} placeholder="مثلاً: غداً، اليوم، الثلاثاء..." />
               <p className="text-[10px] text-slate-500 font-bold px-2">هذا الموعد سيظهر تلقائياً في رسالة الواتساب للزبون.</p>
             </div>

             <div className="space-y-4">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">هواتف الإدارة</h3>
               <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-center font-black outline-none mb-2" value={managerPhone} onChange={e => setManagerPhone(e.target.value)} placeholder="رقم المدير الأول" />
               <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-center font-black outline-none" value={managerPhone2} onChange={e => setManagerPhone2(e.target.value)} placeholder="رقم المدير الثاني (اختياري)" />
             </div>

             <button onClick={handleSaveSettings} className={`w-full py-5 rounded-2xl font-black text-white transition-all shadow-xl active:scale-95 ${saveSuccess ? 'bg-green-600' : 'bg-slate-800'}`}>
               {saveSuccess ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
             </button>
          </div>

          <div className="bg-red-900/10 p-8 rounded-[2.5rem] border border-red-900/20 space-y-4">
             <h3 className="text-lg font-black text-red-500 flex items-center gap-2"><Archive size={20}/> أرشفة البيانات</h3>
             <button onClick={handleArchiveRound} className="w-full py-5 bg-red-600 rounded-2xl text-white font-black text-sm shadow-lg active:scale-95">أرشفة الدورة وتصفير القائمة</button>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/95 z-[1100] flex items-center justify-center p-4 backdrop-blur-xl">
           <div className="bg-slate-900 border-2 border-yellow-500 rounded-[3rem] w-full max-w-md p-10 text-center arabic-text relative">
              <button onClick={() => setShowPremiumModal(false)} className="absolute top-6 left-6 text-slate-500"><X size={24}/></button>
              <Crown size={48} className="text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white mb-6">ترقية الحساب</h2>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-white text-center font-black outline-none focus:border-yellow-500 tracking-[0.5em] text-xl" value={premiumCode} onChange={e => setPremiumCode(e.target.value)} />
              {premiumError && <p className="text-red-500 text-xs mt-2 font-black">{premiumError}</p>}
              <button onClick={handlePremiumUpgrade} className="w-full bg-yellow-600 mt-6 py-4 rounded-2xl text-slate-950 font-black shadow-xl">تفعيل الآن</button>
           </div>
        </div>
      )}

      {showExportOptions && (
        <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md p-8 arabic-text space-y-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-white">تصدير تقرير PDF</h3>
               <button onClick={() => setShowExportOptions(false)} className="text-slate-500"><X size={20}/></button>
             </div>
             <button onClick={() => handleExportOption('ali')} className="w-full py-4 bg-slate-800 hover:bg-green-600 rounded-2xl text-white font-black">كشف شركة علي حيدر</button>
             <button onClick={() => handleExportOption('others')} className="w-full py-4 bg-slate-800 hover:bg-blue-600 rounded-2xl text-white font-black">كشف شركات أخرى</button>
          </div>
        </div>
      )}

      {isExporting && <div className="fixed inset-0 bg-black/95 z-[2000] flex flex-col items-center justify-center text-white"><Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" /><span className="font-black">جاري إنشاء ملف PDF...</span></div>}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <header className="sticky top-0 z-[50] bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 p-3 flex items-center justify-between px-6">
        <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-900 rounded-xl text-green-500"><Menu size={24} /></button>
        <div className="text-center">
          <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Madzo Delivery</span>
          <div className="w-6 h-0.5 bg-green-500 mx-auto rounded-full"></div>
        </div>
        <div className="flex items-center gap-2">{isPremium && <Crown size={20} className="text-yellow-500 animate-pulse" />}<div className="p-2 bg-slate-900 rounded-xl text-slate-600"><Bell size={20} /></div></div>
      </header>
      <main className="p-2 md:p-4 min-h-screen">
        {renderContent()}
      </main>
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '800px', background: 'white' }}>
        {ordersForReport.length > 0 && <PrintableReport orders={ordersForReport} filterTitle={reportTitle} />}
      </div>
    </div>
  );
};

export default App;