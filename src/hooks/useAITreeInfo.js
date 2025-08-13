// Custom hook for getting tree info
import { useState } from 'react';

export const useAITreeInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTreeInfo = async (commonName, scientificName = null, location = 'San Francisco') => {
    // Check localStorage cache first
    const cacheKey = `tree-info-${commonName.toLowerCase().replace(/\s+/g, '-')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Invalid cache, continue with API call
        localStorage.removeItem(cacheKey);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tree-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commonName,
          scientificName,
          location
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get tree info');
      }

      // Cache the result for 24 hours
      const cacheData = {
        ...data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { getTreeInfo, loading, error };
};
