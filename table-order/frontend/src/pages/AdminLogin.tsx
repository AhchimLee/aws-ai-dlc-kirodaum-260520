import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { AdminAuth } from '../types';

export function AdminLogin() {
  const nav = useNavigate();
  const [storeSlug, setStoreSlug] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AdminAuth>('/admin/api/v1/auth/login', {
        store_slug: storeSlug,
        username,
        password,
      });
      storage.setAdmin(res);
      nav('/admin/dashboard');
    } catch (e: any) {
      setError(e?.detail || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 380, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1>🔐 관리자 로그인</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13 }}>매장 식별자 (slug)</label>
          <input value={storeSlug} onChange={e => setStoreSlug(e.target.value)} placeholder="my-store" style={{ width: '100%', padding: 10, marginTop: 4 }} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13 }}>사용자명</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" style={{ width: '100%', padding: 10, marginTop: 4 }} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13 }}>비밀번호</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 4 }} required />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8, fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, fontSize: 16, background: loading ? '#9ca3af' : '#1f2937', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <button onClick={() => nav('/setup')} style={{ marginTop: 16, width: '100%', padding: 10, background: 'none', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
        ← 고객 화면으로
      </button>
    </div>
  );
}
