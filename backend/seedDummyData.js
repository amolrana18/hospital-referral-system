const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDummyData() {
  try {
    console.log('🌱 Starting to seed dummy data...');

    // Get existing hospitals
    const [hospitals] = await pool.execute('SELECT hospital_id, name FROM hospitals WHERE is_active = TRUE');
    console.log(`Found ${hospitals.length} hospitals to populate with data`);

    if (hospitals.length === 0) {
      console.log('❌ No hospitals found. Please create hospitals first.');
      return;
    }

    // Create dummy users and staff for each hospital
    const userData = [];
    const staffData = [];
    const patientData = [];

    for (let i = 0; i < hospitals.length; i++) {
      const hospital = hospitals[i];
      console.log(`\n🏥 Processing ${hospital.name}...`);

      // 1. Create Hospital Admin
      const adminEmail = `admin${i + 1}@${hospital.name.toLowerCase().replace(/\s+/g, '')}.com`;
      const adminPassword = 'Admin123!';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

      const [adminResult] = await pool.execute(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, user_role, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminEmail,
        hashedAdminPassword,
        `Admin${i + 1}`,
        'Manager',
        `9876543${String(i).padStart(3, '0')}`,
        'Hospital Admin',
        'Male'
      ]);

      userData.push({
        email: adminEmail,
        password: adminPassword,
        role: 'Hospital Admin',
        hospital: hospital.name
      });

      // Create staff record for admin
      await pool.execute(`
        INSERT INTO hospital_staff 
        (user_id, hospital_id, employee_code, designation, department, joining_date, contact_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminResult.insertId,
        hospital.hospital_id,
        `ADM${String(i + 1).padStart(3, '0')}`,
        'Hospital Administrator',
        'Administration',
        '2023-01-15',
        `9876543${String(i).padStart(3, '0')}`
      ]);

      // 2. Create Doctors
      const doctorSpecializations = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency Medicine'];
      for (let j = 0; j < 3; j++) {
        const doctorEmail = `doctor${i + 1}_${j + 1}@${hospital.name.toLowerCase().replace(/\s+/g, '')}.com`;
        const doctorPassword = 'Doctor123!';
        const hashedDoctorPassword = await bcrypt.hash(doctorPassword, 10);

        const [doctorResult] = await pool.execute(`
          INSERT INTO users (email, password_hash, first_name, last_name, phone, user_role, gender)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          doctorEmail,
          hashedDoctorPassword,
          `Dr. ${['Rajesh', 'Priya', 'Amit'][j]}`,
          ['Sharma', 'Patel', 'Kumar'][j],
          `9876${String(i)}${String(j)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          'Doctor',
          ['Male', 'Female', 'Male'][j]
        ]);

        userData.push({
          email: doctorEmail,
          password: doctorPassword,
          role: 'Doctor',
          hospital: hospital.name
        });

        // Create staff record for doctor
        await pool.execute(`
          INSERT INTO hospital_staff 
          (user_id, hospital_id, employee_code, designation, department, specialization, qualifications, registration_number, experience_years, joining_date, contact_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          doctorResult.insertId,
          hospital.hospital_id,
          `DOC${String(i + 1).padStart(2, '0')}${String(j + 1)}`,
          'Senior Doctor',
          'Medical',
          doctorSpecializations[j % doctorSpecializations.length],
          'MBBS, MD',
          `MED${String(i + 1)}${String(j + 1)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          Math.floor(Math.random() * 15) + 5,
          '2022-03-01',
          `9876${String(i)}${String(j)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        ]);
      }

      // 3. Create Nurses
      for (let k = 0; k < 4; k++) {
        const nurseEmail = `nurse${i + 1}_${k + 1}@${hospital.name.toLowerCase().replace(/\s+/g, '')}.com`;
        const nursePassword = 'Nurse123!';
        const hashedNursePassword = await bcrypt.hash(nursePassword, 10);

        const [nurseResult] = await pool.execute(`
          INSERT INTO users (email, password_hash, first_name, last_name, phone, user_role, gender)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          nurseEmail,
          hashedNursePassword,
          ['Sunita', 'Meera', 'Kavita', 'Pooja'][k],
          ['Singh', 'Gupta', 'Verma', 'Joshi'][k],
          `9876${String(i)}${String(k + 5)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          'Nurse',
          'Female'
        ]);

        userData.push({
          email: nurseEmail,
          password: nursePassword,
          role: 'Nurse',
          hospital: hospital.name
        });

        // Create staff record for nurse
        await pool.execute(`
          INSERT INTO hospital_staff 
          (user_id, hospital_id, employee_code, designation, department, qualifications, experience_years, joining_date, contact_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          nurseResult.insertId,
          hospital.hospital_id,
          `NUR${String(i + 1).padStart(2, '0')}${String(k + 1)}`,
          'Staff Nurse',
          'Nursing',
          'GNM, BSc Nursing',
          Math.floor(Math.random() * 10) + 2,
          '2022-06-01',
          `9876${String(i)}${String(k + 5)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        ]);
      }

      // 4. Create Patients
      const patientNames = [
        { first: 'Ramesh', last: 'Chandra', gender: 'Male' },
        { first: 'Sita', last: 'Devi', gender: 'Female' },
        { first: 'Mohan', last: 'Lal', gender: 'Male' },
        { first: 'Geeta', last: 'Sharma', gender: 'Female' },
        { first: 'Suresh', last: 'Kumar', gender: 'Male' },
        { first: 'Kamala', last: 'Devi', gender: 'Female' }
      ];

      for (let p = 0; p < 6; p++) {
        const patient = patientNames[p];
        const [patientResult] = await pool.execute(`
          INSERT INTO patients 
          (first_name, last_name, date_of_birth, gender, phone_number, address, state_id, district_id, 
           aadhaar, blood_group, emergency_contact_name, emergency_contact_number, medical_history)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patient.first,
          patient.last,
          new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          patient.gender,
          `98765${String(i)}${String(p)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
          `Village ${['Rampur', 'Sitapur', 'Govindpur', 'Shyampur', 'Raghunathpur', 'Krishnapur'][p]}, Post Office ${hospital.name}`,
          1, // Uttarakhand state_id
          Math.floor(Math.random() * 13) + 1, // Random district
          `${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}`,
          ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'][p],
          `${patient.first} Emergency Contact`,
          `98765${String(i)}${String(p)}${String(Math.floor(Math.random() * 100) + 10).padStart(2, '0')}`,
          ['Chest Pain', 'Fever', 'Accident', 'Pregnancy', 'Breathing Issues', 'Heart Problem'][p]
        ]);

        patientData.push({
          name: `${patient.first} ${patient.last}`,
          phone: `98765${String(i)}${String(p)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
          hospital: hospital.name
        });
      }

      // 5. Create Beds
      const bedTypes = ['General', 'ICU', 'Emergency', 'Maternity'];
      for (let b = 0; b < 20; b++) {
        await pool.execute(`
          INSERT INTO beds (hospital_id, bed_number, bed_type, ward_name, status)
          VALUES (?, ?, ?, ?, ?)
        `, [
          hospital.hospital_id,
          `${String.fromCharCode(65 + Math.floor(b / 5))}${(b % 5) + 1}`,
          bedTypes[Math.floor(Math.random() * bedTypes.length)],
          `Ward ${String.fromCharCode(65 + Math.floor(b / 5))}`,
          Math.random() > 0.3 ? 'Available' : 'Occupied'
        ]);
      }

      // 6. Create Ambulances
      for (let a = 0; a < 3; a++) {
        await pool.execute(`
          INSERT INTO ambulances (hospital_id, vehicle_number, driver_name, driver_phone, status, current_location)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          hospital.hospital_id,
          `UK${String(i + 1).padStart(2, '0')}${String.fromCharCode(65 + a)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
          ['Ram Singh', 'Shyam Lal', 'Gopal Das'][a],
          `9876${String(i)}${String(a)}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          ['Available', 'On Duty', 'Maintenance'][Math.floor(Math.random() * 3)],
          `${hospital.name} Base Station`
        ]);
      }
    }

    console.log('\n✅ Dummy data seeded successfully!');
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    
    // Super Admin (if exists)
    console.log('\n🔑 SUPER ADMIN:');
    console.log('Email: superadmin@medilink.com');
    console.log('Password: SuperAdmin123!');
    
    console.log('\n🏥 HOSPITAL ADMINS:');
    userData.filter(u => u.role === 'Hospital Admin').forEach(user => {
      console.log(`Hospital: ${user.hospital}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('---');
    });

    console.log('\n👨‍⚕️ DOCTORS:');
    userData.filter(u => u.role === 'Doctor').forEach(user => {
      console.log(`Hospital: ${user.hospital}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('---');
    });

    console.log('\n👩‍⚕️ NURSES:');
    userData.filter(u => u.role === 'Nurse').forEach(user => {
      console.log(`Hospital: ${user.hospital}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('---');
    });

    console.log('\n🏥 SUMMARY:');
    console.log(`Total Users Created: ${userData.length}`);
    console.log(`Total Patients Created: ${patientData.length}`);
    console.log(`Total Beds Created: ${hospitals.length * 20}`);
    console.log(`Total Ambulances Created: ${hospitals.length * 3}`);

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
  } finally {
    await pool.end();
  }
}

// Run the seeder
seedDummyData();