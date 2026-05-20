import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';

interface MenuItemAdmin {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  is_sold_out: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminMenus() {
  const nav = useNavigate();
  const admin = storage.getAdmin()!;
  const authHeader = { Authorization: `Bearer ${admin.token}` };

  const [items, setItems] = useState<MenuItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', image_url: '' });

  const fetchMenus = () => {
    api.get<MenuItemAdmin[]>('/admin/api/v1/menus', authHeader)
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMenus(); }, []);

  const resetForm = () => {
    setForm({ name: '', price: '', category: '', description: '', image_url: '' });
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (item: MenuItemAdmin) => {
    setForm({ name: item.name, price: String(item.price), category: item.category, description: item.description, image_url: item.image_url });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { name: form.name, price: Number(form.price), category: form.category, description: form.description, image_url: form.image_url };
    if (editId) {
      await api.put(`/admin/api/v1/menus/${editId}`, body, authHeader);
    } else {
      await api.post('/admin/api/v1/menus', body, authHeader);
    }
    resetForm();
    fetchMenus();
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`"${name}" 메뉴를 삭제하시겠습니까?`)) return;
    await api.delete(`/admin/api/v1/menus/${id}`, authHeader);
    fetchMenus();
  };

  const toggleSoldOut = async (id: string, current: boolean) => {
    await api.patch(`/admin/api/v1/menus/${id}/sold-out`, { is_sold_out: !current }, authHeader);
    fetchMenus();
  };

  // Group by category
  const grouped = items.reduce<Record<string, MenuItemAdmin[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>🍽️ 메뉴 관리</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ 메뉴 추가</button>
          <button onClick={() => nav('/admin/dashboard')} style={{ padding: '6px 12px', cursor: 'pointer' }}>← 대시보드</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px' }}>{editId ? '메뉴 수정' : '새 메뉴 추가'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="메뉴명 *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: 8 }} />
            <input placeholder="가격 *" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required style={{ padding: 8 }} />
            <input placeholder="카테고리 *" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={{ padding: 8 }} />
            <input placeholder="이미지 URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} style={{ padding: 8 }} />
          </div>
          <input placeholder="설명" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 8, marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{editId ? '수정' : '추가'}</button>
            <button type="button" onClick={resetForm} style={{ padding: '8px 16px', cursor: 'pointer' }}>취소</button>
          </div>
        </form>
      )}

      {loading ? <p>로딩 중...</p> : Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}>{cat}</h3>
          {catItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <span style={{ fontWeight: 600, opacity: item.is_sold_out ? 0.5 : 1 }}>{item.name}</span>
                <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 13 }}>{item.price.toLocaleString()}원</span>
                {item.is_sold_out && <span style={{ marginLeft: 8, color: 'red', fontSize: 11 }}>품절</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => toggleSoldOut(item.id, item.is_sold_out)} style={{ padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>{item.is_sold_out ? '판매재개' : '품절처리'}</button>
                <button onClick={() => startEdit(item)} style={{ padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>수정</button>
                <button onClick={() => deleteItem(item.id, item.name)} style={{ padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: 'red' }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {!loading && items.length === 0 && <p style={{ color: '#6b7280' }}>등록된 메뉴가 없습니다. 메뉴를 추가해주세요.</p>}
    </div>
  );
}
