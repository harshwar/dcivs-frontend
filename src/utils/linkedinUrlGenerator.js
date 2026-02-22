/**
 * Generates a pre-filled LinkedIn "Add Certification" URL.
 * 
 * LinkedIn schema documentation:
 * https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME
 * Parameters:
 *  - name: Name of the certification
 *  - organizationName: Issuing organization
 *  - issueYear: The year the certification was issued
 *  - issueMonth: The month the certification was issued (1-12)
 *  - certId: The unique credential ID (Token ID)
 *  - certUrl: The public verification URL
 * 
 * @param {Object} certificate - The NFT asset object
 * @returns {string} The fully constructed LinkedIn URL
 */
export function generateLinkedInCertUrl(certificate) {
  if (!certificate) return '';

  const baseUrl = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME';
  
  // Format the date (assuming ISO string or similar from DB)
  let issueYear = '';
  let issueMonth = '';
  
  if (certificate.issuedAt || certificate.created_at) {
    const date = new Date(certificate.issuedAt || certificate.created_at);
    if (!isNaN(date)) {
      issueYear = date.getFullYear().toString();
      issueMonth = (date.getMonth() + 1).toString();
    }
  }

  // Construct the public verification URL
  // We use the current origin to build the absolute URL to the gallery
  const origin = window.location.origin;
  const certUrl = `${origin}/gallery?address=${certificate.contractAddress}&tokenId=${certificate.tokenId}`;

  const params = new URLSearchParams({
    name: certificate.courseName || certificate.name || 'Verified Certificate',
    organizationName: 'University NFT Registry', // Adjust to your actual institution name
    issueYear,
    issueMonth,
    certId: certificate.tokenId ? certificate.tokenId.toString() : '',
    certUrl
  });

  return `${baseUrl}&${params.toString()}`;
}
