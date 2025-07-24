import React, { useRef, useEffect } from 'react';
import './TreeCollection.css';

function Collection({ treeCollection, setSelectedMarker }) {
  const gridRef = useRef();

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollLeft = gridRef.current.scrollWidth;
    }
  }, [treeCollection.length]);

  return (
    <>
      {treeCollection.length > 0 && (
        <div className="collection-container">
          <h3 className="collection-title">Tree Collection ({treeCollection.length} trees)</h3>
          <div className="collection-grid" ref={gridRef}>
            {treeCollection.map((tree, index) => (
              <div
                key={index}
                className="collection-card"
                onClick={() => setSelectedMarker(tree)}
              >
                <h4 className="collection-card-title">{tree.beginner_designation || 'Unknown Tree'}</h4>
                <p><strong>Common Name:</strong> {tree.common_name || 'Unknown'}</p>
                <p><strong>Scientific Name:</strong> <i>{tree.Latin_name || 'Unknown'}</i></p>
                <p><strong>Address:</strong> {tree.qaddress || 'Unknown'}</p>
                <p><strong>Age:</strong> {Math.floor(tree.plant_age_in_days/365.25)} years old</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default Collection; 