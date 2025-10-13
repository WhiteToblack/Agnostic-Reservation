import React, { useEffect, useState } from 'react';
import { KpiCard, CalendarMini, QuickBook, UtilizationChart, StockAlerts, PaymentsReconcile, WidgetGrid } from '@shared/components';
import { lightTheme, darkTheme } from '@shared/theme';
import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5243/api' });

const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [parameters, setParameters] = useState<any[]>([]);

  useEffect(() => {
    client.get('/admin/parameters', { params: { tenantId: 'demo-tenant' } }).then((res) => setParameters(res.data)).catch(() => setParameters([]));
  }, []);

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <div style={{ minHeight: '100vh', padding: 24, backgroundColor: theme.colors.background, color: theme.colors.text }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Agnostic Reservation Admin</h1>
        <label>
          <input type="checkbox" checked={mode === 'dark'} onChange={(event) => setMode(event.target.checked ? 'dark' : 'light')} /> Dark mode
        </label>
      </header>
      <WidgetGrid>
        <KpiCard label="Active Tenants" value="12" tone="info" />
        <KpiCard label="New Signups" value="34" delta="▲ 8%" tone="success" />
        <CalendarMini date={new Date()} items={[{ time: '10:00', title: 'Onboarding Call' }]} />
        <QuickBook resources={[{ id: 'room-a', name: 'Room A' }, { id: 'room-b', name: 'Room B' }]} onSelect={(id) => console.log('quick book', id)} />
        <UtilizationChart utilization={[{ label: 'Week 1', value: 0.8 }, { label: 'Week 2', value: 0.76 }]} />
        <StockAlerts alerts={[{ sku: 'KIT-01', name: 'Welcome Kits', quantity: 12, reorderLevel: 20 }]} />
        <PaymentsReconcile statuses={[{ provider: 'Stripe', pending: 1, failed: 0 }]} />
      </WidgetGrid>
      <section style={{ marginTop: 32 }}>
        <h2>Tenant Parameters</h2>
        <pre style={{ background: theme.colors.surface, padding: 16, borderRadius: 12 }}>{JSON.stringify(parameters, null, 2)}</pre>
      </section>
    </div>
  );
};

export default App;
