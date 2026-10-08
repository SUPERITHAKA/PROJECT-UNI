import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './components/Home';
import DrainList from './components/DrainList';
import DrainDetail from './components/DrainDetail';
import DrainForm from './components/DrainForm';
import Login from './components/Login';
import Register from './components/Register';
import Notifications from './components/Notifications';
import API_BASE_URL from './config/api';
import './components/DrainStyles.css';

function Navigation() {
  const { user, logout, getToken, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAdmin()) return;
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (user && isAdmin()) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin, getToken]);

  const navClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="brand">
          <span className="brand-mark">D</span>
          <span className="brand-copy">
            <strong>Drain Adoption</strong>
            <small>Community stormwater care</small>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Main navigation">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/drains" className={navClass}>Find Drains</NavLink>
          {user && <NavLink to="/my-drain" className={navClass}>My Drain</NavLink>}
          {isAdmin() && <NavLink to="/drains/new" className={navClass}>Add Drain</NavLink>}
          {isAdmin() && (
            <NavLink to="/notifications" className={navClass}>
              Notifications
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <span className="user-chip">{user.name || user.email}</span>
              <button onClick={handleLogout} className="header-button ghost">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="header-button ghost">Sign in</Link>
              <Link to="/register" className="header-button primary">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function DrainFormWrapper() {
  const { id } = useParams();
  const [existingDrain, setExistingDrain] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDrain = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/drains/${id}`);
        if (!response.ok) throw new Error('Failed to fetch drain');
        setExistingDrain(await response.json());
      } catch (error) {
        console.error('Error fetching drain:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDrain();
  }, [id]);

  if (loading) return <div className="page-state">Loading drain data...</div>;
  return <DrainForm drainId={id} existingDrain={existingDrain} />;
}

function MyDrain() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [drain, setDrain] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/drains`);
        if (!response.ok) throw new Error('Failed to load drains');
        const drains = await response.json();
        setDrain(drains.find((item) => String(item.adoptedByUserId) === String(user.userId)) || null);
      } catch (error) {
        console.error('Error loading adopted drain:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="empty-page">
        <div className="empty-card">
          <span className="empty-icon">↳</span>
          <h1>Sign in to see your drain</h1>
          <p>Your adopted drain will appear here after you sign in.</p>
          <Link className="primary-action" to="/login">Sign in</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-state">Finding your adopted drain...</div>;
  if (drain) return <Navigate to={`/drains/${drain.id}`} replace />;

  return (
    <div className="empty-page">
      <div className="empty-card">
        <span className="empty-icon">+</span>
        <h1>You have not adopted a drain yet</h1>
        <p>Browse the available drains and choose one that is convenient for you to maintain.</p>
        <Link className="primary-action" to="/drains">Find a drain</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/drains" element={<DrainList />} />
              <Route path="/my-drain" element={<MyDrain />} />
              <Route path="/drains/new" element={<DrainForm />} />
              <Route path="/drains/:id/edit" element={<DrainFormWrapper />} />
              <Route path="/drains/:id" element={<DrainDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </main>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

