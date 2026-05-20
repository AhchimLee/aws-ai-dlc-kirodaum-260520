import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/Modal';
import { PageLoader } from '../components/Spinner';
import { Order } from '../types';

interface SessionHistory {
  session: { id: string; table_id: string; store_id: string; status: string; started_at: string; closed_at: string | null };
  orders: Order[];
}

export function AdminSessions() {
  const nav = useNavigate();
  const toast = useToast();
  const admin = storage.getAdmin()!;
  const authHeader = { Authorization: `Bearer ${admin.token}` };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);
  const [historyTableId, setHistoryTableId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchOrders = () => { api.get<Order[]>('/admin/api/v1/orders', authHeader).then(setOrders).finally(() => setLoading(false)); };
  useEffect(() => { fetchOrders(); }, []);

  const tables = [...new Set(orders.map(o => o.table_id))];

  const confirmClose = async () => {
    if (!closeTarget) return;
    try {
      await api.post(`/admin/api/v1/sessions/${closeTarget}/close`, undefined, authHeader);
      toast('세션 종료됨', 'success');
      fetchOrders();
    } catch (e: any) { toast(e?.detail || '세션 종료 실패', 'error'); }
    setCloseTarget(null);
  };

  const viewHistory = async (tableId: string) => {
    setHistoryTableId(tableId);
    setHistoryLoading(true);
    try { setHistory(await api.get<SessionHistory[]>(`/admin/api/v1/sessions/${tableId}/history`, authHeader)); }
    catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>🪑 테이블 세션</h1>
        <button className="btn-ghost btn-sm" onClick={() => nav('/admin/dashboard')}>← 대시보드</button>
      </div>

      {tables.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', marginTop: 40 }}>활성 테이블이 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {tables.map(tableId => {
            const tableOrders = orders.filter(o => o.table_id === tableId);
            const total = tableOrders.reduce((s, o) => s + o.total_amount, 0);
            return (
              <div key={tableId} className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>🪑 {tableId.slice(0, 8)}...</div>
                <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 12 }}>주문 {tableOrders.length}건 · {total.toLocaleString()}원</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setCloseTarget(tableId)}>이용 완료</button>
                  <button className="btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => viewHistory(tableId)}>과거 내역</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal open={!!closeTarget} title="세션 종료" message="이 테이블의 세션을 종료하시겠습니까? 주문 내역이 과거 이력으로 이동됩니다." confirmText="이용 완료" danger onConfirm={confirmClose} onCancel={() => setCloseTarget(null)} />

      {/* History Modal */}
      {historyTableId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40, zIndex: 100 }} onClick={() => setHistoryTableId(null)}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 560, width: '90%', maxHeight: '80vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>📜 과거 세션</h2>
              <button className="btn-ghost btn-sm" onClick={() => setHistoryTableId(null)}>✕</button>
            </div>
            {historyLoading ? <p>로딩 중...</p> : history.length === 0 ? <p style={{ color: 'var(--color-gray-400)' }}>과거 내역이 없습니다.</p> : (
              history.map(h => (
                <div key={h.session.id} style={{ marginBottom: 16, padding: 12, background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 8 }}>
                    {h.session.status === 'CLOSED' ? '✅' : '🟢'} {new Date(h.session.started_at).toLocaleString('ko-KR')}
                    {h.session.closed_at && ` → ${new Date(h.session.closed_at).toLocaleString('ko-KR')}`}
                  </div>
                  {h.orders.map(order => (
                    <div key={order.id} style={{ padding: '4px 0', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{order.order_number} · {order.items.map(i => `${i.menu_name}×${i.quantity}`).join(', ')}</span>
                      <span style={{ fontWeight: 600 }}>{order.total_amount.toLocaleString()}원</span>
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
