import { useEffect, useState, FormEvent } from 'react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_sold_out: boolean
}

function AdminMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      window.location.href = '/admin/login'
      return
    }
    fetchMenus()
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchMenus = async () => {
    try {
      const response = await fetch('/admin/api/v1/menus', {
        headers: getAuthHeaders(),
      })
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      if (!response.ok) throw new Error('메뉴를 불러올 수 없습니다.')
      const data = await response.json()
      setMenus(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCategory('')
    setImageUrl('')
    setEditingItem(null)
    setShowForm(false)
  }

  const openEditForm = (item: MenuItem) => {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description)
    setPrice(item.price.toString())
    setCategory(item.category)
    setImageUrl(item.image_url || '')
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const payload = {
      name,
      description,
      price: parseInt(price, 10),
      category,
      image_url: imageUrl || undefined,
    }

    try {
      const url = editingItem
        ? `/admin/api/v1/menus/${editingItem.id}`
        : '/admin/api/v1/menus'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('메뉴 저장에 실패했습니다.')

      resetForm()
      fetchMenus()
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const toggleSoldOut = async (item: MenuItem) => {
    try {
      const response = await fetch(`/admin/api/v1/menus/${item.id}/sold-out`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_sold_out: !item.is_sold_out }),
      })

      if (!response.ok) throw new Error('품절 상태 변경에 실패했습니다.')
      fetchMenus()
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const deleteMenu = async (id: string) => {
    if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/admin/api/v1/menus/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error('메뉴 삭제에 실패했습니다.')
      fetchMenus()
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  if (loading) return <div className="loading">메뉴를 불러오는 중...</div>

  return (
    <div className="admin-menu-page">
      <header className="admin-header">
        <h1>🍽️ 메뉴 관리</h1>
        <div className="header-actions">
          <a href="/admin/dashboard" className="nav-link">대시보드</a>
          <button onClick={() => setShowForm(true)} className="add-btn">
            + 메뉴 추가
          </button>
        </div>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? '메뉴 수정' : '새 메뉴 추가'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="menu-name">메뉴명</label>
                <input
                  id="menu-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="menu-desc">설명</label>
                <textarea
                  id="menu-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="menu-price">가격 (원)</label>
                <input
                  id="menu-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="menu-category">카테고리</label>
                <input
                  id="menu-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 메인, 사이드, 음료"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="menu-image">이미지 URL (선택)</label>
                <input
                  id="menu-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  취소
                </button>
                <button type="submit" className="save-btn">
                  {editingItem ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="menu-table">
        <thead>
          <tr>
            <th>메뉴명</th>
            <th>카테고리</th>
            <th>가격</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((item) => (
            <tr key={item.id} className={item.is_sold_out ? 'sold-out-row' : ''}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.price.toLocaleString()}원</td>
              <td>
                <button
                  onClick={() => toggleSoldOut(item)}
                  className={`sold-out-toggle ${item.is_sold_out ? 'is-sold-out' : ''}`}
                >
                  {item.is_sold_out ? '품절' : '판매중'}
                </button>
              </td>
              <td>
                <button onClick={() => openEditForm(item)} className="edit-btn">
                  수정
                </button>
                <button onClick={() => deleteMenu(item.id)} className="delete-btn">
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {menus.length === 0 && (
        <p className="empty-state">등록된 메뉴가 없습니다. 메뉴를 추가해주세요.</p>
      )}
    </div>
  )
}

export default AdminMenuPage
