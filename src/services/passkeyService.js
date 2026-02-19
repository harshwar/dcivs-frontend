/**
 * Passkey (WebAuthn) Browser Service
 * Wraps @simplewebauthn/browser and backend API calls for passkey flows.
 */
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { API_AUTH_PASSKEY } from '../apiConfig';

const API_BASE = API_AUTH_PASSKEY;

/**
 * Get the JWT token from localStorage.
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Standard fetch with JSON headers.
 */
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// ============================================
// REGISTRATION (from Settings page)
// ============================================

/**
 * Register a new passkey for the currently logged-in user.
 * @param {string} friendlyName - User-chosen name for this passkey
 * @returns {Object} { message, credentialId }
 */
export async function registerPasskey(friendlyName = 'My Passkey') {
  // 1. Get options from server
  const options = await apiFetch(`${API_BASE}/register-options`, {
    method: 'POST',
  });

  // 2. Start WebAuthn registration (browser prompt)
  const attestationResponse = await startRegistration({ optionsJSON: options });

  // 3. Send result to server for verification
  const result = await apiFetch(`${API_BASE}/register-verify`, {
    method: 'POST',
    body: JSON.stringify({
      attestationResponse,
      friendlyName,
    }),
  });

  return result;
}

// ============================================
// AUTHENTICATION (from Login page)
// ============================================

/**
 * Login using a passkey (no email needed — uses discoverable credentials).
 * The browser will show all passkeys stored for this origin.
 * @returns {Object} { message, token, user }
 */
export async function loginWithPasskey() {
  // 1. Get options from server (no email needed)
  const options = await apiFetch(`${API_BASE}/login-options`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  // 2. Start WebAuthn authentication (browser prompt shows available passkeys)
  const assertionResponse = await startAuthentication({ optionsJSON: options });

  // 3. Send result to server — credential ID identifies the user
  const result = await apiFetch(`${API_BASE}/login-verify`, {
    method: 'POST',
    body: JSON.stringify({
      assertionResponse,
    }),
  });

  return result;
}

// ============================================
// MANAGEMENT
// ============================================

/**
 * Get the list of passkeys registered by the current user.
 * @returns {Array} List of passkey objects
 */
export async function getPasskeys() {
  return await apiFetch(`${API_BASE}/list`);
}

/**
 * Delete a passkey.
 * @param {string} credentialId - The credential ID to delete
 * @returns {Object} { message }
 */
export async function deletePasskey(credentialId) {
  return await apiFetch(`${API_BASE}/${encodeURIComponent(credentialId)}`, {
    method: 'DELETE',
  });
}

/**
 * Check if WebAuthn/Passkeys are supported by this browser.
 * @returns {boolean}
 */
export function isPasskeySupported() {
  return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
}
