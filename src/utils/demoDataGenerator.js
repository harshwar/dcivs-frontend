/**
 * Deterministic Mock Data Generator for Frontend Demo Mode
 */

// Simple seeded RNG for consistent but random-looking data
let seed = 12345;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Lucas', 'Isabella', 'Michael', 'Mia', 'Alexander', 'Charlotte', 'Ethan', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Aarav', 'Diya', 'Rohan', 'Ananya', 'Arjun', 'Priya', 'Sai', 'Kavya'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Patel', 'Sharma', 'Singh', 'Kumar', 'Desai', 'Gupta', 'Joshi', 'Mehta'];
const departments = ['Engineering', 'Computer Science', 'Business Administration', 'Data Science', 'Information Technology', 'Design'];

function generateRandomName() {
  return `${firstNames[randInt(0, firstNames.length - 1)]} ${lastNames[randInt(0, lastNames.length - 1)]}`;
}

function generateRandomHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[randInt(0, 15)];
  }
  return hash;
}

function generateRandomTokenId() {
  return randInt(10000, 99999).toString();
}

/**
 * Returns ~6 months of mock analytics data points and stats
 */
export function getDemoAnalytics() {
  // Reset seed for consistency across navigations
  seed = 42; 
  
  const trends = [];
  const now = new Date();
  
  // Create 6 months of data, trending upwards
  let baseVolume = 15;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Add some random noise and strong upward trend
    baseVolume = baseVolume + randInt(20, 80);
    
    trends.push({
      date: d.toISOString(),
      count: baseVolume,
      successful: Math.floor(baseVolume * 0.98),
      failed: Math.ceil(baseVolume * 0.02)
    });
  }

  const deptDist = departments.map(dep => ({
    department: dep,
    count: randInt(50, 400)
  })).sort((a, b) => b.count - a.count);

  return {
    stats: {
      total_students: 1150,
      total_certificates: 1342,
      active_wallets: 1085,
      revoked_certificates: 12,
      avg_time_to_issue_days: 2.4
    },
    charts: {
      issuance_trend: trends,
      department_distribution: deptDist,
      status_distribution: [
        { status: 'Active', count: 1330, color: '#10b981' },
        { status: 'Revoked', count: 12, color: '#ef4444' }
      ],
      student_funnel: {
        registered: 1150,
        verified: 1120,
        issued: 1085
      }
    }
  };
}

/**
 * Generates a reactive list of realistic audit logs
 */
export function getDemoAuditLogs(count = 50) {
  seed = 2026; 
  const logs = [];
  const now = new Date();
  const actions = ['LOGIN', 'LOGIN_PASSKEY', 'REGISTER_PASSKEY', 'MINT_NFT', 'ISSUE_CERTIFICATE', 'REVOKE_CERTIFICATE', 'PASSWORD_CHANGE'];
  const methods = ['password', 'passkey', 'totp', 'system'];
  
  for (let i = 0; i < count; i++) {
    const eventTime = new Date(now.getTime() - randInt(1000 * 60, 1000 * 60 * 60 * 72));
    const action = actions[randInt(0, actions.length - 1)];
    
    logs.push({
      id: randInt(10000, 99999),
      timestamp: eventTime.toISOString(),
      user: 'admin@university.edu',
      action: action,
      auth_method: methods[randInt(0, methods.length - 1)],
      details: action === 'MINT_NFT' ? `Minted Token #${randInt(1000, 9999)}` : 'System operation successful',
      ip_address: `192.168.1.${randInt(1, 254)}`
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Returns mock list of certificates for the 'Records' tab
 */
export function getDemoCertificates(count = 30) {
  seed = 555;
  const certs = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const eventTime = new Date(now.getTime() - randInt(1000 * 60 * 60, 1000 * 60 * 60 * 1000));
    const dept = departments[randInt(0, departments.length - 1)];
    certs.push({
      id: i + 1,
      student_id: `STU${randInt(10000, 99999)}`,
      full_name: generateRandomName(),
      title: `B.Sc in ${dept}`,
      issue_date: eventTime.toISOString(),
      course_name: dept,
      tokenId: randInt(1000, 9999).toString(),
      isRevoked: i === 5,
      processing: false,
      nft: {
        transaction_hash: generateRandomHash()
      }
    });
  }
  return certs;
}

/**
 * Returns mock list of students for the 'Students' tab
 */
export function getDemoStudents(count = 50) {
  seed = 777;
  const students = [];
  for (let i = 0; i < count; i++) {
    const dept = departments[randInt(0, departments.length - 1)];
    students.push({
      id: i + 1,
      full_name: generateRandomName(),
      student_id_number: `STU${randInt(10000, 99999)}`,
      course_name: dept,
      year: randInt(1, 4),
      email: `${generateRandomName().toLowerCase().replace(' ', '.')}@student.edu`,
      wallet_address: `0x${generateRandomHash().substring(2, 42)}`,
      is_verified: true
    });
  }
  return students;
}
