
import React from 'react';
import { OrderStatus, Stats } from '../types';
import { TrendingUp, CheckCircle, Clock, XCircle, Ban, DollarSign } from 'lucide-react';

interface StatsGridProps {
  stats: Stats;
  onFilter: (status: OrderStatus | 'all') => void;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats, onFilter }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onFilter('all')}
          className="bg-slate-800 p-6 rounded-2xl border border-slate-700 cursor-pointer hover:border-slate-500 transition-all group shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <TrendingUp className="text-blue-500 w-6 h-6" />
            </div>
            <span className="text-slate-500 text-sm font-bold">إجمالي الطلبات</span>
          </div>
          <div className="text-3xl font-black">{stats.totalOrders}</div>
        </div>

        <div 
          onClick={() => onFilter(OrderStatus.PENDING)}
          className="bg-slate-800 p-6 rounded-2xl border border-slate-700 cursor-pointer hover:border-slate-500 transition-all shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-700/30 rounded-xl">
              <Clock className="text-slate-400 w-6 h-6" />
            </div>
            <span className="text-slate-500 text-sm font-bold">قيد الانتظار</span>
          </div>
          <div className="text-3xl font-black">{stats.pendingOrders}</div>
        </div>

        <div 
          onClick={() => onFilter(OrderStatus.DELIVERED)}
          className="bg-slate-800 p-6 rounded-2xl border border-slate-700 cursor-pointer hover:border-green-500/50 transition-all shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CheckCircle className="text-green-500 w-6 h-6" />
            </div>
            <span className="text-slate-500 text-sm font-bold">تم التوصيل</span>
          </div>
          <div className="text-3xl font-black">{stats.deliveredOrders}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'ملغاة', count: stats.cancelledOrders, icon: XCircle, color: 'text-red-500', status: OrderStatus.CANCELLED },
          { label: 'مؤجلة', count: stats.postponedOrders, icon: Clock, color: 'text-blue-400', status: OrderStatus.POSTPONED },
          { label: 'لم يدفع', count: stats.notPaidOrders, icon: Ban, color: 'text-orange-500', status: OrderStatus.NOT_PAID },
          { label: 'ملغاة دفع', count: stats.cancelledDeliveryPaymentOrders, icon: Ban, color: 'text-purple-500', status: OrderStatus.CANCELLED_DELIVERY_PAYMENT },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              onClick={() => onFilter(item.status)}
              className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
            >
              <div className={`p-2 rounded-lg bg-slate-700/50 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold">{item.label}</div>
                <div className="text-xl font-black">{item.count}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-6 rounded-2xl border border-green-500/20 shadow-xl">
        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          ملخص الإيرادات المالية
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-sm text-slate-400 mb-1 font-bold">إجمالي قيمة الطلبات</div>
            <div className="text-2xl font-black">{stats.totalRevenue.toFixed(2)} $</div>
          </div>
          <div className="border-r border-slate-700 pr-8">
            <div className="text-sm text-slate-400 mb-1 font-bold">المبلغ المحصل كاش</div>
            <div className="text-2xl font-black text-green-500">{stats.totalCashInHand.toFixed(2)} $</div>
          </div>
          <div className="border-r border-slate-700 pr-8 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div className="text-sm text-slate-400 mb-1 flex items-center gap-1 font-bold">
              الصافي النهائي للمحل
              <div className="group relative">
                 <span className="cursor-help text-xs text-slate-500 underline decoration-dotted">؟</span>
                 <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-[10px] p-3 rounded-xl border border-slate-700 w-56 z-[200] shadow-2xl leading-relaxed">
                   الصافي = (سعر الموصل + مبالغ الملغاة) - (1$ عن كل موصل/ملغى دفع/لم يدفع)
                 </div>
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400">{stats.netRevenue.toFixed(2)} $</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
