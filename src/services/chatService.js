import { Platform } from 'react-native';
import { fetchWithRetry } from './networkService';

// Production Render URL
const BASE_URL = 'https://huzur-ai-api.onrender.com';

/**
 * Sends a message to the Hybrid RAG chat backend and returns the response.
 * @param {string} question - The user's query
 * @returns {Promise<{ success: boolean, answer: string, bestScore: number, sources: Array }>}
 */
export async function sendChatMessage(question) {
  const url = `${BASE_URL}/api/chat`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  };

  try {
    // Timeout extended to 60 seconds to allow Gemini API to handle rate limits and retries
    const data = await fetchWithRetry(url, options, 3, 60000); 
    return data;
  } catch (error) {
    console.warn('Chat API error:', error);
    throw error;
  }
}
