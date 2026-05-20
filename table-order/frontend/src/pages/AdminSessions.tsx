import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { Order } from '../types';

interface SessionInfo {
  id: string;
  table_id: string;
  store_id: string;
  status: string;
  started_at: string;
  closed_at: string | null;
}

interface SessionHistory {
  session: SessionInfo;
  orders: Order[];
}

export function AdminSessions() {
  const nav = useNavigate();
  const admin = storage.getAdmin()!;
  const authHeader = { Authorization: `Bearer ${admin.token}` };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyTableId, setHistoryTableId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchOrders = () => {
    api.get<Order[]>('/admin/api/v1/orders', authHeader)
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  // Get unique tables with active orders
  const tables = [...new Set(orders.map(o => o.table_id))];

  const closeSession = async (tableId: string) => {
    if (!confirm(`테이블 ${tableId.slice(0, 8)}...의 세션을 종료(이용 완료)하시겠습니까?\n주문 내역이 과거 이력으로 이동됩니다.`)) return;
    try {
      await api.post(`/admin/api/v1/sessions/${tableId}/close`, undefined, authHeader);
      fetchOrders();
    } catch (e: any) {
      alert(e?.detail || '세션 종료에 실패했습니다.');
    }
  };

  const viewHistory = async (tableId: string) => {
    setHistoryTableId(tableId);
    setHistoryLoading(true);
    try {
      const data = await api.get<SessionHistory[]>(`/admin/api/v1/sessions/${tableId}/history`, authHeader);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>🪑 테이블 세션 관리</h1>
        <button onClick={() => nav('/admin/dashboard')} style={{ padding: '6px 12px', cursor: 'pointer' }}>← 대시보드</button>
      </div>

      {loading ? <p>로딩 중...</p> : tables.length === 0 ? (
        <p style={{ color: '#6b7280' }}>활성 테이블이 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {tables.map(tableId => {
            const tableOrders = orders.filter(o => o.table_id === tableId);
            const total = tableOrders.reduce((s, o) => s + o.total_amount, 0);
            return (
              <div key={tableId} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>🪑 {tableId.slice(0, 8)}...</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>주문 {tableOrders.length}건 · 총 {total.toLocaleString()}원</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => closeSession(tableId)} style={{ flex: 1, padding: '8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    이용 완료
                  </button>
                  <button onClick={() => viewHistory(tableId)} style={{ flex: 1, padding: '8px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                    과거 내역
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {historyTableId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40, zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>📜 과거 세션 내역</h2>
              <button onClick={() => setHistoryTableId(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {historyLoading ? <p>로딩 중...</p> : history.length === 0 ? <p style={{ color: '#6b7280' }}>과거 내역이 없습니다.</p> : (
              history.map(h => (
                <div key={h.session.id} style={{ marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                    세션: {h.session.status} | 시작: {new Date(h.session.started_at).toLocaleString('ko-KR')}
                    {h.session.closed_at && ` | 종료: ${new Date(h.session.closed_at).toLocaleString('ko-KR')}`}
                  </div>
                  {h.orders.map(order => (
                    <div key={order.id} style={{ padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontWeight: 600 }}>{order.order_number}</span>
                      <span style={{ marginLeft: 8 }}>{order.total_amount.toLocaleString()}원</span>
                      <span style={{ marginLeft: 8, color: '#6b7280' }}>{order.items.map(i => `${i.menu_name}×${i.quantity}`).join(', ')}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
