import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/Modal';
import { PageLoader } from '../components/Spinner';
import { Order } from '../types';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기', PREPARING: '준비중', COMPLETED: '완료', CANCELLED: '취소', REJECTED: '거절' };
const STATUS_BADGE: Record<string, string> = { PENDING: 'badge-pending', PREPARING: 'badge-preparing', COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled', REJECTED: 'badge-rejected' };
const NEXT_STATUS: Record<string, string> = { PENDING: 'PREPARING', PREPARING: 'COMPLETED' };

export function AdminDashboard() {
  const nav = useNavigate();
  const toast = useToast();
  const admin = storage.getAdmin()!;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('active');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const prevOrderCountRef = useRef(0);

  const authHeader = { Authorization: `Bearer ${admin.token}` };

  const fetchOrders = () => {
    api.get<Order[]>('/admin/api/v1/orders', authHeader)
      .then(data => {
        // Detect new orders
        if (prevOrderCountRef.current > 0 && data.length > prevOrderCountRef.current) {
          const existingIds = new Set(orders.map(o => o.id));
          const newIds = data.filter(o => !existingIds.has(o.id)).map(o => o.id);
          setNewOrderIds(new Set(newIds));
          toast('🔔 새 주문이 들어왔습니다!', 'info');
          setTimeout(() => setNewOrderIds(new Set()), 6000);
        }
        prevOrderCountRef.current = data.length;
        setOrders(data);
      })
      .catch(() => toast('주문 목록을 불러올 수 없습니다', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const es = new EventSource(`/admin/api/v1/sse/orders?token=${admin.token}`);
    es.addEventListener('order_created', () => fetchOrders());
    es.addEventListener('order_status_changed', () => fetchOrders());
    es.addEventListener('session_closed', () => fetchOrders());
    return () => es.close();
  }, []);

  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/api/v1/orders/${orderId}/status`, { status: newStatus }, authHeader);
      fetchOrders();
      toast(`주문 상태 → ${STATUS_LABEL[newStatus]}`, 'success');
    } catch { toast('상태 변경 실패', 'error'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/api/v1/orders/${deleteTarget.id}`, authHeader);
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      toast('주문 삭제됨', 'success');
    } catch { toast('삭제 실패', 'error'); }
    setDeleteTarget(null);
  };

  const logout = () => { storage.clearAdmin(); nav('/admin/login'); };

  // Filter orders
  const filtered = orders.filter(o => {
    if (filter === 'active') return o.status === 'PENDING' || o.status === 'PREPARING';
    if (filter === 'completed') return o.status === 'COMPLETED';
    return true;
  });

  // Group by table
  const byTable = filtered.reduce<Record<string, Order[]>>((acc, o) => {
    (acc[o.table_id] ||= []).push(o);
    return acc;
  }, {});

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>📊 주문 대시보드</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-ghost btn-sm" onClick={() => nav('/admin/menus')}>메뉴관리</button>
          <button className="btn-ghost btn-sm" onClick={() => nav('/admin/sessions')}>세션관리</button>
          <button className="btn-ghost btn-sm" onClick={logout} style={{ color: 'var(--color-danger)' }}>로그아웃</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['active', '진행중'], ['completed', '완료'], ['all', '전체']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
              background: filter === key ? 'var(--color-gray-800)' : 'var(--color-gray-100)',
              color: filter === key ? '#fff' : 'var(--color-gray-600)',
            }}
          >
            {label} {key === 'active' && `(${orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length})`}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {Object.entries(byTable).map(([tableId, tableOrders]) => {
          const totalAmount = tableOrders.reduce((s, o) => s + o.total_amount, 0);
          return (
            <div key={tableId} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--color-gray-100)' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>🪑 테이블 {tableId.slice(0, 8)}</span>
                <span style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>{totalAmount.toLocaleString()}원</span>
              </div>

              {tableOrders.map(order => (
                <div key={order.id} className={newOrderIds.has(order.id) ? 'pulse' : ''} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-gray-50)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{order.order_number}</span>
                    <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                  </div>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: 12, marginBottom: 6 }}>
                    {new Date(order.created_at).toLocaleTimeString('ko-KR')} · {order.items.map(i => `${i.menu_name}×${i.quantity}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{order.total_amount.toLocaleString()}원</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {NEXT_STATUS[order.status] && (
                        <button onClick={() => changeStatus(order.id, NEXT_STATUS[order.status])} className="btn-primary btn-sm">
                          → {STATUS_LABEL[NEXT_STATUS[order.status]]}
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(order)} className="btn-sm" style={{ background: 'var(--color-gray-100)', color: 'var(--color-danger)' }}>
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

      {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', marginTop: 60, fontSize: 15 }}>표시할 주문이 없습니다.</p>}

      <ConfirmModal
        open={!!deleteTarget}
        title="주문 삭제"
        message={`주문 ${deleteTarget?.order_number}을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
