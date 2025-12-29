const { pool } = require('./config/database');

async function testReferralUpdates() {
  try {
    console.log('Testing referral updates...');
    
    // Test 1: Check if referrals table exists and has data
    const [referrals] = await pool.execute('SELECT COUNT(*) as count FROM referrals');
    console.log(`Total referrals in database: ${referrals[0].count}`);
    
    // Test 2: Check recent referrals
    const [recent] = await pool.execute(`
      SELECT r.referral_id, r.status, r.priority, r.referral_date,
             CONCAT(p.first_name, ' ', p.last_name) as patient_name,
             rh.name as referring_hospital,
             eh.name as receiving_hospital
      FROM referrals r
      JOIN patients p ON r.patient_id = p.patient_id
      JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
      JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
      ORDER BY r.referral_date DESC
      LIMIT 5
    `);
    
    console.log('\nRecent referrals:');
    recent.forEach(ref => {
      console.log(`- ${ref.patient_name}: ${ref.referring_hospital} → ${ref.receiving_hospital} (${ref.status}, ${ref.priority})`);
    });
    
    // Test 3: Check referral statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN priority = 'Emergency' THEN 1 END) as emergency,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical
      FROM referrals
    `);
    
    console.log('\nReferral Statistics:');
    console.log(`Total: ${stats[0].total}`);
    console.log(`Submitted: ${stats[0].submitted}`);
    console.log(`Approved: ${stats[0].approved}`);
    console.log(`Completed: ${stats[0].completed}`);
    console.log(`Rejected: ${stats[0].rejected}`);
    console.log(`Emergency: ${stats[0].emergency}`);
    console.log(`Critical: ${stats[0].critical}`);
    
    // Test 4: Check hospital statistics
    const [hospitalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(bed_capacity) as total_beds,
        SUM(operational_beds) as available_beds,
        SUM(icu_beds) as available_icu_beds,
        SUM(ventilator_beds) as available_ventilators
      FROM hospitals 
      WHERE is_active = TRUE
    `);
    
    console.log('\nHospital Statistics:');
    console.log(`Total Hospitals: ${hospitalStats[0].total_hospitals}`);
    console.log(`Total Beds: ${hospitalStats[0].total_beds}`);
    console.log(`Available Beds: ${hospitalStats[0].available_beds}`);
    console.log(`Available ICU Beds: ${hospitalStats[0].available_icu_beds}`);
    console.log(`Available Ventilators: ${hospitalStats[0].available_ventilators}`);
    
  } catch (error) {
    console.error('Error testing referral updates:', error);
  } finally {
    await pool.end();
  }
}

testReferralUpdates();