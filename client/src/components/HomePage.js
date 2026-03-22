import React from 'react';
import '../styles/homepage.css';
import menTraveller from '../img/Men_traveller.png';
import womenTraveller from '../img/Women_traveller.png';

function HomePage() {
  return (
    <div className="home-page-full">
      
      <div className="title-section">
        <h1 className="main-title">TripSage</h1>
        <p className="main-subtitle">Your intelligent companion for seamless travel planning</p>
      </div>

   
      <div className="main-content-wrapper">
       
        <div className="traveler-left">
          <img src={menTraveller} alt="Male Traveler" className="traveler-img" />
        </div>

      
        <div className="content-overlay">
          
          <p className="app-description">
            Discover the future of travel planning with our AI-powered platform. 
            Simply tell us your destination, budget, and interests, and watch as 
            our intelligent system creates personalized itineraries tailored just for you. 
            From hidden gems to must-see attractions, we've got your journey covered.
          </p>
          
          
          <div className="cta-buttons">
            <button className="cta-btn primary" onClick={() => window.location.href = '/login'}>
              Get Started
            </button>
            <button className="cta-btn secondary" onClick={() => window.location.href = '/register'}>
              Create Account
            </button>
          </div>

          
          <div className="get-started-section-inline">
            <h2 className="section-heading">Ready to Start Planning?</h2>
            <p className="get-started-text">
              Sign in to access AI-powered itinerary generation, trip history, and cost estimation tools.
            </p>
            <button className="cta-btn primary large" onClick={() => window.location.href = '/login'}>
              Login to Continue
            </button>
          </div>
        </div>

        
        <div className="traveler-right">
          <img src={womenTraveller} alt="Female Traveler" className="traveler-img" />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
