import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// --- Tour Configuration Script ---
// Note: Some steps require executing actions like automated login or tab switching.
export const tourScript = [
  // ACT I: Login
  {
    id: 0,
    route: '/admin-login',
    targetId: 'tour-login-form',
    title: 'Perimeter Defense',
    content: 'Before a packet even reaches our controllers, our perimeter deflects malicious actors. We strictly enforce Helmet security headers (XSS/Clickjacking), backend Rate Limiting (DDoS), and sanitize all strings against NoSQL/SQL injections.',
    action: null
  },
  {
    id: 1,
    route: '/admin-login',
    targetId: 'tour-login-btn',
    title: 'Authentication',
    content: 'Passwords are irreversibly hashed server-side using bcrypt before storage. Let\'s step through the firewall into the Node Control Center.',
    // In the overlay component, we will trap this step to fire the actual login function for demo_admin@system.com
    action: 'adminLogin' 
  },
  // ACT II: Admin Overview
  {
    id: 2,
    route: '/admin',
    targetId: 'tour-system-status',
    title: 'The Command Center',
    content: 'Welcome to the Admin Node. Our backend is connected directly to an RPC node on the Ethereum Sepolia testnet, anchoring data globally.',
    action: 'setTabDashboard'
  },
  {
    id: 3,
    route: '/admin',
    targetId: 'tour-stat-cards',
    title: 'Live Telemetry',
    content: 'Real-time aggregated cryptanalytics. We track total wallet generation, issuance throughput, and the overall accuracy rating of our proprietary AI pipeline.',
    action: 'setTabDashboard'
  },
  // ACT III: System Diagnostics
  {
    id: 4,
    route: '/admin',
    targetId: 'tour-health-monitor',
    title: 'System Health',
    content: 'Active telemetry continuously measures microsecond ping latencies against the Database, the InterPlanetary File System (IPFS) network, and the Ethereum Blockchain JSON-RPC endpoints.',
    action: 'setTabHealth'
  },
  // ACT IV: Blockchain Anchoring & AI
  {
    id: 5,
    route: '/admin',
    targetId: 'tour-issue-uploader',
    title: 'AI Pipeline: The Entry Point',
    content: 'Documents undergo a powerful sequential pipeline. Step 1: An OpenCV visual daemon executes morphological erosion and dilation to strip physical gridlines from certificates for massive OCR accuracy improvements.',
    action: 'setTabIssue'
  },
  {
    id: 6,
    route: '/admin',
    targetId: 'tour-issue-form',
    title: 'Zero-Trust Processing',
    content: 'Step 2: A local Tesseract engine extracts characters. Step 3: Crucially, our mathematical string-similarity algorithms scrub Personally Identifiable Information (Name, Roll No.) before the sanitized payload hits external Gemini AI for final mapping.',
    action: 'setTabIssue'
  },
  {
    id: 7,
    route: '/admin',
    targetId: 'tour-issue-btn',
    title: 'Immutable Ledger Anchoring',
    content: 'Step 4: The finalized AI JSON object is recursively hashed (SHA-256) and anchored directly into the Ethereum blockchain via Smart Contract, minting an absolutely tamper-proof NFT.',
    action: 'setTabIssue'
  },
  // ACT V: Ledger Tracking
  {
    id: 8,
    route: '/admin',
    targetId: 'tour-records-grid',
    title: 'The Master Registry',
    content: 'A live query of every NFT currently existing on the smart contract. Our contract supports cryptographic "Burning"—allowing an admin to permanently invalidate and destroy a compromised credential across the global network.',
    action: 'setTabRecords'
  },
  // ACT VI: Bulk Data Operations
  {
    id: 9,
    route: '/admin',
    targetId: 'tour-batch-upload',
    title: 'Asynchronous Bulk Upload',
    content: 'Uploading hundreds of CSV records bypasses the main blocking thread via background worker processing, implementing robust, line-by-line error mapping for high-scale operations.',
    action: 'setTabBatch'
  },
  // ACT VII: Student Administration
  {
    id: 10,
    route: '/admin',
    targetId: 'tour-student-search',
    title: 'Debounced Queries',
    content: 'Searching the global student ledger triggers debounced, exact-match algorithmic queries secured by deep database Row Level Security (RLS) constraints.',
    action: 'setTabStudents'
  },
  {
    id: 11,
    route: '/admin',
    targetId: 'tour-approval-btn',
    title: 'Asymmetric Wallet Generation',
    content: 'Clicking Approve triggers the highest security subsystem. A unique Ethereum wallet is generated in-memory. The raw private key is instantly heavily encrypted with AES-256 before ever touching persistent storage.',
    action: 'setTabApprovals'
  },
  // ACT VIII: Internal System Security
  {
    id: 12,
    route: '/admin',
    targetId: 'tour-activity-logs',
    title: 'Immutable Audit Trail',
    content: 'To prevent rogue administrative actions, every critical API call (Approval, Revocation, Deletion) is permanently locked into an append-only internal audit table.',
    action: 'setTabLogs'
  },
  {
    id: 13,
    route: '/admin',
    targetId: 'tour-settings-reissue',
    title: 'Emergency Protocols',
    content: 'The "Reissue All Wallets" system acts as a nuclear failsafe. It batches new AES keys and dispatches temporary secure recovery payloads via AWS SES to all compromised users simultaneously.',
    action: 'setTabSettings'
  },
  // ACT IX: The Student Vault
  {
    id: 14,
    route: '/admin',
    targetId: null,
    title: 'Transferring Context...',
    content: 'We are now departing the Admin Node. We will cryptographically log in to the Student Gateway to inspect the Web3 endpoint.',
    action: 'studentLogin'
  },
  {
    id: 15,
    route: '/student',
    targetId: 'tour-student-address',
    title: 'The Web3 Identity',
    content: 'Welcome to the Student Vault. The student controls their Ethereum identity. Everything here operates heavily in the browser engine via PBKDF2 derivation algorithms to decrypt their AES-256 vault client-side.',
    action: null
  },
  {
    id: 16,
    route: '/student',
    targetId: 'tour-student-security',
    title: 'Zero-Trust Checklists',
    content: 'To combat social engineering, students MUST conform to zero-trust standards: enforcing Time-Based One Time Passwords (TOTP) and hardware-backed biometric WebAuthn Passkeys.',
    action: null
  },
  // ACT X: Public Verification
  {
    id: 17,
    route: '/verify',
    targetId: 'tour-verify-form',
    title: 'Public Cryptographic Proof',
    content: 'Our backend is entirely irrelevant here. Any employer worldwide can enter a Token ID into this public node to mathematically cross-reference the Ethereum Smart Contract against the IPFS Hash distribution, proving authenticity directly on-chain.',
    action: 'goVerify'
  }
]

