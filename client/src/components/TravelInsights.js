import React, { useEffect, useMemo, useState } from 'react';
import '../styles/travelinsights.css';

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Slight snowfall',
  73: 'Snowfall',
  75: 'Heavy snowfall',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm'
};

function TravelInsights({ destination, days = 3, interests = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [weather, setWeather] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [debouncedDestination, setDebouncedDestination] = useState('');

  useEffect(() => {
    const normalized = String(destination || '').trim();
    const timeoutId = setTimeout(() => {
      setDebouncedDestination(normalized);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [destination]);

  const fallbackTips = useMemo(() => {
    const interestList = Array.isArray(interests)
      ? interests
      : String(interests || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    return [
      `Try one local street-food area in ${destination} during your first evening.`,
      `Book a hotel close to transit for easier ${days}-day commuting.`,
      interestList.length ? `Prioritize neighborhoods known for ${interestList[0]}.` : `Pick a central neighborhood for flexible planning.`
    ];
  }, [destination, days, interests]);

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    const fetchData = async () => {
      if (!debouncedDestination || debouncedDestination.length < 2) {
        setLoading(false);
        setError('');
        setCoordinates(null);
        setWeather(null);
        setRestaurants([]);
        setHotels([]);
        return;
      }

      setLoading(true);
      setError('');
      setCoordinates(null);
      setWeather(null);
      setRestaurants([]);
      setHotels([]);

      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(debouncedDestination)}`,
          { signal: abortController.signal }
        );

        if (!geoResponse.ok) {
          throw new Error('Could not locate destination right now.');
        }

        const geoData = await geoResponse.json();
        if (!geoData.length) {
          throw new Error('Destination not found. Try a more specific place name.');
        }

        const place = geoData[0];
        const lat = Number(place.lat);
        const lon = Number(place.lon);

        if (!isCancelled) {
          setCoordinates({ lat, lon, name: place.display_name });
        }

        const weatherPromise = fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=3&timezone=auto`,
          { signal: abortController.signal }
        ).then((res) => (res.ok ? res.json() : null));

        const restaurantsPromise = fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(`restaurants in ${debouncedDestination}`)}`,
          { signal: abortController.signal }
        ).then((res) => (res.ok ? res.json() : []));

        const hotelsPromise = fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(`hotels in ${debouncedDestination}`)}`,
          { signal: abortController.signal }
        ).then((res) => (res.ok ? res.json() : []));

        const [weatherData, restaurantData, hotelData] = await Promise.all([
          weatherPromise,
          restaurantsPromise,
          hotelsPromise
        ]);

        if (!isCancelled) {
          setWeather(weatherData);
          setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
          setHotels(Array.isArray(hotelData) ? hotelData : []);
        }
      } catch (fetchError) {
        if (!isCancelled && fetchError.name !== 'AbortError') {
          setError(fetchError.message || 'Unable to load destination insights right now.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [debouncedDestination]);

  return (
    <section className="insights-wrapper" aria-label="Travel insights">
      <div className="insights-title-row">
        <h3>Smart Destination Insights</h3>
        <p>Weather, food, stay, and map support for smarter planning.</p>
      </div>

      {loading && <p className="insights-status">Loading live destination insights...</p>}
      {error && <p className="insights-status error">{error}</p>}

      <div className="insights-grid">
        <article className="insight-card">
          <h4>Weather Snapshot</h4>
          {weather?.current_weather ? (
            <>
              <p className="metric-value">{Math.round(weather.current_weather.temperature)} C</p>
              <p className="metric-subtle">
                {weatherCodeMap[weather.current_weather.weathercode] || 'Current conditions available'}
              </p>
              <ul className="simple-list">
                {(weather?.daily?.time || []).slice(0, 3).map((date, index) => (
                  <li key={date}>
                    <span>{date}</span>
                    <span>
                      {Math.round(weather.daily.temperature_2m_max[index])} / {Math.round(weather.daily.temperature_2m_min[index])} C
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="metric-subtle">Weather data will appear after destination lookup.</p>
          )}
        </article>

        <article className="insight-card">
          <h4>Restaurant Recommendations</h4>
          {restaurants.length ? (
            <ul className="place-list">
              {restaurants.slice(0, 5).map((place) => (
                <li key={place.place_id}>
                  <strong>{place.display_name.split(',')[0]}</strong>
                  <span>{place.display_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="metric-subtle">No live restaurant suggestions yet. Try a more specific destination.</p>
          )}
        </article>

        <article className="insight-card">
          <h4>Hotel Suggestions</h4>
          {hotels.length ? (
            <ul className="place-list">
              {hotels.slice(0, 5).map((place) => (
                <li key={place.place_id}>
                  <strong>{place.display_name.split(',')[0]}</strong>
                  <span>{place.display_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="metric-subtle">No live hotel results yet. Try adding city and country.</p>
          )}
        </article>
      </div>

      <div className="map-card">
        <div className="map-title-row">
          <h4>Map Integration</h4>
          {coordinates?.name && <p>{coordinates.name}</p>}
        </div>
        {coordinates ? (
          <>
            <iframe
              key={`${coordinates.lat},${coordinates.lon}`}
              title={`Map of ${destination}`}
              className="embedded-map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lon - 0.08}%2C${coordinates.lat - 0.05}%2C${coordinates.lon + 0.08}%2C${coordinates.lat + 0.05}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lon}`}
              loading="lazy"
            />
            <a
              className="map-link"
              href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lon}#map=12/${coordinates.lat}/${coordinates.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              Open full map
            </a>
          </>
        ) : (
          <p className="metric-subtle">Map preview will appear when a destination is recognized.</p>
        )}
      </div>

      <div className="fallback-tips">
        <h4>Planner Tips</h4>
        <ul>
          {fallbackTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default TravelInsights;