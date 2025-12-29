const { pool } = require('./config/database');

async function addMinimalData() {
  try {
    console.log('🌱 Adding minimal dummy data...');

    // Get hospitals
    const [hospitals] = await pool.execute('SELECT hospital_id, name FROM hospitals WHERE is_active = TRUE');
    
    for (let i = 0; i < hospitals.length; i++) {
      const hospital = hospitals[i];
      console.log(`Adding data to ${hospital.name}...`);

      // Add 5 patients per hospital
      const patients = [
        { first: 'Ramesh', last: 'Kumar', gender: 'Male', blood: 'A+' },
        { first: 'Sita', last: 'Devi', gender: 'Female', blood: 'B+' },
        { first: 'Mohan', last: 'Singh', gender: 'Male', blood: 'O+' },
        { first: 'Geeta', last: 'Sharma', gender: 'Female', blood: 'AB+' },
        { first: 'Suresh', last: 'Lal', gender: 'Male', blood: 'A-' }
      ];

      for (let p = 0; p < patients.length; p++) {
        const patient = patients[p];
        await pool.execute(`
          INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone_number, address, state_id, district_id, aadhaar, blood_group, emergency_contact_name, emergency_contact_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patient.first, patient.last,
          new Date(1980 + p * 5, p * 2, 15),
          patient.gender,
          `98765${i + 1}${p + 1}000`,
          `Village ${patient.first}pur`,
          1, 1,
          `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
          patient.blood,
          `${patient.first} Contact`,
          `98765${i + 1}${p + 1}001`
        ]);
      }

      // Add 15 beds per hospital
      for (let b = 0; b < 15; b++) {
        await pool.execute(`
          INSERT INTO beds (hospital_id, bed_number, bed_type, status)
          VALUES (?, ?, ?, ?)
        `, [
          hospital.hospital_id,
          `B${String(b + 1).padStart(3, '0')}`,
          ['General', 'ICU', 'Emergency'][b % 3],
          b % 4 === 0 ? 'Occupied' : 'Available'
        ]);
      }

      // Add 2 ambulances per hospital
      for (let a = 0; a < 2; a++) {
        await pool.execute(`
          INSERT INTO ambulance_services (hospital_id, vehicle_number, driver_name, driver_phone, status)
          VALUES (?, ?, ?, ?, ?)
        `, [
          hospital.hospital_id,
          `UK${i + 1}${a + 1}A${Math.floor(Math.random() * 9000) + 1000}`,
          ['Ram Singh', 'Shyam Lal'][a],
          `98765${i + 1}${a + 1}999`,
          ['Available', 'On Duty'][a]
        ]);
      }
    }

    console.log('✅ Dummy data added successfully!');
    
    // Show summary
    const [patientCount] = await pool.execute('SELECT COUNT(*) as count FROM patients');
    const [bedCount] = await pool.execute('SELECT COUNT(*) as count FROM beds');
    const [ambulanceCount] = await pool.execute('SELECT COUNT(*) as count FROM ambulance_services');

    console.log('\n📊 SUMMARY:');
    console.log(`🏥 Hospitals: ${hospitals.length}`);
    console.log(`🤒 Patients: ${patientCount[0].count}`);
    console.log(`🛏️ Beds: ${bedCount[0].count}`);
    console.log(`🚑 Ambulances: ${ambulanceCount[0].count}`);

    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('Super Admin: superadmin@medilink.com | SuperAdmin123!');
    console.log('Hospital Admin: admin1@districthospitalalmora.com | Admin123!');
    console.log('Doctor: doctor1_1@districthospitalalmora.com | Doctor123!');
    console.log('Nurse: nurse1_1@districthospitalalmora.com | Nurse123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addMinimalData();