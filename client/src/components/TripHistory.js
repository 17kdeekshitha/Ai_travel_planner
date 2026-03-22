import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Itinerary from './Itinerary';
import TravelForm from './TravelForm';
import '../styles/triphistory.css';

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const buildTripSignature = (trip) => {
  const interests = Array.isArray(trip?.interests)
    ? trip.interests.map((item) => normalizeValue(item)).filter(Boolean).sort()
    : [];

  return JSON.stringify({
    destination: normalizeValue(trip?.destination),
    budget: normalizeValue(trip?.budget),
    days: Number(trip?.days) || 0,
    interests
  });
};

const dedupeTrips = (tripList) => {
  const seen = new Set();
  const uniqueTrips = [];

  for (const trip of tripList || []) {
    const signature = buildTripSignature(trip);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    uniqueTrips.push(trip);
  }

  return uniqueTrips;
};

function TripHistory({ onSelectTrip }) {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingTripId, setDeletingTripId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/plans', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTrips(dedupeTrips(response.data.plans || []));
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Failed to load your trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Delete this trip? This action cannot be undone.')) {
      try {
        setDeletingTripId(planId);
        await axios.delete(`http://localhost:5000/api/plans/${planId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        setTrips((prevTrips) => prevTrips.filter((t) => t._id !== planId));
        setSelectedTrip((prevSelected) => (prevSelected?._id === planId ? null : prevSelected));
      } catch (err) {
        console.error('Error deleting trip:', err);
        setError('Failed to delete trip. Please try again.');
      } finally {
        setDeletingTripId('');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (editingTrip) {
    return (
      <div className="trip-edit">
        <button className="back-btn" onClick={() => setEditingTrip(null)}>
          ← Cancel Edit
        </button>
        <TravelForm editTrip={editingTrip} onEditCancel={() => setEditingTrip(null)} />
      </div>
    );
  }

  if (selectedTrip) {
    return (
      <div className="trip-detail">
        <button className="back-btn" onClick={() => setSelectedTrip(null)}>
          ← Back to Trips
        </button>
        <Itinerary 
          plan={selectedTrip.response} 
          destination={selectedTrip.destination}
          onEdit={() => setEditingTrip(selectedTrip)}
          tripData={selectedTrip}
        />
      </div>
    );
  }

  return (
    <div className="trip-history">
      <div className="history-header">
        <h2>My Trips</h2>
        <button className="refresh-btn" onClick={fetchTrips} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p className="loading-state">Loading your trips...</p>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <p>No trips yet. Create your first itinerary!</p>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => (
            <div
              key={trip._id}
              className="trip-card"
              onClick={() => setSelectedTrip(trip)}
            >
              <div className="trip-card-header">
                <h3>{trip.destination}</h3>
                <span className="trip-meta">{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
              </div>
              <div className="trip-card-content">
                <p className="trip-detail-text">
                  <strong>Budget:</strong> {trip.budget}
                </p>
                <p className="trip-detail-text">
                  <strong>Interests:</strong> {trip.interests.join(', ')}
                </p>
                <p className="trip-date">{formatDate(trip.createdAt)}</p>
              </div>
              <div className="trip-card-footer">
                <div className="footer-actions">
                  <button
                    className="view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrip(trip);
                    }}
                  >
                    View Plan
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(trip._id);
                    }}
                    disabled={deletingTripId === trip._id}
                  >
                    {deletingTripId === trip._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TripHistory;