// --- State Singleton ---
// Use a singleton pattern so state persists across component unmounts and route changes without Pinia overhead.
const state = {
  isActive: ref(false),
  currentStepIndex: ref(0)
}

export function useTour() {
  const router = useRouter()

  // Initialize from sessionStorage to survive F5 hard-refreshes if needed
  const loadState = () => {
    const savedActive = sessionStorage.getItem('tourActive')
    if (savedActive === 'true') {
      state.isActive.value = true
      state.currentStepIndex.value = parseInt(sessionStorage.getItem('tourStep') || '0', 10)
    }
  }

  const saveState = () => {
    sessionStorage.setItem('tourActive', state.isActive.value)
    sessionStorage.setItem('tourStep', state.currentStepIndex.value)
  }

  const startTour = () => {
    state.isActive.value = true
    state.currentStepIndex.value = 0
    saveState()
    
    // Kickoff the navigation to the first step
    if (router.currentRoute.value.path !== tourScript[0].route) {
      router.push(tourScript[0].route)
    }
  }

  const stopTour = () => {
    state.isActive.value = false
    state.currentStepIndex.value = 0
    saveState()
  }

  const nextStep = () => {
    if (state.currentStepIndex.value < tourScript.length - 1) {
      state.currentStepIndex.value++
      saveState()
      
      const nextConfig = tourScript[state.currentStepIndex.value]
      if (typeof window !== 'undefined' && router.currentRoute.value.path !== nextConfig.route) {
         router.push(nextConfig.route)
      }
    } else {
      stopTour()
    }
  }

  const prevStep = () => {
    if (state.currentStepIndex.value > 0) {
      state.currentStepIndex.value--
      saveState()
      
      const prevConfig = tourScript[state.currentStepIndex.value]
      if (typeof window !== 'undefined' && router.currentRoute.value.path !== prevConfig.route) {
         router.push(prevConfig.route)
      }
    }
  }

  return {
    isActive: state.isActive,
    currentStepIndex: state.currentStepIndex,
    tourScript,
    startTour,
    stopTour,
    nextStep,
    prevStep,
    loadState,
    router
  }
}
