import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { storage } from '../storage';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';
import { AdminAuth } from '../types';

export function AdminLogin() {
  const nav = useNavigate();
  const toast = useToast();
  const [storeSlug, setStoreSlug] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<AdminAuth>('/admin/api/v1/auth/login', { store_slug: storeSlug, username, password });
      storage.setAdmin(res);
      nav('/admin/dashboard');
    } catch (e: any) {
      toast(e?.detail || '로그인에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>관리자 로그인</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>매장 식별자</label>
          <input value={storeSlug} onChange={e => setStoreSlug(e.target.value)} placeholder="my-store" required />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>사용자명</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>비밀번호</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary btn-full" style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <Spinner size={18} />}
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <button onClick={() => nav('/setup')} className="btn-ghost btn-full" style={{ marginTop: 12 }}>
        ← 고객 화면으로
      </button>
    </div>
  );
}
