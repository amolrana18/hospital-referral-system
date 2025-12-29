const { pool } = require('./config/database');

async function checkReferralsTable() {
  try {
    console.log('Checking referrals table compatibility...');
    
    // Check if all required fields exist
    const requiredFields = [
      'patient_id',
      'referring_hospital_id', 
      'referring_staff_id',
      'receiving_hospital_id',
      'reason_for_referral',
      'clinical_summary',
      'priority',
      'bed_required',
      'doctor_required',
      'ambulance_required',
      'attached_report_ids',
      'status'
    ];
    
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_referral_system'
      AND TABLE_NAME = 'referrals'
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    console.log('Required fields check:');
    requiredFields.forEach(field => {
      const exists = existingColumns.includes(field);
      console.log(`- ${field}: ${exists ? '✓' : '✗'}`);
    });
    
    // Check priority enum values
    console.log('\nChecking priority enum values...');
    const [priorityInfo] = await pool.execute(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_referral_system'
      AND TABLE_NAME = 'referrals'
      AND COLUMN_NAME = 'priority'
    `);
    
    if (priorityInfo.length > 0) {
      console.log('Priority enum values:', priorityInfo[0].COLUMN_TYPE);
    }
    
    // Check status enum values
    console.log('\nChecking status enum values...');
    const [statusInfo] = await pool.execute(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_referral_system'
      AND TABLE_NAME = 'referrals'
      AND COLUMN_NAME = 'status'
    `);
    
    if (statusInfo.length > 0) {
      console.log('Status enum values:', statusInfo[0].COLUMN_TYPE);
    }
    
    // Test a simple insert to see what fails
    console.log('\nTesting referral creation...');
    
    // First, let's check if we have any patients and hospitals
    const [patients] = await pool.execute('SELECT COUNT(*) as count FROM patients');
    const [hospitals] = await pool.execute('SELECT COUNT(*) as count FROM hospitals');
    
    console.log(`Patients in database: ${patients[0].count}`);
    console.log(`Hospitals in database: ${hospitals[0].count}`);
    
    if (patients[0].count === 0) {
      console.log('No patients found - this might be the issue!');
    }
    
    if (hospitals[0].count === 0) {
      console.log('No hospitals found - this might be the issue!');
    }
    
  } catch (error) {
    console.error('Error checking referrals table:', error);
  } finally {
    process.exit();
  }
}

checkReferralsTable();