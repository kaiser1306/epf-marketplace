import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getAdminUsers,
  suspendUser,
  activateUser,
} from '../../services/adminService'
import { formatDate } from '../../utils/format'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p = page) => {
    setLoading(true)
    const params = { page: p }
    if (role) params.role = role
    getAdminUsers(params)
      .then((res) => {
        setUsers(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, page])

  const toggleSuspend = async (user) => {
    try {
      if (user.suspended_at) {
        await activateUser(user.id)
        toast.success('Compte réactivé')
      } else {
        await suspendUser(user.id)
        toast.success('Compte suspendu')
      }
      load(page)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Action impossible')
    }
  }

  return (
    <div>
      <h1 className="page-title">Utilisateurs</h1>

      <div className="filters-bar">
        <div className="field">
          <label className="label">Rôle</label>
          <select
            className="select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Tous</option>
            <option value="buyer">Acheteur</option>
            <option value="seller">Vendeur</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Inscrit le</th>
                  <th>État</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge badge-info">{u.role}</span>
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      {u.suspended_at ? (
                        <span className="badge badge-danger">Suspendu</span>
                      ) : (
                        <span className="badge badge-success">Actif</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${u.suspended_at ? '' : 'btn-danger'}`}
                        onClick={() => toggleSuspend(u)}
                      >
                        {u.suspended_at ? 'Réactiver' : 'Suspendre'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onChange={setPage} />
        </>
      )}
    </div>
  )
}

export default AdminUsersPage
