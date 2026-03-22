import React from 'react';
import { jsPDF } from 'jspdf';
import '../styles/itinerary.css';
import TravelInsights from './TravelInsights';

function sanitizeItineraryText(text) {
  return String(text || '')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1');
}

function Itinerary({ plan, destination, onEdit = null, tripData = null }) {
  const cleanedPlan = sanitizeItineraryText(plan);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = margin;

    
    doc.setFontSize(16);
    doc.text(`${destination} Itinerary`, margin, yPos);
    yPos += 10;

    
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(cleanedPlan, maxWidth);
    
    lines.forEach((line) => {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    doc.save(`${destination}-itinerary.pdf`);
  };

  return (
    <div className="itinerary-container">
      <div className="itinerary-header">
        <h2>Your {destination} Itinerary</h2>
        <div className="header-actions">
          {onEdit && tripData && (
            <button className="edit-btn" onClick={() => onEdit(tripData)}>
              Edit & Regenerate
            </button>
          )}
          <button className="download-btn" onClick={handleDownloadPDF}>
            Download PDF
          </button>
        </div>
      </div>

      <div id="itinerary-content" className="itinerary-content">
        <pre className="plan-text">{cleanedPlan}</pre>
      </div>

      <TravelInsights
        key={destination}
        destination={destination}
        days={tripData?.days}
        interests={tripData?.interests}
      />
    </div>
  );
}

export default Itinerary;
