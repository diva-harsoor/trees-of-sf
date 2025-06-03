import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import {APIProvider, Map, Marker} from '@vis.gl/react-google-maps';

function App() {
  const [isMapping, setIsMapping] = useState(false);
  const position = {lat: 40.12150192260742, lng: -100.45039367675781};
  const [currentLocation, setCurrentLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Load Google Maps script dynamically
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      return script;
    };

    let attempts = 0;
    const maxAttempts = 50;

    const checkGoogleMapsLoaded = () => {
      attempts++;
      
      if (window.google && window.google.maps && window.google.maps.Map) {
        console.log('Google Maps loaded successfully');
        setIsGoogleMapsLoaded(true);
        return;
      }

      if (attempts >= maxAttempts) {
        setLoadingError('Google Maps failed to load');
        return;
      }

      setTimeout(checkGoogleMapsLoaded, 100);
    };

    // Check if script is already loaded
    if (!window.google || !window.google.maps) {
      const script = loadGoogleMapsScript();
      
      script.onload = () => {
        checkGoogleMapsLoaded();
      };
    } else {
      checkGoogleMapsLoaded();
    }
  }, [apiKey]);

  const handleClick = () => {
    setIsMapping(true);
    if (navigator.geolocation) {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }

      const options = {
        timeout: 5000, // 5 seconds
        enableHighAccuracy: true,
        maximumAge: 0,
      };

      let myWatchId = navigator.geolocation.watchPosition(
        (position) => { 
          setCurrentLocation(position);
          setAccuracy(position.coords.accuracy);
          console.log('currentLocation in hook', currentLocation);
          console.log('accuracy in hook', accuracy);    
        },
        (error) => console.error(error),
        options
      );
      setWatchId(myWatchId);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {isMapping ? (
          <div className="map-container">
            <APIProvider 
              apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} 
              onLoad={() => console.log('Map loaded')}
              className="api-provider"
            >
              {currentLocation && (
                <Map defaultCenter={{
                  lat: currentLocation.coords.latitude,
                  lng: currentLocation.coords.longitude
                }} defaultZoom={18}>
                  <Marker 
                    position={{
                      lat: currentLocation.coords.latitude,
                      lng: currentLocation.coords.longitude
                    }}
                  />
                </Map>
              )}
            </APIProvider>
          </div>
        ) : (
          <button className="landing-button" onClick={handleClick}>
            <h1>Discover <br></br> Trees Near You</h1>
            <br></br>
            <p>
              Tap to share your location.
            </p>
          </button>
        )}
      </header>
    </div>
  );
}

export default App;
