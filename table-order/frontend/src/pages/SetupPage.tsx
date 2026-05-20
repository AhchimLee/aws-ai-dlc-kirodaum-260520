import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

export function SetupPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [storeSlug, setStoreSlug] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug.trim() || !tableNumber.trim()) return;
    setLoading(true);
    try {
      // Use the table login endpoint to get store_id and table_id
      const res = await api.post<{ store_id: string; table_id: string; session_id?: string }>(
        '/api/v1/table-login',
        { store_slug: storeSlug.trim(), table_number: Number(tableNumber) }
      );
      storage.setConfig({ store_id: res.store_id, table_id: res.table_id, session_id: res.session_id });
      nav('/menu');
    } catch {
      // Fallback: try direct UUID mode if table-login doesn't exist
      // This means the API might not have this endpoint yet
      toast('매장 또는 테이블을 찾을 수 없습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Table Order</h1>
        <p style={{ color: 'var(--color-gray-500)', marginTop: 4 }}>테이블 주문 시스템</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>매장 코드</label>
          <input value={storeSlug} onChange={e => setStoreSlug(e.target.value)} placeholder="예: tasty, dragon, sushi, morning" required />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>테이블 번호</label>
          <input type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="예: 1" min="1" max="10" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary btn-full" style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <Spinner size={18} />}
          {loading ? '접속 중...' : '메뉴 보기 →'}
        </button>
      </form>

      <div className="card" style={{ marginTop: 16, padding: 16, fontSize: 13, color: 'var(--color-gray-500)' }}>
        <strong style={{ color: 'var(--color-gray-700)' }}>테스트 매장 목록:</strong>
        <ul style={{ marginTop: 6, paddingLeft: 16, lineHeight: 1.8 }}>
          <li><code>tasty</code> — 맛있는식당 (한식)</li>
          <li><code>dragon</code> — 용궁반점 (중식)</li>
          <li><code>sushi</code> — 스시오마카세 (일식)</li>
          <li><code>morning</code> — 모닝카페 (카페)</li>
        </ul>
        <p style={{ marginTop: 6 }}>테이블 번호: 1~10</p>
      </div>

      <button onClick={() => nav('/admin/login')} className="btn-ghost btn-full" style={{ marginTop: 12 }}>
        관리자 로그인
      </button>
    </div>
  );
}
