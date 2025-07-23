import React from 'react';

function Collection({ treeCollection, setSelectedMarker }) {
  return (
    <>
        {treeCollection.length > 0 && (
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
    </>
  );
}

export default Collection; 