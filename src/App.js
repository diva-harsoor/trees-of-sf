import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import {APIProvider, Map, Marker, InfoWindow} from '@vis.gl/react-google-maps';

function App() {
  const [isMapping, setIsMapping] = useState(false);
  const position = {lat: 40.12150192260742, lng: -100.45039367675781};
  const [currentLocation, setCurrentLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  const [treeData, setTreeData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const fetchTreeData = async (latitude, longitude) => {
    try {
      const url = `https://data.sfgov.org/resource/tkzw-k3nq.json?$where=within_circle(location, ${latitude}, ${longitude}, 100)`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('Tree data:', data);
      setTreeData(data);
    } catch (error) {
      console.error('Error fetching tree data:', error);
      setLoadingError('Failed to load tree data');
    }
  };

  const handleClick = () => {
    setIsMapping(true);

    // Get user location
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
          fetchTreeData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoadingError('Failed to get location');
        },
        options
      );
      setWatchId(myWatchId);
    } else {
      setLoadingError('Geolocation not supported');
    }
  }

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="App">
      <header className="App-header">
        {loadingError && (
          <div className="error-message" style={{color: 'red', padding: '10px'}}>
            {loadingError}
          </div>
        )}
        
        {isMapping ? (
          <div className="map-container">
            <APIProvider 
              apiKey={apiKey}
              onLoad={() => console.log('Map loaded')}
              className="api-provider"
            >
              {currentLocation ? (
                <Map 
                  defaultCenter={{
                    lat: currentLocation.coords.latitude,
                    lng: currentLocation.coords.longitude
                  }} 
                  defaultZoom={18}

                >
                  <Marker 
                    position={{
                      lat: currentLocation.coords.latitude,
                      lng: currentLocation.coords.longitude
                    }}
                    icon={{
                      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                    }}
                  />
                  
                  {/* Render tree markers */}
                  {treeData.map((tree, index) => (
                    tree.location && (
                      <Marker
                        key={index}
                        position={{
                          lat: parseFloat(tree.location.latitude),
                          lng: parseFloat(tree.location.longitude)
                        }}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        }}                      
                        title={tree.qspecies || 'Tree'}
                        onClick={() => setSelectedMarker(tree)}
                      />
                    )
                  ))}

                  {selectedMarker && (
                    <InfoWindow
                      position={{
                        lat: parseFloat(selectedMarker.location.latitude),
                        lng: parseFloat(selectedMarker.location.longitude)
                      }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div style={{
                            color: 'black',
                            backgroundColor: 'white',
                            padding: '10px',
                            minWidth: '150px',
                            minHeight: '50px',
                            fontSize: '14px'
                          }}>
                        <h3>{selectedMarker.qspecies || 'Unknown Tree'}</h3>
                        <p>Address: {selectedMarker.qaddress || 'Unknown'}</p>
                        <p>Planted: {selectedMarker.plantdate ? new Date(selectedMarker.plantdate).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              ) : (
                <div>Getting your location...</div>
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