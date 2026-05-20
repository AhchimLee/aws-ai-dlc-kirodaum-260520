import { useEffect, useState, useRef } from 'react'

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

const STATUS_FLOW: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  CONFIRMED: '확인됨',
  PREPARING: '조리중',
  READY: '완료',
  SERVED: '서빙됨',
  CANCELLED: '취소됨',
}

function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      window.location.href = '/admin/login'
      return
    }

    fetchOrders(token)
    connectSSE(token)

    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  const fetchOrders = async (token: string) => {
    try {
      const response = await fetch('/admin/api/v1/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.status === 401) {
        localStorage.removeItem('admin_token')
        window.location.href = '/admin/login'
        return
      }
      if (!response.ok) throw new Error('주문 목록을 불러올 수 없습니다.')
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      console.error(err)
    }
  }

  const connectSSE = (token: string) => {
    const eventSource = new EventSource(
      `/admin/api/v1/sse/orders?token=${token}`
    )

    eventSource.onopen = () => setConnected(true)

    eventSource.addEventListener('order_created', (event) => {
      const newOrder: Order = JSON.parse(event.data)
      setOrders((prev) => [newOrder, ...prev])
    })

    eventSource.addEventListener('order_updated', (event) => {
      const updatedOrder: Order = JSON.parse(event.data)
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      )
    })

    eventSource.onerror = () => {
      setConnected(false)
      eventSource.close()
      setTimeout(() => connectSSE(token), 5000)
    }

    eventSourceRef.current = eventSource
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    try {
      const response = await fetch(`/admin/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('상태 변경에 실패했습니다.')

      const updatedOrder = await response.json()
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('정말 이 주문을 취소하시겠습니까?')) return
    await updateOrderStatus(orderId, 'CANCELLED')
  }

  const groupedByTable = orders.reduce<Record<string, Order[]>>((acc, order) => {
    if (!acc[order.table_id]) acc[order.table_id] = []
    acc[order.table_id].push(order)
    return acc
  }, {})

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    window.location.href = '/admin/login'
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>📊 주문 관리 대시보드</h1>
        <div className="header-actions">
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 실시간 연결됨' : '🔴 연결 끊김'}
          </span>
          <a href="/admin/menus" className="nav-link">메뉴 관리</a>
          <button onClick={handleLogout} className="logout-btn">로그아웃</button>
        </div>
      </header>

      <div className="table-grid">
        {Object.entries(groupedByTable)
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .map(([tableId, tableOrders]) => (
            <div key={tableId} className="table-card">
              <h2>테이블 {tableId}</h2>
              <ul className="table-orders">
                {tableOrders
                  .filter((o) => o.status !== 'SERVED' && o.status !== 'CANCELLED')
                  .map((order) => (
                    <li key={order.id} className="order-item">
                      <div className="order-meta">
                        <span className={`status status-${order.status.toLowerCase()}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="order-time">
                          {new Date(order.created_at).toLocaleTimeString('ko-KR')}
                        </span>
                      </div>
                      <ul className="order-items-list">
                        {order.items.map((item, idx) => (
                          <li key={idx}>
                            {item.menu_item_name} x{item.quantity}
                          </li>
                        ))}
                      </ul>
                      <div className="order-actions">
                        {STATUS_FLOW[order.status] && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, STATUS_FLOW[order.status])
                            }
                            className="status-btn"
                          >
                            → {STATUS_LABELS[STATUS_FLOW[order.status]]}
                          </button>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'SERVED' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="cancel-btn"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>

      {orders.length === 0 && (
        <p className="empty-state">현재 주문이 없습니다. 새 주문을 기다리는 중...</p>
      )}
    </div>
  )
}

export default AdminDashboardPage
