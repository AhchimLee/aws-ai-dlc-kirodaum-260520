import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { PageLoader } from '../components/Spinner';
import { Order } from '../types';

const STATUS_BADGE: Record<string, string> = { PENDING: 'badge-pending', PREPARING: 'badge-preparing', COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled', REJECTED: 'badge-rejected' };
const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', PREPARING: '준비중', COMPLETED: '완료', CANCELLED: '취소', REJECTED: '거절' };

export function OrdersPage() {
  const nav = useNavigate();
  const config = storage.getConfig()!;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config.session_id) { setLoading(false); return; }
    api.get<{ orders: Order[] }>(`/api/v1/sessions/${config.session_id}/orders`)
      .then(data => setOrders(data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [config.session_id]);

  if (loading) return <PageLoader />;

  return (
    <div className="page page-narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>📜 주문 내역</h1>
        <button className="btn-ghost btn-sm" onClick={() => nav('/menu')}>← 메뉴</button>
      </div>

      {!config.session_id || orders.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ color: 'var(--color-gray-500)' }}>아직 주문 내역이 없습니다</p>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{order.order_number}</span>
              <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginBottom: 10 }}>
              {new Date(order.created_at).toLocaleString('ko-KR')}
            </div>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '3px 0' }}>
                <span>{item.menu_name} × {item.quantity}</span>
                <span style={{ color: 'var(--color-gray-600)' }}>{(item.unit_price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-gray-100)', marginTop: 10, paddingTop: 10, textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
              {order.total_amount.toLocaleString()}원
            </div>
          </div>
        ))
      )}
    </div>
  );
}
