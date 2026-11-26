import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, ShieldOff, Trash2, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/ui';

const initialsFor = name => String(name || 'Reader').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');

export default function AdminUsersPage() {
  const { user: signedInUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalUsers: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users', { params: { page, limit: 20, search } });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Users could not be loaded.');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateUser = async (person, changes, successMessage) => {
    setBusyId(person._id);
    try {
      const { data } = await api.patch(`/admin/users/${person._id}`, changes);
      setUsers(rows => rows.map(row => row._id === person._id ? { ...row, ...data.user } : row));
      toast.success(successMessage);
    } catch (err) { toast.error(err.response?.data?.message || 'User could not be updated.'); }
    finally { setBusyId(''); }
  };

  const deleteUser = async person => {
    if (!window.confirm(`Delete the account for ${person.name} (${person.email})? This cannot be undone.`)) return;
    setBusyId(person._id);
    try {
      await api.delete(`/admin/users/${person._id}`);
      toast.success('User deleted.');
      if (users.length === 1 && page > 1) setPage(value => value - 1);
      else await loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'User could not be deleted.'); }
    finally { setBusyId(''); }
  };

  const submitSearch = event => { event.preventDefault(); setPage(1); setSearch(query.trim()); };

  return <div className="admin-page admin-users-page">
    <div className="admin-page-heading"><div><span className="eyebrow">CUSTOMER ACCOUNTS</span><h1>Manage users</h1><p>Search accounts, manage access, and update administrator roles.</p></div><span className="admin-heading-icon"><UsersRound size={22} /></span></div>
    <div className="admin-users-toolbar">
      <form className="admin-user-search" onSubmit={submitSearch} role="search">
        <label className="admin-search-control"><Search size={18} aria-hidden="true" /><span className="sr-only">Search users</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or email" /></label>
        <button className="button button-dark" type="submit">Search</button>
      </form>
      <span className="admin-result-count"><UsersRound size={16} /><strong>{pagination.totalUsers}</strong>{pagination.totalUsers === 1 ? 'account' : 'accounts'}</span>
    </div>
    {error && <div className="notice notice-error" role="alert">{error}<button className="admin-inline-retry" onClick={loadUsers}>Try again</button></div>}
    {loading ? <div className="loading-state"><span className="spinner" />Loading users...</div> : <section className="admin-panel admin-users-panel">
      <div className="admin-table-wrap"><table className="admin-table admin-users-table"><thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Account access</th><th>Actions</th></tr></thead><tbody>
        {users.map(person => {
          const isSelf = person._id === signedInUser?.id || person._id === signedInUser?._id;
          const busy = busyId === person._id;
          return <tr key={person._id}>
            <td><div className="admin-user-identity"><span className="admin-user-avatar" aria-hidden="true">{initialsFor(person.name)}</span><span><strong>{person.name}{isSelf ? ' (you)' : ''}</strong><small>{person.email}</small></span></div></td>
            <td><span className="admin-user-date">{new Date(person.createdAt).toLocaleDateString()}</span></td>
            <td><label className="sr-only" htmlFor={`role-${person._id}`}>Role for {person.name}</label><select className="admin-role-select" id={`role-${person._id}`} value={person.role} disabled={busy || isSelf} onChange={event => updateUser(person, { role: event.target.value }, 'User role updated.')}><option value="user">User</option><option value="admin">Admin</option></select></td>
            <td><button className={`admin-user-access ${person.isBlocked ? 'blocked' : 'enabled'}`} disabled={busy || (isSelf && !person.isBlocked)} aria-label={`${person.isBlocked ? 'Unblock' : 'Block'} ${person.name}`} onClick={() => updateUser(person, { isBlocked: !person.isBlocked }, person.isBlocked ? 'Account unblocked.' : 'Account blocked.')}><span className="admin-access-status">{person.isBlocked ? 'Blocked' : 'Active'}</span><span className="admin-access-action">{person.isBlocked ? <><ShieldCheck size={14} /> Unblock</> : <><ShieldOff size={14} /> Block</>}</span></button></td>
            <td><button className="admin-danger-button" disabled={busy || isSelf} title={isSelf ? 'You cannot delete your own account' : `Delete ${person.name}`} onClick={() => deleteUser(person)}><Trash2 size={15} /><span>Delete</span></button></td>
          </tr>;
        })}
      </tbody></table>
      {!users.length && !error && <div className="admin-users-empty"><UsersRound size={24} /><strong>No accounts found</strong><span>Try searching with another name or email.</span></div>}
      </div>
      <div className="admin-pagination"><span>{pagination.totalUsers} accounts <i>·</i> Page {page} of {pagination.totalPages || 1}</span><Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} className="admin-users-pagination" /></div>
    </section>}
  </div>;
}
