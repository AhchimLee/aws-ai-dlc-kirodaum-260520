import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { Order } from '../types';

const STATUS_LABEL: Record<string, string> = {
  PENDING: '⏳ 대기중',
  PREPARING: '🍳 준비중',
  COMPLETED: '✅ 완료',
  CANCELLED: '❌ 취소',
  REJECTED: '🚫 거절',
};

export function OrdersPage() {
  const nav = useNavigate();
  const config = storage.getConfig()!;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!config.session_id) {
      setLoading(false);
      return;
    }
    api.get<{ orders: Order[] }>(`/api/v1/sessions/${config.session_id}/orders`)
      .then(data => setOrders(data.orders))
      .catch(() => setError('주문 내역을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [config.session_id]);

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>📜 주문 내역</h1>
        <button onClick={() => nav('/menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}>← 메뉴</button>
      </div>

      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !config.session_id && <p style={{ color: '#6b7280' }}>아직 주문한 내역이 없습니다.</p>}
      {!loading && orders.length === 0 && config.session_id && <p style={{ color: '#6b7280' }}>이 세션에 주문 내역이 없습니다.</p>}

      {orders.map(order => (
        <div key={order.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>{order.order_number}</span>
            <span style={{ fontSize: 13 }}>{STATUS_LABEL[order.status] || order.status}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            {new Date(order.created_at).toLocaleString('ko-KR')}
          </div>
          {order.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
              <span>{item.menu_name} × {item.quantity}</span>
              <span>{(item.unit_price * item.quantity).toLocaleString()}원</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 8, textAlign: 'right', fontWeight: 600 }}>
            {order.total_amount.toLocaleString()}원
          </div>
        </div>
      ))}
    </div>
  );
}
