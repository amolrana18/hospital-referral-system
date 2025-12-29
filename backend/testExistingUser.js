const axios = require('axios');

async function testReferralWithExistingUser() {
  try {
    console.log('Testing referral creation with existing user...');
    
    // Test login with existing hospital admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin1@districthospitalalmora.com',
      password: 'Admin123!'
    });
    
    if (loginResponse.data.success) {
      console.log('Login successful:', loginResponse.data.user);
      const token = loginResponse.data.token;
      
      // Test referral creation
      console.log('\\nTesting referral creation...');
      const referralData = {
        patient_id: 1,
        receiving_hospital_id: 2,
        reason_for_referral: 'Test referral from API',
        clinical_summary: 'Patient needs specialized care',
        priority: 'Routine',
        bed_required: true,
        doctor_required: true,
        ambulance_required: false
      };
      
      console.log('Sending referral data:', referralData);
      
      const referralResponse = await axios.post(
        'http://localhost:5000/api/referrals',
        referralData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Referral creation successful:', referralResponse.data);
    } else {
      console.log('Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

testReferralWithExistingUser();