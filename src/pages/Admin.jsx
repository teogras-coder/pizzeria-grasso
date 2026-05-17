import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderCard from '@/components/admin/OrderCard';
import MenuManager from '@/components/admin/MenuManager';
import SettingsManager from '@/components/admin/SettingsManager';
import { getOrders, getSettings } from '@/lib/apiClient';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('ordini');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(getSettings());

  const refresh = () => {
    setOrders(getOrders());
    setSettings(getSettings());
  };

  useEffect(() => {
    setIsLoading(true);
    refresh();
    setIsLoading(false);
    window.addEventListener('orders-updated', refresh);
    window.addEventListener('settings-updated', refresh);
    const interval = setInterval(refresh, 10000);
    return () => {
      window.removeEventListener('orders-updated', refresh);
      window.removeEventListener('settings-updated', refresh);
      clearInterval(interval);
    };
  }, []);

  const activeOrders = orders.filter(o => o.status !== 'consegnato' && o.status !== 'annullato');

  return (
    <div className="min-h-screen bg-background pb-6">
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="px-4 py-4">
        {activeTab === 'ordini' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-accent">
                Ordini ({activeOrders.length} attivi)
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-heading ${
                settings.isOpen
                  ? 'bg-green-500/20 text-green-600'
                  : 'bg-red-500/20 text-red-600'
              }`}>
                {settings.isOpen ? '🟢 Aperta' : '🔴 Chiusa'}
              </span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground font-body py-8">Nessun ordine</p>
            ) : (
              orders.map(order => <OrderCard key={order.id} order={order} onUpdate={refresh} />)
            )}
          </div>
        )}
        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'impostazioni' && <SettingsManager />}
      </div>
    </div>
  );
}
