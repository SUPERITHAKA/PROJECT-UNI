import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const DrainList = () => {
  const [drains, setDrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const { isAdmin, getToken, user } = useAuth();

  useEffect(() => { fetchDrains(); }, []);

  const fetchDrains = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drains`);
      if (!response.ok) throw new Error('Failed to fetch drains');
      setDrains(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrains = useMemo(() => drains.filter((drain) => {
    const matchesSearch = drain.name.toLowerCase().includes(query.toLowerCase());
    const mine = user && String(drain.adoptedByUserId) === String(user.userId);
    const matchesFilter = filter === 'all' ||
      (filter === 'available' && !drain.adoptedByUserId) ||
      (filter === 'adopted' && !!drain.adoptedByUserId) ||
      (filter === 'mine' && mine);
    return matchesSearch && matchesFilter;
  }), [drains, query, filter, user]);

  const handleDelete = async (drainId, drainName) => {
    if (!window.confirm(`Are you sure you want to delete "${drainName}"?`)) return;
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/drains/${drainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete drain');
      toast.success('Drain deleted successfully');
      fetchDrains();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="page-state">Loading drains...</div>;
  if (error) return <div className="page-state error">Error: {error}</div>;

  const availableCount = drains.filter((d) => !d.adoptedByUserId).length;
  const adoptedCount = drains.length - availableCount;

  return (
    <div className="drain-list">
      <div className="drain-page-heading">
        <div>
          <span className="page-kicker">Drain directory</span>
          <h1>Find a storm drain</h1>
          <p>Search the list, check availability, then open a drain to see its location and details.</p>
        </div>
        {isAdmin() && <Link to="/drains/new" className="create-button">+ Add drain</Link>}
      </div>

      <div className="drain-summary">
        <div><strong>{drains.length}</strong><span>Total</span></div>
        <div><strong>{availableCount}</strong><span>Available</span></div>
        <div><strong>{adoptedCount}</strong><span>Adopted</span></div>
      </div>

      <div className="drain-toolbar">
        <div className="search-box">
          <span>⌕</span>
          <input type="search" placeholder="Search drains by name..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="filter-tabs" aria-label="Drain filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'available' ? 'active' : ''} onClick={() => setFilter('available')}>Available</button>
          <button className={filter === 'adopted' ? 'active' : ''} onClick={() => setFilter('adopted')}>Adopted</button>
          {user && <button className={filter === 'mine' ? 'active' : ''} onClick={() => setFilter('mine')}>Mine</button>}
        </div>
      </div>

      {filteredDrains.length === 0 ? (
        <div className="empty-results"><strong>No drains found</strong><span>Try another search or filter.</span></div>
      ) : (
        <div className="drain-grid">
          {filteredDrains.map((drain) => {
            const mine = user && String(drain.adoptedByUserId) === String(user.userId);
            return (
              <article key={drain.id} className={`drain-card${mine ? ' mine' : ''}`}>
                <div className="drain-card-image">
                  <img src={drain.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                  <span className={`status-pill ${drain.adoptedByUserId ? 'adopted' : 'available'}`}>
                    {mine ? 'Your drain' : drain.adoptedByUserId ? 'Adopted' : 'Available'}
                  </span>
                </div>
                <div className="drain-card-body">
                  <h3>{drain.name}</h3>
                  <p className="coordinates-line">{Number(drain.latitude).toFixed(4)}, {Number(drain.longitude).toFixed(4)}</p>
                  <div className="card-actions">
                    <Link to={`/drains/${drain.id}`} className="view-button">View drain</Link>
                    {isAdmin() && <Link to={`/drains/${drain.id}/edit`} className="edit-button">Edit</Link>}
                    {isAdmin() && <button onClick={() => handleDelete(drain.id, drain.name)} className="delete-button">Delete</button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DrainList;

