import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import './Home.css';
import drainArtImage from '../assets/images/drain-art.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drains, setDrains] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/drains`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setDrains(Array.isArray(data) ? data : []))
      .catch(() => setDrains([]));
  }, []);

  const adopted = drains.filter((drain) => drain.adoptedByUserId).length;
  const available = Math.max(drains.length - adopted, 0);
  const previewDrains = drains.filter((drain) => !drain.adoptedByUserId).slice(0, 3);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-shell home-hero-grid">
          <div className="home-hero-copy">
            <span className="home-kicker">Cleaner streets start nearby</span>
            <h1>Find a storm drain. Adopt it. Keep it clear.</h1>
            <p>
              A simple community tool for finding local drains, taking responsibility
              for one, and sharing maintenance updates.
            </p>

            <div className="home-actions">
              <button className="home-primary" onClick={() => navigate('/drains')}>Find a drain</button>
              {!user && <button className="home-secondary" onClick={() => navigate('/register')}>Create account</button>}
              {user && <button className="home-secondary" onClick={() => navigate('/my-drain')}>Go to my drain</button>}
            </div>

            <div className="home-stats">
              <div><strong>{drains.length || '—'}</strong><span>Mapped</span></div>
              <div><strong>{drains.length ? available : '—'}</strong><span>Available</span></div>
              <div><strong>{drains.length ? adopted : '—'}</strong><span>Adopted</span></div>
            </div>
          </div>

          <div className="home-hero-image">
            <img src={drainArtImage} alt="Community storm drain art" />
            <div className="home-image-note">
              <strong>Only rain down the drain</strong>
              <span>Small maintenance actions help protect local waterways.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-shell">
          <div className="home-section-heading">
            <span className="home-kicker">Get started</span>
            <h2>Everything you need is one click away.</h2>
          </div>

          <div className="quick-grid">
            <button className="quick-card" onClick={() => navigate('/drains')}>
              <span className="quick-icon">01</span>
              <strong>Browse drains</strong>
              <p>See every mapped drain and quickly check what is still available.</p>
              <span className="quick-link">Open drain list →</span>
            </button>

            <button className="quick-card" onClick={() => navigate(user ? '/my-drain' : '/login')}>
              <span className="quick-icon">02</span>
              <strong>{user ? 'My adopted drain' : 'Sign in'}</strong>
              <p>{user ? 'Jump directly to the drain you are responsible for.' : 'Sign in to adopt a drain and post maintenance updates.'}</p>
              <span className="quick-link">{user ? 'Open my drain' : 'Sign in'} →</span>
            </button>

            <button className="quick-card" onClick={() => navigate('/drains')}>
              <span className="quick-icon">03</span>
              <strong>Check locations</strong>
              <p>Open a drain to see its map, status and community updates.</p>
              <span className="quick-link">Explore locations →</span>
            </button>
          </div>
        </div>
      </section>

      {previewDrains.length > 0 && (
        <section className="home-section home-available">
          <div className="home-shell">
            <div className="home-section-row">
              <div>
                <span className="home-kicker">Available now</span>
                <h2>Pick one close to you.</h2>
              </div>
              <button className="home-text-button" onClick={() => navigate('/drains')}>See all drains →</button>
            </div>

            <div className="preview-grid">
              {previewDrains.map((drain) => (
                <button key={drain.id} className="preview-card" onClick={() => navigate(`/drains/${drain.id}`)}>
                  <div className="preview-image">
                    <img src={drain.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    <span>Available</span>
                  </div>
                  <div className="preview-copy">
                    <strong>{drain.name}</strong>
                    <small>{Number(drain.latitude).toFixed(4)}, {Number(drain.longitude).toFixed(4)}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-how">
        <div className="home-shell home-how-grid">
          <div>
            <span className="home-kicker light">How it works</span>
            <h2>Simple enough to use without instructions.</h2>
          </div>
          <ol className="home-steps">
            <li><strong>Find</strong><span>Browse an available drain.</span></li>
            <li><strong>Adopt</strong><span>Claim it with your account.</span></li>
            <li><strong>Maintain</strong><span>Keep leaves and litter clear.</span></li>
            <li><strong>Update</strong><span>Post comments and photos.</span></li>
          </ol>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-shell home-footer-row">
          <strong>Drain Adoption Program</strong>
          <span>Community stormwater care</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;

