import React, { useState, useRef, useEffect, useMemo} from 'react';
import './TreeCollection.css';

function Collection({ treeCollection, setSelectedMarker, currentCardIndex, setCurrentCardIndex }) {
  const gridRef = useRef();
  const flattenedCollection = useMemo(() => Object.values(treeCollection).flat(), [treeCollection]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollLeft = gridRef.current.scrollWidth;
    }
  }, [treeCollection.length]);

  const handleCardClick = (beginner_designation, trees_of_that_designation) => {
    setCurrentCardIndex(prev => {
      const currentIndex = prev[beginner_designation] || 0;
      const nextIndex = (currentIndex + 1) % trees_of_that_designation.length;
      return { ...prev, [beginner_designation]: nextIndex };
    });
  };

  return (
    <>
      {flattenedCollection.length > 0 && (
        <div className="collection-container">
          <h3 className="collection-title">Tree Collection ({treeCollection.length} trees)</h3>
          <div className="collection-grid" ref={gridRef}>
            {Object.entries(treeCollection).map(([beginner_designation, trees_of_that_designation]) => (
              console.log(beginner_designation, trees_of_that_designation),
              <div className={`collection-card ${trees_of_that_designation.length > 1 ? 'card-stack': ''}`} key={beginner_designation} onClick={() => handleCardClick(beginner_designation, trees_of_that_designation)}>
                <h4 className="collection-card-title">{beginner_designation}</h4>
                <p>{trees_of_that_designation[currentCardIndex[beginner_designation]].common_name}</p>
                <p><i>{trees_of_that_designation[currentCardIndex[beginner_designation]].Latin_name}</i></p>
                <p>{trees_of_that_designation[currentCardIndex[beginner_designation]].qaddress}</p>
                <p>{Math.floor(trees_of_that_designation[currentCardIndex[beginner_designation]].plant_age_in_days/365.25)} years old</p>
                <p>{currentCardIndex[beginner_designation] + 1} of {trees_of_that_designation.length} {beginner_designation} trees</p>
              </div>
            ))}
          </div>
        {/*
          <div className="collection-grid" ref={gridRef}>
            {flattenedCollection.map((tree, index) => (
              <div
                key={index}
                className="collection-card"
                onClick={() => setSelectedMarker(tree)}
              >
                <h4 className="collection-card-title">{tree.beginner_designation || 'Unknown Tree'}</h4>
                <p>{tree.common_name || 'Unknown'}</p>
                <p><i>{tree.Latin_name || 'Unknown'}</i></p>
                <p>{tree.qaddress || 'Unknown'}</p>
                <p>{Math.floor(tree.plant_age_in_days/365.25)} years old</p>
              </div>
            ))}
          </div>
        */}
        </div>
      )}
    </>
  );
}

export default Collection; 