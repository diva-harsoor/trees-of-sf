import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import {APIProvider, Map, Marker, InfoWindow} from '@vis.gl/react-google-maps';
import treeData from './data/beginner_trees.json';
import questionData from './data/questions.json';

function App() {
  const [isMapping, setIsMapping] = useState(false);
  const position = {lat: 40.12150192260742, lng: -100.45039367675781};
  const [currentLocation, setCurrentLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  // const [treeData, setTreeData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  // const [loading, setLoading] = useState(true);
  const [treeCollection, setTreeCollection] = useState([]);
  const [showTreeCollection, setShowTreeCollection] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  /*
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
  */


  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);  

  // if (loading) {
  //   return <div>Loading trees...</div>;
  // }

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
          // fetchTreeData(position.coords.latitude, position.coords.longitude);
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

  // if (loading) {
  //   return <div>Loading trees...</div>;
  // }


  return (
    <div className="App">
      <header className="App-header">
        {loadingError && (
          <div className="error-message" style={{color: 'red', padding: '10px'}}>
            {loadingError}
          </div>
        )}

        
        {isMapping ? (
          <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative' }}>
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
                    onClick={() => {
                        setShowQuiz(false);
                        setSelectedMarker(null)
                      }
                    }
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
                          title={tree.common_name || 'Tree'}
                          onClick={() => {
                          setSelectedMarker(tree);
                          setTreeCollection(prev => [...prev, tree]);
                        }}
                        />
                      )
                    ))}

                    {selectedMarker && (
                      <InfoWindow
                        position={{
                          lat: parseFloat(selectedMarker.location.latitude),
                          lng: parseFloat(selectedMarker.location.longitude)
                        }}
                        onCloseClick={() => {
                          setShowQuiz(false);
                          setSelectedMarker(null)
                        }}
                      >
                        {treeCollection.includes(selectedMarker.tree_id) ? (
                        <div style={{
                              color: 'black',
                              backgroundColor: 'white',
                              padding: '10px',
                              minWidth: '150px',
                              minHeight: '50px',
                              fontSize: '14px'
                            }}>
                          <h3>{selectedMarker.beginner_designation || 'Unknown Tree'}</h3>
                          <p>Common Name: {selectedMarker.common_name || 'Unknown Tree'}</p>
                          <p>Scientific name: <i>{selectedMarker.Latin_name || 'Unknown Tree'}</i></p>
                          <p>Address: {selectedMarker.qaddress || 'Unknown'}</p>
                          <p>Planted: {`${Math.floor(selectedMarker.plant_age_in_days/365.25)} years ago` || 'Unknown'}</p>
                        </div>
                        ) : (<>
                            {showQuiz ? (
                              questionData.find(quiz => quiz.designation === selectedMarker.beginner_designation).questions.map((question, index) => (
                                <div key={index}>
                                  <h3 style={{color: 'black'}}>{question.text}</h3>
                                  <p>{question.options.map((option, index) => (
                                    <button key={index}>{option}</button>
                                  ))}</p>
                                </div>
                              ))
                          ) : (
                              <button onClick={() => setShowQuiz(true)}>Collect Tree?</button>
                            )
                          }
                          </>
                        )}
                      </InfoWindow>
                    )}
                  </Map>
                  
                ) : (
                  <div>Getting your location...</div>
                )}
              </APIProvider>
            </div>
            
            <div style={{ padding: '10px', backgroundColor: 'white', borderTop: '1px solid #ddd' }}>
              <button onClick={() => setShowTreeCollection(!showTreeCollection)}>
                {showTreeCollection ? 'Hide Tree Collection' : 'Show Tree Collection'}
              </button>
            </div>
            
            {showTreeCollection && treeCollection.length > 0 && (
              <div style={{
                padding: '20px',
                backgroundColor: '#f5f5f5',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h3 style={{color: '#229922'}}>Tree Collection ({treeCollection.length} trees)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 0.5fr))', gap: '15px' }}>
                  {treeCollection.map((tree, index) => (
                    <div key={index} style={{
                      backgroundColor: '#229922',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }} onClick={() => setSelectedMarker(tree)}>
                      <h4>{tree.beginner_designation || 'Unknown Tree'}</h4>
                      <p><strong>Common Name:</strong> {tree.common_name || 'Unknown'}</p>
                      <p><strong>Scientific Name:</strong> <i>{tree.Latin_name || 'Unknown'}</i></p>
                      <p><strong>Address:</strong> {tree.qaddress || 'Unknown'}</p>
                      <p><strong>Age:</strong> {Math.floor(tree.plant_age_in_days/365.25)} years old</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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


