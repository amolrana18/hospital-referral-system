const { pool } = require('./config/database');
const Referral = require('./models/Referral');
const Patient = require('./models/Patient');
const Hospital = require('./models/Hospital');

async function testReferralCreation() {
  try {
    console.log('Testing referral creation...');
    
    // Get a sample patient
    const [patients] = await pool.execute('SELECT * FROM patients LIMIT 1');
    if (patients.length === 0) {
      console.log('No patients found!');
      return;
    }
    const patient = patients[0];
    console.log('Using patient:', patient.first_name, patient.last_name);
    
    // Get sample hospitals
    const [hospitals] = await pool.execute('SELECT * FROM hospitals LIMIT 2');
    if (hospitals.length < 2) {
      console.log('Need at least 2 hospitals!');
      return;
    }
    const referringHospital = hospitals[0];
    const receivingHospital = hospitals[1];
    console.log('Referring hospital:', referringHospital.name);
    console.log('Receiving hospital:', receivingHospital.name);
    
    // Get a sample staff member
    const [staff] = await pool.execute('SELECT * FROM hospital_staff WHERE hospital_id = ? LIMIT 1', [referringHospital.hospital_id]);
    const staffId = staff.length > 0 ? staff[0].staff_id : null;
    console.log('Staff ID:', staffId);
    
    // Test referral data
    const referralData = {
      patient_id: patient.patient_id,
      referring_hospital_id: referringHospital.hospital_id,
      referring_staff_id: staffId,
      receiving_hospital_id: receivingHospital.hospital_id,
      reason_for_referral: 'Test referral for debugging',
      clinical_summary: 'Patient needs specialized care',
      priority: 'Routine',
      bed_required: true,
      doctor_required: true,
      ambulance_required: false,
      attached_report_ids: null
    };
    
    console.log('Referral data:', JSON.stringify(referralData, null, 2));
    
    // Try to create referral
    const result = await Referral.create(referralData);
    console.log('Referral created successfully!', result);
    
    // Get the created referral
    const createdReferral = await Referral.findById(result.id);
    console.log('Created referral:', JSON.stringify(createdReferral, null, 2));
    
  } catch (error) {
    console.error('Error testing referral creation:', error);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
  } finally {
    process.exit();
  }
}

testReferralCreation();