import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';
import { CartItem } from '../types';

export function CartPage() {
  const nav = useNavigate();
  const toast = useToast();
  const config = storage.getConfig()!;
  const [cart, setCart] = useState<CartItem[]>(storage.getCart());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const updateCart = (items: CartItem[]) => {
    setCart(items);
    storage.setCart(items);
  };

  const changeQty = (id: string, delta: number) => {
    const updated = cart.map(c =>
      c.menu.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
    ).filter(c => c.quantity > 0);
    updateCart(updated);
  };

  const total = cart.reduce((s, c) => s + c.menu.price * c.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post<{ order_number: string; session_id: string }>(
        '/api/v1/orders',
        { store_id: config.store_id, table_id: config.table_id, items: cart.map(c => ({ menu_item_id: c.menu.id, quantity: c.quantity })) },
        { 'X-Idempotency-Key': crypto.randomUUID() }
      );
      storage.setConfig({ ...config, session_id: res.session_id });
      storage.clearCart();
      setCart([]);
      setSuccess(res.order_number);
      setTimeout(() => nav('/menu'), 3000);
    } catch (e: any) {
      toast(e?.detail?.message || e?.detail || '주문에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page page-narrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>주문 완료!</h1>
        <p style={{ color: 'var(--color-gray-500)', marginBottom: 4 }}>주문번호</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>{success}</p>
        <p style={{ color: 'var(--color-gray-400)', marginTop: 16, fontSize: 13 }}>3초 후 메뉴 화면으로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>🛒 장바구니</h1>
        <button className="btn-ghost btn-sm" onClick={() => nav('/menu')}>← 메뉴</button>
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <p style={{ color: 'var(--color-gray-500)', fontSize: 15 }}>장바구니가 비어있습니다</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => nav('/menu')}>메뉴 보러가기</button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            {cart.map((c, i) => (
              <div key={c.menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: i < cart.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.menu.name}</div>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: 13, marginTop: 2 }}>{c.menu.price.toLocaleString()}원</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => changeQty(c.menu.id, -1)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>−</button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{c.quantity}</span>
                  <button onClick={() => changeQty(c.menu.id, 1)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>+</button>
                  <span style={{ minWidth: 70, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{(c.menu.price * c.quantity).toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
              <span>총 주문금액</span>
              <span style={{ color: 'var(--color-primary)' }}>{total.toLocaleString()}원</span>
            </div>
          </div>

          <button onClick={submitOrder} disabled={submitting} className="btn-danger btn-full" style={{ fontSize: 16, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting && <Spinner size={18} />}
            {submitting ? '주문 중...' : `주문하기 · ${total.toLocaleString()}원`}
          </button>

          <button onClick={() => updateCart([])} className="btn-ghost btn-full" style={{ marginTop: 8 }}>
            장바구니 비우기
          </button>
        </>
      )}
    </div>
  );
}
