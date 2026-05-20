import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { CartItem } from '../types';

export function CartPage() {
  const nav = useNavigate();
  const config = storage.getConfig()!;
  const [cart, setCart] = useState<CartItem[]>(storage.getCart());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
    setError('');
    const idempotencyKey = crypto.randomUUID();
    try {
      const res = await api.post<{ order_number: string; session_id: string }>(
        '/api/v1/orders',
        {
          store_id: config.store_id,
          table_id: config.table_id,
          items: cart.map(c => ({ menu_item_id: c.menu.id, quantity: c.quantity })),
        },
        { 'X-Idempotency-Key': idempotencyKey }
      );
      // Save session_id for order history
      storage.setConfig({ ...config, session_id: res.session_id });
      storage.clearCart();
      setCart([]);
      setSuccess(`주문 완료! 주문번호: ${res.order_number}`);
      setTimeout(() => nav('/menu'), 3000);
    } catch (e: any) {
      setError(e?.detail?.message || e?.detail || '주문에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>✅ {success}</h1>
        <p>3초 후 메뉴 화면으로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>🛒 장바구니</h1>
        <button onClick={() => nav('/menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}>← 메뉴</button>
      </div>

      {cart.length === 0 ? (
        <p style={{ color: '#6b7280' }}>장바구니가 비어있습니다.</p>
      ) : (
        <>
          {cart.map(c => (
            <div key={c.menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.menu.name}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{c.menu.price.toLocaleString()}원</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => changeQty(c.menu.id, -1)} style={{ width: 32, height: 32, fontSize: 18, cursor: 'pointer' }}>−</button>
                <span style={{ minWidth: 20, textAlign: 'center' }}>{c.quantity}</span>
                <button onClick={() => changeQty(c.menu.id, 1)} style={{ width: 32, height: 32, fontSize: 18, cursor: 'pointer' }}>+</button>
                <span style={{ minWidth: 70, textAlign: 'right', fontWeight: 600 }}>{(c.menu.price * c.quantity).toLocaleString()}원</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: '12px 0', borderTop: '2px solid #1f2937', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
            <span>합계</span>
            <span>{total.toLocaleString()}원</span>
          </div>

          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

          <button
            onClick={submitOrder}
            disabled={submitting}
            style={{ marginTop: 16, width: '100%', padding: 14, fontSize: 16, background: submitting ? '#9ca3af' : '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: submitting ? 'default' : 'pointer' }}
          >
            {submitting ? '주문 중...' : `주문하기 (${total.toLocaleString()}원)`}
          </button>

          <button
            onClick={() => updateCart([])}
            style={{ marginTop: 8, width: '100%', padding: 10, fontSize: 14, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}
          >
            장바구니 비우기
          </button>
        </>
      )}
    </div>
  );
}
