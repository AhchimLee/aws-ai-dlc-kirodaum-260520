import { useEffect, useState } from 'react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_sold_out: boolean
}

interface GroupedMenus {
  [category: string]: MenuItem[]
}

function CustomerMenuPage() {
  const [menus, setMenus] = useState<GroupedMenus>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/v1/menus')
      if (!response.ok) throw new Error('메뉴를 불러오는데 실패했습니다.')
      const data: MenuItem[] = await response.json()

      const grouped = data.reduce<GroupedMenus>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
      }, {})

      setMenus(grouped)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item: MenuItem) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingIndex = cart.findIndex((c: { id: string }) => c.id === item.id)

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1
    } else {
      cart.push({ ...item, quantity: 1 })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    alert(`${item.name}이(가) 장바구니에 추가되었습니다.`)
  }

  if (loading) return <div className="loading">메뉴를 불러오는 중...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="customer-menu-page">
      <header className="page-header">
        <h1>🍽️ 메뉴</h1>
        <a href="/cart" className="cart-link">🛒 장바구니</a>
      </header>

      {Object.entries(menus).map(([category, items]) => (
        <section key={category} className="menu-category">
          <h2>{category}</h2>
          <div className="menu-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className={`menu-card ${item.is_sold_out ? 'sold-out' : ''}`}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="menu-image" />
                )}
                <div className="menu-info">
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <p className="price">{item.price.toLocaleString()}원</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.is_sold_out}
                  aria-label={`${item.name} 장바구니에 추가`}
                >
                  {item.is_sold_out ? '품절' : '담기'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default CustomerMenuPage
