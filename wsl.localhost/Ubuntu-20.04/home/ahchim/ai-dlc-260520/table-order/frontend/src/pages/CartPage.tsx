import { useState, useEffect } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(cart)
  }, [])

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      )
      .filter((item) => item.quantity > 0)

    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id)
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const generateIdempotencyKey = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  const placeOrder = async () => {
    if (cartItems.length === 0) return

    setIsOrdering(true)
    try {
      const tableId = new URLSearchParams(window.location.search).get('table') || '1'
      const idempotencyKey = generateIdempotencyKey()

      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          table_id: tableId,
          items: cartItems.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '주문에 실패했습니다.')
      }

      localStorage.removeItem('cart')
      setCartItems([])
      setOrderSuccess(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : '주문 중 오류가 발생했습니다.')
    } finally {
      setIsOrdering(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="order-success">
        <h1>✅ 주문 완료!</h1>
        <p>주문이 접수되었습니다. 잠시만 기다려주세요.</p>
        <a href="/">메뉴로 돌아가기</a>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <header className="page-header">
        <a href="/" className="back-link">← 메뉴</a>
        <h1>🛒 장바구니</h1>
      </header>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>장바구니가 비어있습니다.</p>
          <a href="/">메뉴 보러가기</a>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {cartItems.map((item) => (
              <li key={item.id} className="cart-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                </div>
                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    aria-label={`${item.name} 수량 감소`}
                  >
                    −
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label={`${item.name} 수량 증가`}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="remove-btn"
                    aria-label={`${item.name} 삭제`}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-summary">
            <div className="total">
              <span>합계</span>
              <span className="total-price">{totalPrice.toLocaleString()}원</span>
            </div>
            <button
              onClick={placeOrder}
              disabled={isOrdering}
              className="order-btn"
            >
              {isOrdering ? '주문 중...' : '주문하기'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CartPage
