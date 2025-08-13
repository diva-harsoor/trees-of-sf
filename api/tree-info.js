// /api/tree-info.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { commonName, scientificName, location } = req.body;
  
    if (!commonName) {
      return res.status(400).json({ error: 'Common name is required' });
    }
  
    try {
      const prompt = `My purpose is to get users outside and help them feel connected to their city and its nature through real life interaction with trees. This user is now standing in front of a ${commonName}${scientificName ? ` (${scientificName})` : ''} in ${location || 'San Francisco'} and has correctly identified it. Please share some engaging facts about it in no more than 100 words.`;
  
      console.log('Making API call to Claude...');
      console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
      console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...');
  
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
  
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      const treeInfo = data.content[0].text;
  
      // Return the tree info
      res.status(200).json({ 
        success: true,
        treeInfo,
        commonName,
        scientificName 
      });
  
    } catch (error) {
      console.error('Error calling Claude API:', error);
      res.status(500).json({ 
        error: 'Failed to get tree information',
        message: error.message 
      });
    }
  }