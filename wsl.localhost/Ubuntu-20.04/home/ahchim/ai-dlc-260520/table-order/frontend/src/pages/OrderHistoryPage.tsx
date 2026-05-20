import { useEffect, useState } from 'react'

interface OrderItem {
  menu_item_name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  table_id: string
  status: string
  total_amount: number
  items: OrderItem[]
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  CONFIRMED: '확인됨',
  PREPARING: '조리중',
  READY: '완료',
  SERVED: '서빙됨',
  CANCELLED: '취소됨',
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const tableId = new URLSearchParams(window.location.search).get('table') || '1'
      const response = await fetch(`/api/v1/orders?table_id=${tableId}`)
      if (!response.ok) throw new Error('주문 내역을 불러올 수 없습니다.')
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">주문 내역을 불러오는 중...</div>

  return (
    <div className="order-history-page">
      <header className="page-header">
        <a href="/" className="back-link">← 메뉴</a>
        <h1>📋 주문 내역</h1>
      </header>

      {orders.length === 0 ? (
        <p className="empty">주문 내역이 없습니다.</p>
      ) : (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id} className="order-card">
              <div className="order-header">
                <span className={`status status-${order.status.toLowerCase()}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
                <span className="order-time">
                  {new Date(order.created_at).toLocaleString('ko-KR')}
                </span>
              </div>
              <ul className="order-items">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.menu_item_name} x {item.quantity} —{' '}
                    {(item.price * item.quantity).toLocaleString()}원
                  </li>
                ))}
              </ul>
              <div className="order-total">
                합계: {order.total_amount.toLocaleString()}원
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OrderHistoryPage
