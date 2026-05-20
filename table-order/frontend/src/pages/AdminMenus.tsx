import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/Modal';
import { PageLoader } from '../components/Spinner';

interface MenuItemAdmin {
  id: string; name: string; price: number; category: string;
  description: string; image_url: string; is_sold_out: boolean;
  created_at: string; updated_at: string;
}

export function AdminMenus() {
  const nav = useNavigate();
  const toast = useToast();
  const admin = storage.getAdmin()!;
  const authHeader = { Authorization: `Bearer ${admin.token}` };

  const [items, setItems] = useState<MenuItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', image_url: '' });
  const [deleteTarget, setDeleteTarget] = useState<MenuItemAdmin | null>(null);

  const fetchMenus = () => {
    api.get<MenuItemAdmin[]>('/admin/api/v1/menus', authHeader).then(setItems).finally(() => setLoading(false));
  };
  useEffect(() => { fetchMenus(); }, []);

  const resetForm = () => { setForm({ name: '', price: '', category: '', description: '', image_url: '' }); setEditId(null); setShowForm(false); };

  const startEdit = (item: MenuItemAdmin) => {
    setForm({ name: item.name, price: String(item.price), category: item.category, description: item.description, image_url: item.image_url });
    setEditId(item.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { name: form.name, price: Number(form.price), category: form.category, description: form.description, image_url: form.image_url };
    try {
      if (editId) { await api.put(`/admin/api/v1/menus/${editId}`, body, authHeader); toast('메뉴 수정됨', 'success'); }
      else { await api.post('/admin/api/v1/menus', body, authHeader); toast('메뉴 추가됨', 'success'); }
      resetForm(); fetchMenus();
    } catch { toast('저장 실패', 'error'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/admin/api/v1/menus/${deleteTarget.id}`, authHeader); toast('삭제됨', 'success'); fetchMenus(); }
    catch { toast('삭제 실패', 'error'); }
    setDeleteTarget(null);
  };

  const toggleSoldOut = async (item: MenuItemAdmin) => {
    await api.patch(`/admin/api/v1/menus/${item.id}/sold-out`, { is_sold_out: !item.is_sold_out }, authHeader);
    toast(item.is_sold_out ? '판매 재개' : '품절 처리됨', 'success');
    fetchMenus();
  };

  const grouped = items.reduce<Record<string, MenuItemAdmin[]>>((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});

  if (loading) return <PageLoader />;

  return (
    <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>🍽️ 메뉴 관리</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>+ 추가</button>
          <button className="btn-ghost btn-sm" onClick={() => nav('/admin/dashboard')}>← 대시보드</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>{editId ? '메뉴 수정' : '새 메뉴 추가'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="메뉴명 *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="가격 *" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            <input placeholder="카테고리 *" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
            <input placeholder="이미지 URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <input placeholder="설명" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ marginTop: 10 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" className="btn-primary btn-sm">{editId ? '수정' : '추가'}</button>
            <button type="button" className="btn-ghost btn-sm" onClick={resetForm}>취소</button>
          </div>
        </form>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--color-gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cat}</h3>
          <div className="card">
            {catItems.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < catItems.length - 1 ? '1px solid var(--color-gray-100)' : 'none' }}>
                <div>
                  <span style={{ fontWeight: 600, opacity: item.is_sold_out ? 0.5 : 1 }}>{item.name}</span>
                  <span style={{ marginLeft: 8, color: 'var(--color-gray-500)', fontSize: 13 }}>{item.price.toLocaleString()}원</span>
                  {item.is_sold_out && <span className="badge badge-cancelled" style={{ marginLeft: 8 }}>품절</span>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost btn-sm" onClick={() => toggleSoldOut(item)}>{item.is_sold_out ? '재개' : '품절'}</button>
                  <button className="btn-ghost btn-sm" onClick={() => startEdit(item)}>수정</button>
                  <button className="btn-sm" style={{ background: 'var(--color-gray-100)', color: 'var(--color-danger)' }} onClick={() => setDeleteTarget(item)}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', marginTop: 40 }}>등록된 메뉴가 없습니다.</p>}

      <ConfirmModal open={!!deleteTarget} title="메뉴 삭제" message={`"${deleteTarget?.name}" 메뉴를 삭제하시겠습니까?`} confirmText="삭제" danger onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
