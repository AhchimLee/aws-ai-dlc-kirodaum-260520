import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { PageLoader } from '../components/Spinner';
import { MenuCategory, MenuItem, CartItem } from '../types';

function MenuSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card" style={{ padding: 12 }}>
          <div className="skeleton" style={{ height: 100, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

function MenuImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{ width: '100%', height: 100, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
        🍽️
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setError(true)} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />;
}

export function MenuPage() {
  const nav = useNavigate();
  const toast = useToast();
  const config = storage.getConfig()!;
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>(storage.getCart());
  const [activeTab, setActiveTab] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ categories: MenuCategory[] }>(`/api/v1/stores/${config.store_id}/menus`)
      .then(data => { setCategories(data.categories); })
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
    toast(`${menu.name} 담김`, 'success');
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.menu.price * c.quantity, 0);

  if (loading) return <div className="page"><MenuSkeleton /></div>;
  if (error) return <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}><p style={{ color: 'var(--color-danger)' }}>{error}</p><button className="btn-primary" style={{ marginTop: 16 }} onClick={() => location.reload()}>다시 시도</button></div>;

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>📋 메뉴</h1>
        <button className="btn-ghost btn-sm" onClick={() => nav('/orders')}>주문내역</button>
      </div>

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div ref={tabsRef} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 16px', borderRadius: 999, whiteSpace: 'nowrap', fontSize: 14, fontWeight: 500,
                background: i === activeTab ? 'var(--color-primary)' : 'var(--color-gray-100)',
                color: i === activeTab ? '#fff' : 'var(--color-gray-700)',
                minHeight: 36,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu Grid */}
      {categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {categories[activeTab]?.items.map(item => (
            <div key={item.id} className="card" style={{ padding: 10, opacity: item.is_sold_out ? 0.5 : 1, position: 'relative' }}>
              <MenuImage src={item.image_url} alt={item.name} />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{item.name}</div>
                {item.description && <div style={{ color: 'var(--color-gray-500)', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                <div style={{ fontWeight: 700, marginTop: 6, fontSize: 15 }}>{item.price.toLocaleString()}원</div>
              </div>
              {item.is_sold_out ? (
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-danger)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>품절</div>
              ) : (
                <button onClick={() => addToCart(item)} className="btn-primary btn-full" style={{ marginTop: 8, padding: '10px', fontSize: 13 }}>
                  담기
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginTop: 40 }}>등록된 메뉴가 없습니다.</p>}

      {/* Bottom Cart Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-gray-800)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 12px rgba(0,0,0,0.1)' }}>
        <span style={{ fontSize: 14 }}>🛒 {cartCount}개 · <strong>{cartTotal.toLocaleString()}원</strong></span>
        <button onClick={() => nav('/cart')} className="btn-primary" style={{ padding: '10px 24px' }}>
          장바구니
        </button>
      </div>
    </div>
  );
}
