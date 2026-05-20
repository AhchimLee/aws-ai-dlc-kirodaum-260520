import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { MenuCategory, MenuItem, CartItem } from '../types';

export function MenuPage() {
  const nav = useNavigate();
  const config = storage.getConfig()!;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>(storage.getCart());

  useEffect(() => {
    api.get<{ categories: MenuCategory[] }>(`/api/v1/stores/${config.store_id}/menus`)
      .then(data => setCategories(data.categories))
      .catch(() => setError('메뉴를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [config.store_id]);

  const addToCart = (menu: MenuItem) => {
    const updated = [...cart];
    const idx = updated.findIndex(c => c.menu.id === menu.id);
    if (idx >= 0) updated[idx].quantity++;
    else updated.push({ menu, quantity: 1 });
    setCart(updated);
    storage.setCart(updated);
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>📋 메뉴</h1>
        <button onClick={() => nav('/orders')} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: '#2563eb' }}>
          주문내역
        </button>
      </div>

      {categories.map(cat => (
        <div key={cat.name} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, borderBottom: '2px solid #e5e7eb', paddingBottom: 6 }}>{cat.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {cat.items.map(item => (
              <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, opacity: item.is_sold_out ? 0.5 : 1 }}>
                {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />}
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{item.description}</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{item.price.toLocaleString()}원</div>
                {item.is_sold_out ? (
                  <div style={{ color: 'red', fontSize: 12, marginTop: 6 }}>품절</div>
                ) : (
                  <button onClick={() => addToCart(item)} style={{ marginTop: 8, width: '100%', padding: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                    담기
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 하단 장바구니 바 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1f2937', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🛒 {cartCount}개 · {cart.reduce((s, c) => s + c.menu.price * c.quantity, 0).toLocaleString()}원</span>
        <button onClick={() => nav('/cart')} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer' }}>
          장바구니 보기
        </button>
      </div>
    </div>
  );
}
