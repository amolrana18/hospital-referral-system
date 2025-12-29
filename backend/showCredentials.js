const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function showAllCredentials() {
  try {
    console.log('🔍 Checking existing data and credentials...\n');

    // Get all hospitals
    const [hospitals] = await pool.execute('SELECT hospital_id, name FROM hospitals WHERE is_active = TRUE');
    
    // Get all users with their hospital info
    const [users] = await pool.execute(`
      SELECT u.email, u.user_role, u.first_name, u.last_name, h.name as hospital_name
      FROM users u
      LEFT JOIN hospital_staff hs ON u.user_id = hs.user_id
      LEFT JOIN hospitals h ON hs.hospital_id = h.hospital_id
      WHERE u.is_active = TRUE
      ORDER BY u.user_role, h.name, u.first_name
    `);

    console.log('📧 ALL EXISTING LOGIN CREDENTIALS:');
    console.log('='.repeat(80));
    
    // Super Admin
    console.log('\n🔑 SUPER ADMIN:');
    console.log('Email: superadmin@medilink.com');
    console.log('Password: SuperAdmin123!');
    console.log('Role: Super Admin');
    console.log('Access: Full system access');
    
    // Group users by hospital
    const hospitalGroups = {};
    const rolePasswords = {
      'Hospital Admin': 'Admin123!',
      'Doctor': 'Doctor123!',
      'Nurse': 'Nurse123!'
    };

    users.forEach(user => {
      if (user.user_role !== 'Super Admin') {
        const hospitalName = user.hospital_name || 'No Hospital Assigned';
        if (!hospitalGroups[hospitalName]) {
          hospitalGroups[hospitalName] = [];
        }
        hospitalGroups[hospitalName].push({
          email: user.email,
          role: user.user_role,
          name: `${user.first_name} ${user.last_name}`,
          password: rolePasswords[user.user_role] || 'Unknown123!'
        });
      }
    });

    // Display by hospital
    Object.keys(hospitalGroups).forEach(hospitalName => {
      console.log(`\n🏥 ${hospitalName.toUpperCase()}:`);
      console.log('-'.repeat(50));
      
      const hospitalUsers = hospitalGroups[hospitalName];
      
      // Hospital Admins
      const admins = hospitalUsers.filter(u => u.role === 'Hospital Admin');
      if (admins.length > 0) {
        console.log('\n👨💼 Hospital Admins:');
        admins.forEach(admin => {
          console.log(`   ${admin.name}: ${admin.email} | ${admin.password}`);
        });
      }
      
      // Doctors
      const doctors = hospitalUsers.filter(u => u.role === 'Doctor');
      if (doctors.length > 0) {
        console.log('\n👨⚕️ Doctors:');
        doctors.forEach(doctor => {
          console.log(`   ${doctor.name}: ${doctor.email} | ${doctor.password}`);
        });
      }
      
      // Nurses
      const nurses = hospitalUsers.filter(u => u.role === 'Nurse');
      if (nurses.length > 0) {
        console.log('\n👩⚕️ Nurses:');
        nurses.forEach(nurse => {
          console.log(`   ${nurse.name}: ${nurse.email} | ${nurse.password}`);
        });
      }
    });

    // Check for hospitals without staff and add if needed
    const hospitalsWithStaff = new Set(users.filter(u => u.hospital_name).map(u => u.hospital_name));
    const hospitalsWithoutStaff = hospitals.filter(h => !hospitalsWithStaff.has(h.name));

    if (hospitalsWithoutStaff.length > 0) {
      console.log('\n⚠️  HOSPITALS WITHOUT STAFF:');
      hospitalsWithoutStaff.forEach(h => console.log(`   - ${h.name}`));
      
      console.log('\n🌱 Adding basic staff to hospitals without staff...');
      
      for (let i = 0; i < hospitalsWithoutStaff.length; i++) {
        const hospital = hospitalsWithoutStaff[i];
        const hospitalIndex = hospitals.findIndex(h => h.hospital_id === hospital.hospital_id);
        
        // Add Hospital Admin
        const adminEmail = `admin${hospitalIndex + 1}@hospital${hospitalIndex + 1}.com`;
        const adminPassword = 'Admin123!';
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

        const [adminResult] = await pool.execute(`
          INSERT INTO users (email, password_hash, first_name, last_name, phone, user_role, gender)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [adminEmail, hashedAdminPassword, `Admin${hospitalIndex + 1}`, 'Manager', `987654${String(hospitalIndex + 1).padStart(4, '0')}`, 'Hospital Admin', 'Male']);

        await pool.execute(`
          INSERT INTO hospital_staff (user_id, hospital_id, employee_code, designation, department, joining_date, contact_number)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [adminResult.insertId, hospital.hospital_id, `ADM${String(hospitalIndex + 1).padStart(3, '0')}`, 'Hospital Administrator', 'Administration', '2023-01-15', `987654${String(hospitalIndex + 1).padStart(4, '0')}`]);

        console.log(`   ✅ Added admin to ${hospital.name}: ${adminEmail} | ${adminPassword}`);
      }
    }

    // Get counts
    const [patientCount] = await pool.execute('SELECT COUNT(*) as count FROM patients');
    const [bedCount] = await pool.execute('SELECT COUNT(*) as count FROM beds');
    const [ambulanceCount] = await pool.execute('SELECT COUNT(*) as count FROM ambulance_services');

    console.log('\n🎯 QUICK TEST CREDENTIALS:');
    console.log('='.repeat(50));
    console.log('🔑 Super Admin: superadmin@medilink.com | SuperAdmin123!');
    
    const allUsers = Object.values(hospitalGroups).flat();
    const firstAdmin = allUsers.find(u => u.role === 'Hospital Admin');
    const firstDoctor = allUsers.find(u => u.role === 'Doctor');
    const firstNurse = allUsers.find(u => u.role === 'Nurse');
    
    if (firstAdmin) console.log(`🏥 Hospital Admin: ${firstAdmin.email} | ${firstAdmin.password}`);
    if (firstDoctor) console.log(`👨⚕️ Doctor: ${firstDoctor.email} | ${firstDoctor.password}`);
    if (firstNurse) console.log(`👩⚕️ Nurse: ${firstNurse.email} | ${firstNurse.password}`);

    console.log('\n📊 DATABASE SUMMARY:');
    console.log('='.repeat(50));
    console.log(`🏥 Hospitals: ${hospitals.length}`);
    console.log(`👥 Total Users: ${users.length}`);
    console.log(`🏥 Hospital Admins: ${users.filter(u => u.user_role === 'Hospital Admin').length}`);
    console.log(`👨⚕️ Doctors: ${users.filter(u => u.user_role === 'Doctor').length}`);
    console.log(`👩⚕️ Nurses: ${users.filter(u => u.user_role === 'Nurse').length}`);
    console.log(`🤒 Patients: ${patientCount[0].count}`);
    console.log(`🛏️ Beds: ${bedCount[0].count}`);
    console.log(`🚑 Ambulances: ${ambulanceCount[0].count}`);

    console.log('\n💡 PASSWORD PATTERNS:');
    console.log('='.repeat(50));
    console.log('🔑 Super Admin: SuperAdmin123!');
    console.log('🏥 Hospital Admin: Admin123!');
    console.log('👨⚕️ Doctor: Doctor123!');
    console.log('👩⚕️ Nurse: Nurse123!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

showAllCredentials();