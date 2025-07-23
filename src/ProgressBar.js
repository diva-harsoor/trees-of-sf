import React,{useState} from 'react';

function ProgressBar({ progress }) {
  return (
    <div style={{ width: '100%', height: '20px', backgroundColor: '#f0f0f0' }}>
      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#4CAF50' }}></div>
    </div>
  );
}

export default ProgressBar;