/**
 * Centralized API Configuration
 * 
 * For development (Android Emulator):
 * Use 'http://10.0.2.2:3001' to reach the host machine.
 * 
 * For development (Real Device):
 * Use your computer's LAN IP (e.g., 'http://192.168.1.5:3001').
 * 
 * For Production:
 * Use your deployed server URL.
 */

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --- DEPLOYMENT TOGGLES ---
const FORCE_LIVE = false; // Set to TRUE to test your live Render backend from localhost
const RENDER_URL = 'https://dcivs-backend.onrender.com'; // Replace with your real Render URL

// AUTO-DETECT: 
// 1. If FORCE_LIVE is true, use the live backend.
// 2. If on dcivs.online, use the production Render backend.
// 3. If on localhost browser, use localhost. 
// 4. Otherwise (mobile emulator), use 10.0.2.2.
export const API_BASE_URL = FORCE_LIVE 
  ? RENDER_URL
  : (window.location.hostname.includes('dcivs.online')
    ? RENDER_URL
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : 'http://10.0.2.2:3001'));

export const API_AUTH_PASSKEY = `${API_BASE_URL}/api/auth/passkey`;
