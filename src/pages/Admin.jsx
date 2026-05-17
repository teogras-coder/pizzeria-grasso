import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderCard from '@/components/admin/OrderCard';
import MenuManager from '@/components/admin/MenuManager';
import SettingsPanel from '@/components/admin/SettingsPanel';
import CouponManager from '@/components/admin/CouponManager';
import { getOrders } from '@/lib/apiClient';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('ordini');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    setOrders(getOrders());
  };

  useEffect(() => {
    setIsLoading(true);
    refresh();
    setIsLoading(false);
    window.addEventListener('orders-updated', refresh);
    const interval = setInterval(refresh, 10000);
    return () => {
      window.removeEventListener('orders-updated', refresh);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-6">
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="px-4 py-4">
        {activeTab === 'ordini' && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-bold text-accent">
              Ordini ({orders.filter(o => o.status !== 'consegnato' && o.status !== 'annullato').length} attivi)
            </h2>
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
        {activeTab === 'coupon' && <CouponManager />}
        {activeTab === 'impostazioni' && <SettingsPanel />}
      </div>
    </div>
  );
}
