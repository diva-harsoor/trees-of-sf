import logo from './logo.svg';
import './App.css';
import { useState, useEffect, useMemo } from 'react';
import {APIProvider, Map, Marker, InfoWindow, useMap, useDirectionsService, DirectionsRenderer} from '@vis.gl/react-google-maps';
import treeData from './data/beginner_trees.json';
import questionData from './data/questions.json';
import Quiz from './Quiz';
import Collection from './TreeCollection';
import AITreeInfo from './AITreeInfo';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { findAllByLabelText } from '@testing-library/dom';

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
  const [treeCollection, setTreeCollection] = useState({});
  const [showTreeCollection, setShowTreeCollection] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState(true);
  const [apiTreeData, setApiTreeData] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState({});
  const [readMore, setReadMore] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsResult, setDirectionsResult] = useState(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const fetchTreeData = async (latitude, longitude) => {
    try {
      const url = `https://data.sfgov.org/resource/tkzw-k3nq.json?$where=within_circle(location, ${latitude}, ${longitude}, 100)`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('Tree data:', data);
      setApiTreeData(data);
    } catch (error) {
      console.error('Error fetching tree data:', error);
      setLoadingError('Failed to load tree data');
    }
  };

  // Finding closest tree for guided learning feature
  // Might be better to find a tree 50m away from user
  function findClosest(currentLocation, trees) {
    if (!currentLocation || !trees.length) return null;
    
    let minDist = Infinity;
    let closest = null;
    
    trees.forEach(tree => {
      if (!tree.location) return;
      
      const treeLat = parseFloat(tree.location.latitude);
      const treeLon = parseFloat(tree.location.longitude);
      
      if (isNaN(treeLat) || isNaN(treeLon)) return;
      
      // Convert degree differences to meters (approximate)
      const latDiff = (treeLat - currentLocation.coords.latitude) * 111320; // ~111.32km per degree latitude
      const lonDiff = (treeLon - currentLocation.coords.longitude) * 111320 * Math.cos(currentLocation.coords.latitude * Math.PI / 180);
      
      const dist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
      
      if (dist < minDist) {
        minDist = dist;
        closest = { ...tree, distance_m: Math.round(dist) };
      }
    });
    
    return closest;
  }
      
  // Pre-filter trees by proximity to speed up closest tree calculation
const nearbyTrees = useMemo(() => {
  if (!currentLocation) return [];
  
  // Use local treeData for guided mode, apiTreeData for discovery mode
  const currentTreeData = discoveryMode ? apiTreeData : treeData;
  
  return currentTreeData.filter(tree => 
    tree.location &&
    Math.abs(parseFloat(tree.location.latitude) - currentLocation.coords.latitude) < 0.01 && // ~1km rough filter
    Math.abs(parseFloat(tree.location.longitude) - currentLocation.coords.longitude) < 0.01
  );
}, [currentLocation, discoveryMode, apiTreeData]);

const closestTree = useMemo(() => 
  findClosest(currentLocation, nearbyTrees),
  [currentLocation, nearbyTrees]
);

const CustomDirectionsRenderer = ({ directions, options = {} }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !directions) return;

    // Create a native Google Maps DirectionsRenderer
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: options.suppressMarkers || false,
      suppressInfoWindows: options.suppressInfoWindows || true,
      polylineOptions: {
        strokeColor: options.polylineOptions?.strokeColor || '#FF0000',
        strokeWeight: options.polylineOptions?.strokeWeight || 6,
        strokeOpacity: options.polylineOptions?.strokeOpacity || 1.0,
        zIndex: options.polylineOptions?.zIndex || 1000,
        ...options.polylineOptions
      },
      ...options
    });

    // Set the map and directions
    directionsRenderer.setMap(map);
    directionsRenderer.setDirections(directions);

    // Cleanup function
    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, directions, options]);

  return null; // This component doesn't render anything directly
};


const getDirections = async () => {
  console.log('Getting directions to closest tree');
  if (!closestTree || !currentLocation) return;
  if (!closestTree || !currentLocation) {
    console.log('Missing data:', { closestTree: !!closestTree, currentLocation: !!currentLocation });
    return;
  }
  const directionsService = new window.google.maps.DirectionsService();

  try {

    const result = await directionsService.route({
      origin: { lat: Number(currentLocation.coords.latitude), lng: Number(currentLocation.coords.longitude) },
      destination: { lat: Number(closestTree.location.latitude), lng: Number(closestTree.location.longitude) },
      travelMode: window.google.maps.TravelMode.WALKING,
    });

    console.log('Directions result:', result);
    console.log('Directions result routes:', result.routes);

    setDirectionsResult(result);
    setShowDirections(true);
  } catch (error) {
    console.error('Error getting directions:', error);
    toast.error('Failed to get directions');
    setDirectionsResult(null);
  }
}

useEffect(() => {
  if (closestTree && isMapping && mapLoaded && !discoveryMode) {
      toast(
        <div>
          <p>There is a {closestTree.common_name} tree {closestTree.distance_m} meters away from you.</p>
          <button className="read-more-btn" onClick={() => setShowNavigation(true)}>Get Directions</button>
        </div>
      );
      console.log('showNavigation: ', showNavigation);
    }
}, [closestTree, isMapping, mapLoaded, discoveryMode]);

