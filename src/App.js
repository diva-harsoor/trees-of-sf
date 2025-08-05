import logo from './logo.svg';
import './App.css';
import { useState, useEffect, useMemo } from 'react';
import {APIProvider, Map, Marker, InfoWindow} from '@vis.gl/react-google-maps';
import treeData from './data/beginner_trees.json';
import questionData from './data/questions.json';
import Quiz from './Quiz';
import Collection from './TreeCollection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isMapping, setIsMapping] = useState(false);
  const position = {lat: 40.12150192260742, lng: -100.45039367675781};
  const [currentLocation, setCurrentLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [watchId, setWatchId] = useState(null);
  const [loadingError, setLoadingError] = useState(null);
  // const [treeData, setTreeData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
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

  // Finding closest tree for guided learning feature
  // Might be better to find a tree 50m away from user
  function findClosest(currentLocation, trees) {
    if (!currentLocation || !trees.length) return null;
    let minDist = Infinity;
    let closest = null;
    trees.forEach(tree => {
      if (!tree.location) return;
      const tree_latitude = tree.location && parseFloat(tree.location.latitude);
      const tree_longitude = tree.location && parseFloat(tree.location.longitude);
      if (tree_latitude == null || tree_longitude == null) return;
      const dist = Math.sqrt(
        Math.pow(tree_latitude - currentLocation.coords.latitude, 2) +
        Math.pow(tree_longitude - currentLocation.coords.longitude, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = tree;
        closest.distance_m = dist;
      }
    });
    return closest;
  }

  // Pre-filter trees by proximity to speed up closest tree calculation
const nearbyTrees = useMemo(() => {
  if (!currentLocation) return [];
  
  return treeData.filter(tree => 
    Math.abs(parseFloat(tree.location.latitude) - currentLocation.coords.latitude) < 0.01 && // ~1km rough filter
    Math.abs(parseFloat(tree.location.longitude) - currentLocation.coords.longitude) < 0.01
  );
}, [currentLocation]);

const closestTree = useMemo(() => 
  findClosest(currentLocation, nearbyTrees),
  [currentLocation, nearbyTrees]
);

useEffect(() => {
  if (closestTree && isMapping && mapLoaded) {
      toast(`There is a ${closestTree.common_name} tree ${closestTree.distance_m} meters away from you.`);
    }
}, [closestTree, isMapping, mapLoaded]);

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

  // Handle user click on landing button, watch user location
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
    <div className="app-container">
      <header className="app-header">
        <ToastContainer />
        {loadingError && (
          <div className="error-message">{loadingError}</div>
        )}

        {isMapping ? (
          <div className="map-section">
            <div className="map-area">
              <APIProvider 
                apiKey={apiKey}
                onLoad={() => setMapLoaded(true)}
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
                        <div className="tree-info-window">
                          <h3 className="tree-title">{selectedMarker.beginner_designation || 'Unknown Tree'}</h3>
                          <p className="tree-detail">Common Name: {selectedMarker.common_name || 'Unknown Tree'}</p>
                          <p className="tree-detail">Scientific name: <i>{selectedMarker.Latin_name || 'Unknown Tree'}</i></p>
                          <p className="tree-detail">Address: {selectedMarker.qaddress || 'Unknown'}</p>
                          <p className="tree-detail">Planted: {`${Math.floor(selectedMarker.plant_age_in_days/365.25)} years ago` || 'Unknown'}</p>
                        </div>
                        ) : (<>
                            {showQuiz ? (
                              <Quiz collection={treeCollection} setCollection={setTreeCollection} tree={selectedMarker} questions={questionData.find(quiz => quiz.designation === selectedMarker.beginner_designation).questions} />
                          ) : (
                              <button className="collect-btn" onClick={() => setShowQuiz(true)}>Collect Tree?</button>
                            )
                          }
                          </>
                        )}
                      </InfoWindow>
                    )}
                  </Map>
                ) : (
                  <div className="loading-message">Getting your location...</div>
                )}
              </APIProvider>
            </div>
            <div className="map-controls">
              <button className="toggle-collection-btn" onClick={() => setShowTreeCollection(!showTreeCollection)}>
                {showTreeCollection ? 'Hide Tree Collection' : 'Show Tree Collection'}
              </button>
            </div>
            {showTreeCollection && ( 
              <Collection treeCollection={treeCollection} setSelectedMarker={setSelectedMarker} />
            )}
          </div>
        ) : (
          <button className="landing-button" onClick={handleClick}>
            <h1>Discover <br /> Trees Near You</h1>
            <br />
            <p>Tap to share your location.</p>
          </button>
        )}
      </header>
    </div>
  );
}

export default App;


