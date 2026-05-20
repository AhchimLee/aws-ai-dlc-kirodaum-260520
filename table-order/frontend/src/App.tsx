import { Routes, Route, Link } from 'react-router-dom'

function HomePage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🍽️ Table Order</h1>
      <p>테이블 주문 시스템에 오신 것을 환영합니다.</p>
      <nav>
        <ul>
          <li><Link to="/menu">메뉴 보기</Link></li>
          <li><Link to="/admin/login">관리자 로그인</Link></li>
        </ul>
      </nav>
    </div>
  )
}

function MenuPage() {
  return <div style={{ padding: '20px' }}><h1>📋 메뉴</h1><p>메뉴 목록이 여기에 표시됩니다.</p></div>
}

function AdminLogin() {
  return <div style={{ padding: '20px' }}><h1>🔐 관리자 로그인</h1><p>로그인 폼</p></div>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
    </Routes>
  )
}

export default App