// Fetch API data when switching to discovery mode
useEffect(() => {
  if (discoveryMode && currentLocation) {
    fetchTreeData(currentLocation.coords.latitude, currentLocation.coords.longitude);
  }
}, [discoveryMode, currentLocation]);

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
          if (discoveryMode) {
            fetchTreeData(position.coords.latitude, position.coords.longitude);
          }
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
                    options={{
                      fullscreenControl: false,
                    }}
                    onClick={() => {
                        setShowQuiz(false);
                        setSelectedMarker(null)
                        setReadMore(false);
                        setShowNavigation(false);
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
                    {(discoveryMode ? apiTreeData : treeData).map((tree, index) => (
                      tree.location && (
                        <Marker
                          key={index}
                          position={{
                            lat: parseFloat(tree.location.latitude),
                            lng: parseFloat(tree.location.longitude)
                          }}
                          icon={{
                            url: '/tree.png',
                            scaledSize: { width: 30, height: 30 }
                          }}                      
                          title={tree.common_name || 'Tree'}
                          onClick={() => {
                          setSelectedMarker(tree);
                          setReadMore(false);
                        }}
                        />
                      )
                    ))}

                    {showDirections && directionsResult && (
                      <>
                        {console.log('Rendering directions on map:', directionsResult)}
                        <CustomDirectionsRenderer 
                          directions={directionsResult}
                          options={{
                            suppressMarkers: true, // Hide A/B markers
                            suppressInfoWindows: true,
                          }}
                        />
                      </>
                    )}


                    {selectedMarker && (
                      <InfoWindow
                        position={{
                          lat: parseFloat(selectedMarker.location.latitude),
                          lng: parseFloat(selectedMarker.location.longitude)
                        }}
                        onCloseClick={() => {
                          setShowQuiz(false);
                          setSelectedMarker(null);
                          setReadMore(false);
                        }}
                      >
                        {discoveryMode ? (
                          // Discovery mode: just show tree info
                          <div className="tree-info-window">
                            <h3 className="tree-detail">{selectedMarker.qspecies?.split('::')[1] || 'Unknown Tree'}</h3>
                            <i><p className="tree-detail">{selectedMarker.qspecies?.split('::')[0] || 'Unknown'}</p></i>
                            {selectedMarker.plantdate &&(
                              <p className="tree-detail">Planted in {new Date(selectedMarker.plantdate).getFullYear()}</p>
                            )}
                            {readMore ? (
                              <AITreeInfo commonName={selectedMarker.qspecies?.split('::')[1]} scientificName={selectedMarker.qspecies?.split('::')[0]} />
                            ):(
                              <button className="read-more-btn" onClick={() => setReadMore(true)}>Read More</button>
                            )}
                          </div>
                        ) : (
                          // Guided mode: show quiz functionality
                          <>
                            {showQuiz ? (
                              <Quiz collection={treeCollection} setCollection={setTreeCollection} tree={selectedMarker} setCurrentCardIndex={setCurrentCardIndex} questions={questionData.find(quiz => quiz.designation === selectedMarker.beginner_designation)?.questions || []} />
                            ) : (
                              <button className="collect-btn" onClick={() => setShowQuiz(true)}>Collect Tree?</button>
                            )}
                          </>
                        )}
                      </InfoWindow>
                    )}
                  </Map>
                ) : (
                  <div className="loading-message">Getting your location...</div>
                )}
              </APIProvider>

          <div className="mode-controls toggle-collection-btn" onClick={
            () => {
                setDiscoveryMode(!discoveryMode)
                setShowNavigation(false)
                setShowDirections(false)
                setDirectionsResult(null)
                setShowQuiz(false)
                setSelectedMarker(null)
                setReadMore(false)
                
                // Reset map zoom to default and center on user location
                if (currentLocation) {
                  const mapElement = document.querySelector('.api-provider div[style*="position: relative"]');
                  if (mapElement && mapElement.__googleMapsMap) {
                    const map = mapElement.__googleMapsMap;
                    map.setZoom(18);
                    map.panTo({
                      lat: currentLocation.coords.latitude,
                      lng: currentLocation.coords.longitude
                    });
                  }
                }
                }
              }
            >
            {discoveryMode ? '🔍 Discovery Mode' : '📚 Learning Mode'}
          </div>

          {showNavigation && closestTree && (
            <div className="navigation-container">
              <h2>Navigate to Tree</h2>

              <p>{closestTree.common_name} - {closestTree.distance_m} m away.</p>
              <button 
                className="toggle-collection-btn" 
                onClick={() => {
                  // Open in Google Maps for turn-by-turn directions
                  const lat = closestTree.location.latitude;
                  const lng = closestTree.location.longitude;
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                  window.open(url, '_blank');
                }}
              >
                Open in Google Maps
              </button>
              <div>
            <button 
              className="toggle-collection-btn" 
              onClick={() => {
                if (showDirections) {
                  setShowDirections(false);
                  setDirectionsResult(null);
                } else {
                  getDirections();
                }
              }} 
            >
              {showDirections ? 'Hide Path' : 'View Path'}
            </button>
          </div>

              {directionsResult && (
                <p>
                  🚶‍♂️ {directionsResult.routes[0].legs[0].duration.text} walk
                </p>
              )}
            </div>
          )}
        </div>
          <div className="collection-view">
            <button className="toggle-collection-btn" onClick={() => setShowTreeCollection(!showTreeCollection)}>
              {showTreeCollection ? 'Hide Tree Collection' : 'Show Tree Collection'}
            </button>
          </div>
          {showTreeCollection && ( 
            <Collection treeCollection={treeCollection} setSelectedMarker={setSelectedMarker} currentCardIndex={currentCardIndex} setCurrentCardIndex={setCurrentCardIndex} />
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


