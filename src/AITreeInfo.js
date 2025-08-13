import React, { useState, useEffect } from 'react';
import { useAITreeInfo } from './hooks/useAITreeInfo';

function AITreeInfo({ commonName, scientificName }) {
  const [treeInfo, setTreeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getTreeInfo, error } = useAITreeInfo();

  // Auto-fetch tree info when component mounts
  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const info = await getTreeInfo(commonName, scientificName);
        setTreeInfo(info);
      } catch (err) {
        console.error('Failed to get tree info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [commonName, scientificName, getTreeInfo]);

  return (
    <div>
      <h3>{commonName}</h3>
      {scientificName && <em>{scientificName}</em>}
      
      {loading && <p>Loading tree information...</p>}
      
      {error && <p style={{ color: 'red' }}>Failed to load tree information.</p>}
      
      {treeInfo && <p>{treeInfo.treeInfo}</p>}
    </div>
  );
}

export default AITreeInfo;