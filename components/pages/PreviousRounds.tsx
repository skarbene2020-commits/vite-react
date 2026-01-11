
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { ArchiveRound } from '../types';
import { Calendar, Trash2, DollarSign, Package, ChevronLeft, Search } from 'lucide-react';

const PreviousRounds: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveRound[]>(storageService.getArchives());
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الجولة من السجل؟")) {
      storageService.deleteArchive(id);
      setArchives(storageService.getArchives());
    }
  };

  const filteredArchives = archives.filter(a => a.date.includes(searchTerm));

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 arabic-text animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-right">
          <h1 className="text-3xl font-black text-white">الجولات السابقة</h1>
          <p className="text-slate-500 font-bold">سجل الأرشيف التاريخي للطلبات</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            className="w-full bg-slate-900 border border-slate-800 pr-10 pl-4 py-3 rounded-2xl font-bold text-white outline-none focus:ring-2 ring-green-500"
            placeholder="بحث بالتاريخ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredArchives.length === 0 ? (
        <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 text-center text-slate-600 font-black italic">
          لا توجد جولات مؤرشفة بعد
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredArchives.map((round) => (
            <div key={round.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl hover:border-slate-600 transition-all group">
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
                {/* التاريخ */}
                <div className="bg-slate-800 p-6 rounded-3xl text-center min-w-[140px] border border-slate-700">
                  <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm font-black text-white">{round.date.split(',')[0]}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1">{round.date.split(',')[1]}</div>
                </div>

                {/* الإحصائيات المختصرة */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-1">عدد الطلبات</div>
                    <div className="text-xl font-black text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-400" />
                      {round.stats.totalOrders}
                    </div>
                  </div>
                  
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-1">المبلغ المحصل</div>
                    <div className="text-xl font-black text-green-500 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {round.stats.totalCashInHand.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-1">صافي المحل</div>
                    <div className="text-xl font-black text-emerald-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {round.stats.netRevenue.toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-black uppercase mb-1">تم التوصيل</div>
                    <div className="text-xl font-black text-blue-500">
                      {round.stats.deliveredOrders}
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex gap-3">
                   <button 
                    onClick={() => handleDelete(round.id)}
                    className="p-4 bg-red-600/10 text-red-500 border border-red-600/20 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg"
                    title="حذف من السجل"
                   >
                     <Trash2 size={24} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviousRounds;
