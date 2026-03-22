import './App.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import TravelForm from './components/TravelForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';

function getStoredUserProfile() {
  try {
    const raw = localStorage.getItem('userProfile');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getInitialFromName(name, email) {
  const source = String(name || email || 'U').trim();
  return source ? source.charAt(0).toUpperCase() : 'U';
}

function MainLayout({ children }) {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(() => getStoredUserProfile());
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  const initial = useMemo(
    () => getInitialFromName(userProfile?.name, userProfile?.email),
    [userProfile]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setUserProfile(null);
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserProfile(response.data.user);
        localStorage.setItem('userProfile', JSON.stringify(response.data.user));
      } catch (error) {
        console.error('Failed to fetch user profile:', error.response?.data || error.message);
      }
    };

    fetchProfile();
  }, [token]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    window.location.href = '/';
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handlePickProfilePhoto = () => {
    if (!fileInputRef.current || isUploadingPhoto) return;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploadingPhoto(true);
        const response = await axios.patch(
          'http://localhost:5000/api/auth/profile-photo',
          { profilePhoto: reader.result },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setUserProfile(response.data.user);
        localStorage.setItem('userProfile', JSON.stringify(response.data.user));
      } catch (error) {
        console.error('Failed to update profile photo:', error.response?.data || error.message);
        alert(error.response?.data?.message || 'Failed to update profile photo.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-section">
          <h1 className="app-logo" onClick={() => window.location.href = '/'} style={{cursor: 'pointer'}}>TripSage</h1>
          <p className="brand-tagline">Plan Smarter, Travel Better</p>
        </div>
        {isAuthenticated ? (
          <div className="profile-menu" ref={profileMenuRef}>
            <button className="avatar-btn" onClick={() => setIsProfileOpen((open) => !open)}>
              {userProfile?.profilePhoto ? (
                <img src={userProfile.profilePhoto} alt="Profile" className="avatar-image" />
              ) : (
                <span className="avatar-initial">{initial}</span>
              )}
            </button>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <p className="profile-name">{userProfile?.name || 'User'}</p>
                <p className="profile-email">{userProfile?.email || ''}</p>
                <button
                  className="profile-action-btn"
                  onClick={handlePickProfilePhoto}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? 'Updating Photo...' : 'Edit Profile Photo'}
                </button>
                <button className="logout-btn profile-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleProfilePhotoChange}
            />
          </div>
        ) : (
          <button onClick={handleLogin} className="login-btn-header">Login</button>
        )}
      </header>
      {children}
    </div>
  );
}

function PlannerPage({ setPlan }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  return (
    <MainLayout>
      <TravelForm setPlan={setPlan} />
    </MainLayout>
  );
}

function App() {
  const [, setPlan] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        } />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/planner" element={<PlannerPage setPlan={setPlan} />} />
      </Routes>
    </Router>
  );
}

export default App;
