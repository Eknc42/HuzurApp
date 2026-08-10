import { fetchWithRetry } from './networkService';

const PRODUCTION_URL = 'https://huzur-ai-api.onrender.com';
const BASE_URL = PRODUCTION_URL;

/**
 * Sends a message to the live source-research backend and returns the response.
 * @param {string} question - The user's query
 * @returns {Promise<{ success: boolean, answer: string, bestScore: number, sources: Array }>}
 */
export async function sendChatMessage(question, { compare = false, history = [] } = {}) {
  const url = `${BASE_URL}${compare ? '/api/chat/compare' : '/api/chat'}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, compare, history: history.slice(-6) }),
  };

  try {
    // Multiple live searches and page verification can take longer than a plain model call.
    const data = await fetchWithRetry(url, options, 1, 90000);
    return data;
  } catch (error) {
    console.warn('Chat API error:', error);
    throw error;
  }
}
