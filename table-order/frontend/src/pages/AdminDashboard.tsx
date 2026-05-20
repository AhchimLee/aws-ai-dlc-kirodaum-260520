import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { Order } from '../types';

const STATUS_LABEL: Record<string, string> = {
  PENDING: '⏳ 대기',
  PREPARING: '🍳 준비중',
  COMPLETED: '✅ 완료',
  CANCELLED: '❌ 취소',
  REJECTED: '🚫 거절',
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'PREPARING',
  PREPARING: 'COMPLETED',
};

export function AdminDashboard() {
  const nav = useNavigate();
  const admin = storage.getAdmin()!;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const authHeader = { Authorization: `Bearer ${admin.token}` };

  const fetchOrders = () => {
    api.get<Order[]>('/admin/api/v1/orders', authHeader)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    // SSE connection
    const es = new EventSource(`/admin/api/v1/sse/orders?token=${admin.token}`);
    eventSourceRef.current = es;

    es.addEventListener('order_created', () => fetchOrders());
    es.addEventListener('order_status_changed', () => fetchOrders());
    es.addEventListener('session_closed', () => fetchOrders());

    return () => es.close();
  }, []);

  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/api/v1/orders/${orderId}/status`, { status: newStatus }, authHeader);
      fetchOrders();
    } catch {}
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`주문 ${orderNumber}을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/api/v1/orders/${orderId}`, authHeader);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch {}
  };

  const logout = () => {
    storage.clearAdmin();
    nav('/admin/login');
  };

  // Group orders by table
  const byTable = orders.reduce<Record<string, Order[]>>((acc, o) => {
    (acc[o.table_id] ||= []).push(o);
    return acc;
  }, {});

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>📊 주문 대시보드</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => nav('/admin/menus')} style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>메뉴관리</button>
          <button onClick={() => nav('/admin/sessions')} style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>세션관리</button>
          <button onClick={logout} style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: 'red' }}>로그아웃</button>
        </div>
      </div>

      {loading && <p>로딩 중...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {Object.entries(byTable).map(([tableId, tableOrders]) => {
          const activeOrders = tableOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED');
          const totalAmount = tableOrders.reduce((s, o) => s + o.total_amount, 0);

          return (
            <div key={tableId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>🪑 테이블 {tableId.slice(0, 8)}...</span>
                <span style={{ fontSize: 13, color: '#6b7280' }}>총 {totalAmount.toLocaleString()}원</span>
              </div>

              {(activeOrders.length > 0 ? activeOrders : tableOrders.slice(0, 3)).map(order => (
                <div key={order.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{order.order_number}</span>
                    <span>{STATUS_LABEL[order.status]}</span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 11, margin: '2px 0' }}>
                    {new Date(order.created_at).toLocaleTimeString('ko-KR')} · {order.items.map(i => `${i.menu_name}×${i.quantity}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>{order.total_amount.toLocaleString()}원</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {NEXT_STATUS[order.status] && (
                        <button onClick={() => changeStatus(order.id, NEXT_STATUS[order.status])} style={{ padding: '3px 8px', fontSize: 11, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
                          → {STATUS_LABEL[NEXT_STATUS[order.status]]}
                        </button>
                      )}
                      <button onClick={() => deleteOrder(order.id, order.order_number)} style={{ padding: '3px 8px', fontSize: 11, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {!loading && orders.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center', marginTop: 40 }}>아직 주문이 없습니다.</p>}
    </div>
  );
}
