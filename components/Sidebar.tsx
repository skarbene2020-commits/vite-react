
import React from 'react';
import { LayoutDashboard, ListOrdered, Settings, Package2, X, ChevronLeft, History } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const items = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'orders', label: 'الطلبات الحالية', icon: ListOrdered },
    { id: 'archives', label: 'الأرشيف التاريخي', icon: History },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed right-0 top-0 h-full bg-slate-900 w-80 z-[110] shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out border-l border-slate-800 flex flex-col arabic-text ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-500/20">
              <Package2 className="w-8 h-8 text-black" />
            </div>
            <span className="text-xl font-black text-white">Madzo Delivery</span>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-red-600 rounded-2xl text-white transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] transition-all font-black text-lg group ${
                  isActive 
                    ? 'bg-green-500 text-black shadow-xl shadow-green-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'text-black' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronLeft size={20} />}
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-slate-800 text-center bg-slate-950/30">
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Madzo Delivery</div>
          <div className="text-[10px] text-slate-600 font-bold">V 1.8.0 • Developed for Mohammad Ballouk</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
