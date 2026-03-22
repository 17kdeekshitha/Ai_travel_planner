import React, { useState } from 'react';
import axios from 'axios';
import Itinerary from './Itinerary';
import TripHistory from './TripHistory';
import HomePage from './HomePage';
import CostEstimator from './CostEstimator';
import '../styles/travelform.css';

function TravelForm({ setPlan, editTrip = null, onEditCancel = null }) {
  const [activeTab, setActiveTab] = useState(editTrip ? 'new' : 'home'); // 'home', 'new' or 'history'
  const [isEditMode] = useState(!!editTrip);
  const [formData, setFormData] = useState(
    editTrip
      ? {
          destination: editTrip.destination,
          budget: editTrip.budget,
          interests: editTrip.interests.join(', '),
          days: editTrip.days
        }
      : {
          destination: '',
          budget: '',
          interests: '',
          days: 3
        }
  );

  const [plan, setLocalPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsGenerating(true);

    console.log('Submitting travel plan request...');
    console.log('Form data:', formData);
    console.log('Token:', localStorage.getItem('token'));

    try {
      const response = await axios.post(
        'http://localhost:5000/api/plan',
        {
          ...formData,
          interests: formData.interests.split(',').map((i) => i.trim())
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Plan generated successfully:', response.data);
      setLocalPlan(response.data.plan);
      setPlan(response.data.plan);
      setSuccessMessage('Itinerary generated successfully.');
    } catch (error) {
      console.error("Request failed:", error.response?.data || error.message);
      console.error("Full error:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to generate travel plan';
      setErrorMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="planner-shell">
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('home');
            setErrorMessage('');
            setSuccessMessage('');
          }}
        >
          Home
        </button>
        <button
          className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('new');
            setErrorMessage('');
            setSuccessMessage('');
          }}
        >
          New Plan
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          My Trips
        </button>
      </div>

      {activeTab === 'home' ? (
        <HomePage />
      ) : activeTab === 'new' ? (
        <>
          <div className="planner-hero">
            <p className="eyebrow">Smart Trip Builder</p>
            <h2>Plan faster, travel better</h2>
            <p>Generate a personalized itinerary in seconds based on your budget, interests, and trip duration.</p>
          </div>

          <form onSubmit={handleSubmit} className="travel-form">
            <label htmlFor="destination">Destination</label>
            <input
              id="destination"
              name="destination"
              placeholder="e.g., Tokyo"
              onChange={handleChange}
              value={formData.destination}
              required
            />

            <label htmlFor="budget">Budget</label>
            <input
              id="budget"
              name="budget"
              placeholder="e.g., 50000 ₹"
              onChange={handleChange}
              value={formData.budget}
              required
            />

            <label htmlFor="interests">Interests</label>
            <input
              id="interests"
              name="interests"
              placeholder="e.g., food, culture, beaches"
              onChange={handleChange}
              value={formData.interests}
              required
            />

            <label htmlFor="days">Days</label>
            <input
              id="days"
              type="number"
              name="days"
              min="1"
              max="14"
              onChange={handleChange}
              value={formData.days}
              required
            />

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={isGenerating}>
                {isGenerating ? (isEditMode ? 'Regenerating...' : 'Generating...') : (isEditMode ? 'Regenerate Itinerary' : 'Generate Itinerary')}
              </button>
              {isEditMode && onEditCancel && (
                <button type="button" className="cancel-btn" onClick={onEditCancel} disabled={isGenerating}>
                  Cancel
                </button>
              )}
            </div>
            {errorMessage && <p className="form-message error">{errorMessage}</p>}
            {successMessage && <p className="form-message success">{successMessage}</p>}

            {isGenerating && <p className="status-line">AI is creating your travel plan. This may take a few seconds...</p>}

          </form>

          {plan && (
            <>
              <Itinerary plan={plan} destination={formData.destination} tripData={formData} />
              <CostEstimator 
                destination={formData.destination}
                budget={formData.budget}
                days={formData.days}
                plan={plan}
              />
            </>
          )}
        </>
      ) : (
        <TripHistory onSelectTrip={(trip) => {}} />
      )}
    </div>
  );
}

export default TravelForm;