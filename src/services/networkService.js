// networkService.js — Network management ve error handling
// Retry logic, timeout, offline detection, request cancellation

import NetInfo from '@react-native-community/netinfo';

let isOnline = true;
let subscribers = [];

/**
 * Initialize network monitoring
 */
export function initializeNetworkMonitoring() {
  const unsubscribe = NetInfo.addEventListener(state => {
    isOnline = state.isConnected ?? true;
    notifySubscribers();
  });
  return unsubscribe;
}

/**
 * Check if device is online
 */
export function getNetworkStatus() {
  return isOnline;
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkStatus(callback) {
  subscribers.push(callback);
  callback(isOnline);
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
}

function notifySubscribers() {
  subscribers.forEach(cb => cb(isOnline));
}

/**
 * Fetch with retry logic and timeout
 * @param {string} url - API URL
 * @param {object} options - Fetch options (method, body, headers, etc)
 * @param {number} retries - Number of retries (default 3)
 * @param {number} timeout - Request timeout in ms (default 15000)
 */
export async function fetchWithRetry(url, options = {}, retries = 3, timeout = 15000) {
  // Check network before attempting
  if (!isOnline) {
    throw new Error('NETWORK_ERROR: Device is offline');
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API_ERROR: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry on network connection errors if device went offline
      if (!isOnline) {
        throw new Error('NETWORK_ERROR: Device went offline');
      }

      // Don't retry on abort errors
      if (error.name === 'AbortError') {
        throw new Error('REQUEST_TIMEOUT: Request took too long');
      }

      // Retry logic
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('NETWORK_ERROR: Failed after retries');
}

/**
 * Categorize error for user-friendly message
 */
export function categorizeNetworkError(error) {
  const message = String(error);

  if (message.includes('NETWORK_ERROR')) {
    return {
      type: 'OFFLINE',
      message: 'İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.',
      retry: false,
    };
  }

  if (message.includes('REQUEST_TIMEOUT')) {
    return {
      type: 'TIMEOUT',
      message: 'İstek çok uzun sürdü. Lütfen interneti kontrol edin ve tekrar deneyin.',
      retry: true,
    };
  }

  if (message.includes('API_ERROR')) {
    return {
      type: 'API_ERROR',
      message: 'Sunucu bir hata döndürdü. Lütfen sonra tekrar deneyin.',
      retry: true,
    };
  }

  return {
    type: 'UNKNOWN',
    message: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    retry: true,
  };
}
