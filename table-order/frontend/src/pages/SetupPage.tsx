import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../storage';

export function SetupPage() {
  const nav = useNavigate();
  const existing = storage.getConfig();
  const [storeId, setStoreId] = useState(existing?.store_id || '');
  const [tableId, setTableId] = useState(existing?.table_id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId.trim() || !tableId.trim()) return;
    storage.setConfig({ store_id: storeId.trim(), table_id: tableId.trim() });
    nav('/menu');
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🍽️ 테이블 설정</h1>
      <p>매장 ID와 테이블 ID를 입력하세요.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>매장 ID (Store UUID)</label>
          <input
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            placeholder="store uuid"
            style={{ width: '100%', padding: 10, fontSize: 14, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>테이블 ID (Table UUID)</label>
          <input
            value={tableId}
            onChange={e => setTableId(e.target.value)}
            placeholder="table uuid"
            style={{ width: '100%', padding: 10, fontSize: 14, marginTop: 4 }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: 12, fontSize: 16, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          설정 완료 → 메뉴 보기
        </button>
      </form>
      <hr style={{ margin: '24px 0' }} />
      <button onClick={() => nav('/admin/login')} style={{ width: '100%', padding: 12, fontSize: 14, background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        관리자 로그인
      </button>
    </div>
  );
}
