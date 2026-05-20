import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../storage';

export function SetupPage() {
  const nav = useNavigate();
  const existing = storage.getConfig();
  const [storeId, setStoreId] = useState(existing?.store_id || '');
  const [tableId, setTableId] = useState(existing?.table_id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId.trim() || !tableId.trim()) return;
    storage.setConfig({ store_id: storeId.trim(), table_id: tableId.trim() });
    nav('/menu');
  };

  return (
    <div className="page page-narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Table Order</h1>
        <p style={{ color: 'var(--color-gray-500)', marginTop: 4 }}>테이블 주문 시스템</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>매장 ID</label>
          <input value={storeId} onChange={e => setStoreId(e.target.value)} placeholder="Store UUID" required />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>테이블 ID</label>
          <input value={tableId} onChange={e => setTableId(e.target.value)} placeholder="Table UUID" required />
        </div>
        <button type="submit" className="btn-primary btn-full" style={{ fontSize: 16 }}>
          메뉴 보기 →
        </button>
      </form>

      <button onClick={() => nav('/admin/login')} className="btn-ghost btn-full" style={{ marginTop: 12 }}>
        관리자 로그인
      </button>
    </div>
  );
}
