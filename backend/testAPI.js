const axios = require('axios');

async function testReferralAPI() {
  try {
    console.log('Testing referral API...');
    
    // First, test if server is running
    const healthCheck = await axios.get('http://localhost:5000/health');
    console.log('Health check:', healthCheck.data);
    
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testReferralAPI();