
import React, { useState, useRef } from 'react';
import StatsGrid from '../components/StatsGrid';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { OrderStatus, Stats } from '../types';
import { FileUp, Images, Loader2, Package2, FileText, FilePlus, ImageMinus, Info } from 'lucide-react';

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
        // ضغط فائق (600 بكسل) وبجودة منخفضة لضمان استيعاب مئات الصور في ذاكرة المتصفح
        const maxWidth = 600; 
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        // جودة 0.2 هي الحل القطعي لتخزين مئات الصور
        resolve(canvas.toDataURL('image/jpeg', 0.2));
      };
    };
  });
};

interface DashboardProps {
  onNavigateToOrders: (status: OrderStatus | 'all') => void;
  onExportPDF: () => void;
  onShowPremiumModal: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToOrders, onExportPDF, onShowPremiumModal }) => {
  const [stats, setStats] = useState<Stats>(storageService.getStats());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const excelReplaceRef = useRef<HTMLInputElement>(null);
  const excelAppendRef = useRef<HTMLInputElement>(null);
  const imagesUploadRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'append') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const names = await excelService.getSheetNames(file);
      const newOrders = await excelService.parseExcel(file, names[0], mode === 'append');
      if (mode === 'replace') storageService.saveOrders(newOrders);
      else storageService.saveOrders([...storageService.getOrders(), ...newOrders]);
      setSuccess("تم تحميل ملف الإكسيل بنجاح.");
      setStats(storageService.getStats());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleBulkImagesAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    let currentOrders = storageService.getOrders();
    currentOrders.sort((a, b) => (parseInt(a.sequence) || 0) - (parseInt(b.sequence) || 0));
    
    let targetOrders = currentOrders.filter(o => !o.orderImage);
    
    if (targetOrders.length === 0) {
      setError("جميع الطلبات تملك صوراً بالفعل.");
      return;
    }

    setIsProcessing(true);
    const totalToProcess = Math.min(files.length, targetOrders.length);
    setProcessingProgress({ current: 0, total: totalToProcess });
    
    let matchedCount = 0;
    for (let i = 0; i < totalToProcess; i++) {
      try {
        const compressed = await compressImage(files[i]);
        const targetId = targetOrders[i].id;
        
        const idx = currentOrders.findIndex(o => o.id === targetId);
        if (idx !== -1) {
          currentOrders[idx].orderImage = compressed;
          matchedCount++;
          setProcessingProgress({ current: matchedCount, total: totalToProcess });
        }
      } catch (err) {
        console.error("Link error:", err);
      }
    }
    
    storageService.saveOrders(currentOrders);
    setStats(storageService.getStats());
    setSuccess(`تم ربط ${matchedCount} صورة بنجاح بنظام التسلسل.`);
    setIsProcessing(false);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-2 md:p-4 arabic-text">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-500 rounded-xl shadow-lg shadow-green-500/20"><Package2 className="w-6 h-6 text-black" /></div>
          <h1 className="text-xl font-black text-white">لوحة القيادة</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if(window.confirm("حذف الصور لتوفير مساحة؟")) { storageService.clearImages(); setStats(storageService.getStats()); setSuccess("تم مسح الصور."); } }} className="px-4 py-2 bg-red-600/10 text-red-500 rounded-xl text-xs font-black border border-red-500/20"><ImageMinus size={16}/></button>
          <button onClick={onExportPDF} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 flex items-center gap-2"><FileText size={16}/> تصدير الكشوفات PDF</button>
        </div>
      </div>

      {success && <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-xl text-green-500 text-xs font-black">{success}</div>}
      {error && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-xs font-black">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => excelReplaceRef.current?.click()} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:bg-slate-800 flex flex-col items-center justify-center gap-2 h-24">
          <FileUp className="w-5 h-5 text-red-500" />
          <span className="text-[10px] font-black text-white">استبدال إكسيل</span>
          <input type="file" ref={excelReplaceRef} onChange={(e) => handleExcelUpload(e, 'replace')} className="hidden" accept=".xlsx,.xls" />
        </button>
        <button onClick={() => excelAppendRef.current?.click()} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:bg-slate-800 flex flex-col items-center justify-center gap-2 h-24">
          <FilePlus className="w-5 h-5 text-green-500" />
          <span className="text-[10px] font-black text-white">دمج إكسيل</span>
          <input type="file" ref={excelAppendRef} onChange={(e) => handleExcelUpload(e, 'append')} className="hidden" accept=".xlsx,.xls" />
        </button>
        <button onClick={() => imagesUploadRef.current?.click()} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:bg-slate-800 flex flex-col items-center justify-center gap-2 h-24 col-span-2 shadow-inner">
          <Images className="w-5 h-5 text-blue-500" />
          <span className="text-[10px] font-black text-white">ربط الصور بالطلبات (Bulk)</span>
          <input type="file" multiple ref={imagesUploadRef} onChange={handleBulkImagesAction} className="hidden" accept="image/*" />
        </button>
      </div>

      <StatsGrid stats={stats} onFilter={onNavigateToOrders} />

      <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3 text-[10px] text-blue-400 font-bold">
        <Info size={16}/> تنبيه: تم تقليل دقة الصور تلقائياً لضمان ربط مئات الصور بنجاح داخل ذاكرة المتصفح.
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/95 z-[3000] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <div className="text-white font-black text-lg">جاري الربط والمعالجة...</div>
          <div className="text-blue-400 font-black text-2xl mt-2">{processingProgress.current} / {processingProgress.total}</div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
