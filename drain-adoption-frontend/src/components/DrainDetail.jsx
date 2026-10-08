import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LocationViewer from './LocationViewer';
import CommentSection from './CommentSection';
import API_BASE_URL from '../config/api';
import 'react-toastify/dist/ReactToastify.css';

const DrainDetail = () => {
  const [drain, setDrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userHasAdoptedDrain, setUserHasAdoptedDrain] = useState(false);
  const [adoptedDrainName, setAdoptedDrainName] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken, isAdmin } = useAuth();

  const fetchDrainDetails = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/drains/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch drain details');
      }
      const data = await response.json();
      setDrain(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [id]);

  // Check if user has already adopted a drain
  const checkUserAdoptedDrain = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/drains`);
      if (response.ok) {
        const allDrains = await response.json();
        const userAdoptedDrain = allDrains.find(d => d.adoptedByUserId === user.userId);
        
        if (userAdoptedDrain && userAdoptedDrain.id !== parseInt(id)) {
          setUserHasAdoptedDrain(true);
          setAdoptedDrainName(userAdoptedDrain.name);
        } else {
          setUserHasAdoptedDrain(false);
          setAdoptedDrainName('');
        }
      }
    } catch (err) {
      console.error('Error checking adopted drains:', err);
    }
  }, [user, id]);

  useEffect(() => {
    fetchDrainDetails();
    checkUserAdoptedDrain();
  }, [fetchDrainDetails, checkUserAdoptedDrain]);

  const adoptDrain = async () => {
    if (!user) {
      toast.error('Please login to adopt a drain');
      navigate('/login');
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/drains/${id}/adopt?userId=${user.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to adopt drain');
      }
      
      toast.success('Successfully adopted the drain!');
      fetchDrainDetails();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${drain.name}"?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/drains/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete drain');
      }

      toast.success('Drain deleted successfully');
      navigate('/drains');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <div>Loading drain details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!drain) return <div>No drain found</div>;

  return (
    <div className="drain-detail">
      <button onClick={() => navigate('/drains')} className="back-button">
        â† Back to List
      </button>
      <div className="detail-header">
        <h2>{drain.name}</h2>
        {isAdmin() && (
          <div className="admin-actions">
            <Link to={`/drains/${id}/edit`} className="edit-button">
              Edit
            </Link>
            <button onClick={handleDelete} className="delete-button">
              Delete
            </button>
          </div>
        )}
      </div>
      <div className="drain-info">
        <img src={drain.imageUrl} alt={drain.name} className="drain-image" />
        <div className="map-section">
          <LocationViewer 
            latitude={drain.latitude} 
            longitude={drain.longitude}
            name={drain.name}
          />
          <div className="map-links">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${drain.latitude},${drain.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="google-maps-link"
            >
              <img 
                src="https://maps.gstatic.com/mapfiles/maps_lite/images/2x/ic_plus_code.png" 
                alt="Google Maps Icon" 
                className="maps-icon"
              />
              Open in Google Maps
            </a>
          </div>
        </div>
        <div className="drain-status">
          <p>
            Status: {
              drain.adoptedByUserId 
                ? (user && drain.adoptedByUserId === user.userId 
                    ? 'âœ… Adopted by You' 
                    : 'ðŸ”’ Adopted')
                : 'ðŸ†“ Available'
            }
          </p>
        </div>
        {!drain.adoptedByUserId && !userHasAdoptedDrain && (
          <button 
            onClick={adoptDrain}
            className="adopt-button"
          >
            Adopt this Drain
          </button>
        )}
        {!drain.adoptedByUserId && userHasAdoptedDrain && (
          <div className="already-adopted-message">
            <p>âš ï¸ You have already adopted a drain: <strong>{adoptedDrainName}</strong></p>
            <p>Each user can only adopt one drain at a time.</p>
          </div>
        )}
        {drain.adoptedByUserId && user && drain.adoptedByUserId === user.userId && (
          <div className="your-drain-message">
            <p>âœ… This is your adopted drain! Keep up the great work maintaining it.</p>
          </div>
        )}
      </div>

      {/* Comment Section - visible for adopted drains */}
      <CommentSection 
        drainId={id}
        isAdopted={!!drain.adoptedByUserId}
        isAdopter={user && drain.adoptedByUserId === user.userId}
      />
    </div>
  );
};

export default DrainDetail;
