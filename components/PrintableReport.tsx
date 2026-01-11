
import React from 'react';
import { Order, OrderStatus } from '../types';
import { STATUS_LABELS } from '../constants';

interface PrintableReportProps {
  orders: Order[];
  filterTitle?: string;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ orders, filterTitle }) => {
  // إحصائيات علوية شاملة لجميع الحالات (6 حالات)
  const stats = {
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
    cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    postponed: orders.filter(o => o.status === OrderStatus.POSTPONED).length,
    notPaid: orders.filter(o => o.status === OrderStatus.NOT_PAID).length,
    partial: orders.filter(o => o.status === OrderStatus.CANCELLED_DELIVERY_PAYMENT).length,
  };

  // الحسابات المالية
  const totalValue = orders.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
  const cancelledWithPay = orders.filter(o => o.status === OrderStatus.CANCELLED_DELIVERY_PAYMENT);
  const notPaid = orders.filter(o => o.status === OrderStatus.NOT_PAID);

  const cashInHand = deliveredOrders.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0) + 
                     cancelledWithPay.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  
  const totalActions = deliveredOrders.length + cancelledWithPay.length + notPaid.length;
  const deliveryFees = totalActions * 1; 
  const netDue = cashInHand - deliveryFees;

  // الحالات التي ستظهر جداولها (نخفي 'تم التوصيل' بناء على طلب المستخدم)
  const reportStatuses = [
    OrderStatus.CANCELLED_DELIVERY_PAYMENT,
    OrderStatus.NOT_PAID,
    OrderStatus.POSTPONED,
    OrderStatus.CANCELLED,
    OrderStatus.PENDING
  ];

  return (
    <div id="printable-content" className="arabic-text" style={{ 
      direction: 'rtl', 
      padding: '25px', 
      backgroundColor: '#ffffff', 
      color: '#000000',
      width: '790px',
      margin: '0 auto'
    }}>
      <style>{`
        #printable-content * { color: #000000 !important; font-family: 'Noto Sans Arabic', sans-serif; }
        .pdf-header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .pdf-title { font-size: 30px; font-weight: 900; margin: 0; color: #1e293b !important; }
        .pdf-badge { background: #1e293b; color: #fff !important; padding: 6px 30px; border-radius: 30px; display: inline-block; margin-top: 10px; font-size: 14px; font-weight: 900; }
        
        .all-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 20px 0; }
        .stat-card { border: 2px solid #000; border-radius: 12px; padding: 8px; text-align: center; }
        .stat-val { font-size: 20px; font-weight: 900; display: block; }
        .stat-txt { font-size: 8px; font-weight: 900; display: block; margin-top: 2px; }

        .fin-summary { width: 100%; border: 4px solid #000; border-radius: 15px; border-collapse: collapse; margin-bottom: 30px; overflow: hidden; }
        .fin-summary th { background: #000; color: #fff !important; padding: 10px; font-size: 16px; font-weight: 900; }
        .fin-summary td { border: 2px solid #000; padding: 15px; text-align: center; }
        .fin-label { font-size: 11px; font-weight: 900; color: #64748b !important; display: block; margin-bottom: 5px; }
        .fin-amount { font-size: 24px; font-weight: 900; }

        .status-section-head { padding: 10px 15px; color: #fff !important; font-weight: 900; font-size: 14px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; margin-top: 25px; }
        .table-data { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-data th { border: 1.5px solid #000; padding: 8px; font-size: 10px; background: #f8fafc; font-weight: 900; }
        .table-data td { border: 1.5px solid #000; padding: 8px; font-size: 10px; text-align: center; font-weight: 700; }
      `}</style>

      <div className="pdf-header">
        <h1 className="pdf-title">كشف مالي تفصيلي (Madzo)</h1>
        <div className="pdf-badge">{filterTitle || "كشف الدورة الحالية"}</div>
      </div>

      <div className="all-stats-grid">
        <div className="stat-card" style={{borderColor: '#16a34a'}}><span className="stat-val">{stats.delivered}</span><span className="stat-txt">مسلم</span></div>
        <div className="stat-card" style={{borderColor: '#9333ea'}}><span className="stat-val">{stats.partial}</span><span className="stat-txt">ملغى دفع</span></div>
        <div className="stat-card" style={{borderColor: '#f97316'}}><span className="stat-val">{stats.notPaid}</span><span className="stat-txt">لم يدفع</span></div>
        <div className="stat-card" style={{borderColor: '#2563eb'}}><span className="stat-val">{stats.postponed}</span><span className="stat-txt">مؤجل</span></div>
        <div className="stat-card" style={{borderColor: '#dc2626'}}><span className="stat-val">{stats.cancelled}</span><span className="stat-txt">ملغى</span></div>
        <div className="stat-card" style={{borderColor: '#64748b'}}><span className="stat-val">{stats.pending}</span><span className="stat-txt">بالانتظار</span></div>
      </div>

      <table className="fin-summary">
        <thead>
          <tr><th colSpan={4}>الملخص المالي النهائي (شامل المسلّم)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="fin-label">قيمة البضاعة الكلية</span><span className="fin-amount">$ {totalValue.toFixed(2)}</span></td>
            <td><span className="fin-label">المبلغ المحصل كاش</span><span className="fin-amount" style={{color: '#16a34a !important'}}>$ {cashInHand.toFixed(2)}</span></td>
            <td><span className="fin-label">خصم التوصيل</span><span className="fin-amount" style={{color: '#dc2626 !important'}}>$ {deliveryFees.toFixed(2)}</span></td>
            <td style={{backgroundColor: '#f0fdf4'}}><span className="fin-label" style={{color: '#16a34a !important'}}>الصافي للمحل</span><span className="fin-amount" style={{color: '#16a34a !important'}}>$ {netDue.toFixed(2)}</span></td>
          </tr>
        </tbody>
      </table>

      <div style={{ padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '11px', marginBottom: '15px', fontWeight: '900', textAlign: 'center' }}>
        ملاحظة: الطلبات "التي تم توصيلها" مخفية من القوائم التفصيلية ومحسوبة في الإيرادات أعلاه.
      </div>

      {reportStatuses.map(status => {
        const statusOrders = orders.filter(o => o.status === status);
        if (statusOrders.length === 0) return null;

        const colors: any = {
          [OrderStatus.PENDING]: '#64748b',
          [OrderStatus.NOT_PAID]: '#f97316',
          [OrderStatus.CANCELLED]: '#dc2626',
          [OrderStatus.POSTPONED]: '#2563eb',
          [OrderStatus.CANCELLED_DELIVERY_PAYMENT]: '#9333ea'
        };

        return (
          <div key={status} style={{ pageBreakInside: 'avoid' }}>
            <div className="status-section-head" style={{ backgroundColor: colors[status] }}>
              <span>الحالة: {STATUS_LABELS[status]}</span>
              <span>العدد: {statusOrders.length}</span>
            </div>
            <table className="table-data">
              <thead>
                <tr>
                  <th style={{width: '30px'}}>م</th>
                  <th style={{width: '90px'}}>رقم الشحن</th>
                  <th style={{width: '120px'}}>المنطقة</th>
                  <th>الملاحظة / السبب</th>
                  <th style={{width: '70px'}}>السعر</th>
                  {status === OrderStatus.CANCELLED_DELIVERY_PAYMENT && <th style={{width: '70px'}}>التحصيل</th>}
                </tr>
              </thead>
              <tbody>
                {statusOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.sequence}</td>
                    <td style={{fontWeight: '900'}}>{o.orderId || '---'}</td>
                    <td>{o.country}</td>
                    <td style={{textAlign: 'right'}}>{o.statusReason || o.note || '---'}</td>
                    <td style={{fontWeight: '900'}}>{o.price} $</td>
                    {status === OrderStatus.CANCELLED_DELIVERY_PAYMENT && (
                      <td style={{color: '#16a34a', fontWeight: '900'}}>{o.paidAmount} $</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default PrintableReport;
