const { pool } = require('./config/database');

async function addFinalData() {
  try {
    console.log('🌱 Adding dummy data (checking for existing data)...');

    const [hospitals] = await pool.execute('SELECT hospital_id, name FROM hospitals WHERE is_active = TRUE');
    
    for (let i = 0; i < hospitals.length; i++) {
      const hospital = hospitals[i];
      
      // Check existing patients for this hospital area
      const [existingPatients] = await pool.execute(`
        SELECT COUNT(*) as count FROM patients WHERE address LIKE ?
      `, [`%${hospital.name}%`]);
      
      if (existingPatients[0].count === 0) {
        console.log(`Adding patients to ${hospital.name}...`);
        
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
            `Village ${patient.first}pur, ${hospital.name} Area`,
            1, 1,
            `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
            patient.blood,
            `${patient.first} Contact`,
            `98765${i + 1}${p + 1}001`
          ]);
        }
      }

      // Check existing beds
      const [existingBeds] = await pool.execute(`
        SELECT COUNT(*) as count FROM beds WHERE hospital_id = ?
      `, [hospital.hospital_id]);
      
      if (existingBeds[0].count === 0) {
        console.log(`Adding beds to ${hospital.name}...`);
        
        for (let b = 0; b < 15; b++) {
          await pool.execute(`
            INSERT INTO beds (hospital_id, bed_number, bed_type, status)
            VALUES (?, ?, ?, ?)
          `, [
            hospital.hospital_id,
            `${hospital.hospital_id}B${String(b + 1).padStart(3, '0')}`,
            ['General', 'ICU', 'Emergency'][b % 3],
            b % 4 === 0 ? 'Occupied' : 'Available'
          ]);
        }
      }
    }

    console.log('✅ Data added successfully!');
    
    const [patientCount] = await pool.execute('SELECT COUNT(*) as count FROM patients');
    const [bedCount] = await pool.execute('SELECT COUNT(*) as count FROM beds');
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');

    console.log('\n📊 FINAL SUMMARY:');
    console.log(`🏥 Hospitals: ${hospitals.length}`);
    console.log(`👥 Users: ${userCount[0].count}`);
    console.log(`🤒 Patients: ${patientCount[0].count}`);
    console.log(`🛏️ Beds: ${bedCount[0].count}`);

    console.log('\n🔑 ALL LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log('🔑 SUPER ADMIN:');
    console.log('Email: superadmin@medilink.com');
    console.log('Password: SuperAdmin123!');
    
    console.log('\n🏥 HOSPITAL ADMINS:');
    console.log('admin1@districthospitalalmora.com | Admin123!');
    console.log('admin2@doonmedicalcollegehospital.com | Admin123!');
    console.log('admin3@hospital3.com | Admin123!');
    console.log('admin4@hospital4.com | Admin123!');
    console.log('admin5@hospital5.com | Admin123!');
    console.log('admin6@hospital6.com | Admin123!');
    console.log('admin7@hospital7.com | Admin123!');
    
    console.log('\n👨⚕️ DOCTORS:');
    console.log('doctor1_1@districthospitalalmora.com | Doctor123!');
    console.log('doctor1_2@districthospitalalmora.com | Doctor123!');
    console.log('doctor2_1@doonmedicalcollegehospital.com | Doctor123!');
    
    console.log('\n👩⚕️ NURSES:');
    console.log('nurse1_1@districthospitalalmora.com | Nurse123!');
    console.log('nurse1_2@districthospitalalmora.com | Nurse123!');
    console.log('nurse2_1@doonmedicalcollegehospital.com | Nurse123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addFinalData();