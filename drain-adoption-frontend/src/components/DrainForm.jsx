import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ImageUpload from './ImageUpload';
import LocationPicker from './LocationPicker';
import API_BASE_URL from '../config/api';
import './DrainStyles.css';

const DrainForm = ({ drainId, existingDrain, onSuccess }) => {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getToken, isAdmin } = useAuth();

  useEffect(() => {
    if (existingDrain) {
      setName(existingDrain.name);
      setImageUrl(existingDrain.imageUrl);
      setLatitude(existingDrain.latitude);
      setLongitude(existingDrain.longitude);
    }
  }, [existingDrain]);

  const handleLocationChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin()) {
      toast.error('Only admins can create or edit drains');
      return;
    }

    // Validate location is selected
    if (!latitude || !longitude) {
      toast.error('Please select a location on the map');
      return;
    }

    setLoading(true);

    const drainData = {
      name,
      imageUrl,
      latitude: typeof latitude === 'number' ? latitude : parseFloat(latitude),
      longitude: typeof longitude === 'number' ? longitude : parseFloat(longitude)
    };

    try {
      const token = getToken();
      const url = drainId 
        ? `${API_BASE_URL}/api/drains/${drainId}`
        : `${API_BASE_URL}/api/drains`;
      
      const method = drainId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(drainData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Failed to ${drainId ? 'update' : 'create'} drain`);
      }

      const data = await response.json();
      toast.success(`Drain ${drainId ? 'updated' : 'created'} successfully!`);
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate('/drains');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="drain-form-container">
        <div className="error-message">
          Only administrators can create or edit drains.
        </div>
      </div>
    );
  }

  return (
    <div className="drain-form-container">
      <div className="drain-form-card">
        <button onClick={() => navigate('/drains')} className="back-button">
          â† Back to List
        </button>
        <h2>{drainId ? 'Edit Drain' : 'Create New Drain'}</h2>
        <form onSubmit={handleSubmit} className="drain-form">
          <div className="form-group">
            <label htmlFor="name">Drain Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Main Street Drain"
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUpload">Drain Image *</label>
            <ImageUpload
              imageUrl={imageUrl}
              onImageUpload={setImageUrl}
              disabled={loading}
            />
            {!imageUrl && <p className="field-hint">Please upload an image of the drain</p>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Drain Location *</label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleLocationChange}
              disabled={loading}
            />
            {(!latitude || !longitude) && (
              <p className="field-hint">Please select a location on the map</p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : (drainId ? 'Update Drain' : 'Create Drain')}
            </button>
            <button 
              type="button" 
              className="cancel-button" 
              onClick={() => navigate('/drains')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DrainForm;

