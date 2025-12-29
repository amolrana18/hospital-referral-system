const { pool } = require('./config/database');

async function quickTest() {
  try {
    console.log('🧪 Running Quick System Test...\n');

    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    const [result] = await pool.execute('SELECT 1 as test');
    console.log('✅ Database connected successfully\n');

    // Test 2: Check Tables
    console.log('2. Checking Required Tables...');
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const requiredTables = [
      'users', 'hospitals', 'hospital_staff', 'patients', 
      'referrals', 'beds', 'ambulance_services', 'districts', 'states'
    ];
    
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables.join(', '));
    } else {
      console.log('✅ All required tables exist\n');
    }

    // Test 3: Check Super Admin
    console.log('3. Checking Super Admin...');
    const [superAdmins] = await pool.execute(
      'SELECT email, user_role FROM users WHERE user_role = "Super Admin"'
    );
    
    if (superAdmins.length > 0) {
      console.log('✅ Super Admin exists:', superAdmins[0].email);
    } else {
      console.log('❌ No Super Admin found');
    }

    // Test 4: Check Hospitals
    console.log('\n4. Checking Hospitals...');
    const [hospitals] = await pool.execute(
      'SELECT COUNT(*) as count FROM hospitals WHERE is_active = TRUE'
    );
    console.log(`✅ Active hospitals: ${hospitals[0].count}`);

    // Test 5: Check Sample Data
    console.log('\n5. Checking Sample Data...');
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [patients] = await pool.execute('SELECT COUNT(*) as count FROM patients');
    const [beds] = await pool.execute('SELECT COUNT(*) as count FROM beds');
    
    console.log(`📊 Users: ${users[0].count}`);
    console.log(`📊 Patients: ${patients[0].count}`);
    console.log(`📊 Beds: ${beds[0].count}`);

    // Test 6: Sample Login Credentials
    console.log('\n6. Sample Login Credentials:');
    console.log('='.repeat(50));
    console.log('Super Admin: superadmin@medilink.com | SuperAdmin123!');
    
    const [sampleUsers] = await pool.execute(`
      SELECT u.email, u.user_role, h.name as hospital_name
      FROM users u
      LEFT JOIN hospital_staff hs ON u.user_id = hs.user_id
      LEFT JOIN hospitals h ON hs.hospital_id = h.hospital_id
      WHERE u.user_role != 'Super Admin'
      LIMIT 3
    `);
    
    sampleUsers.forEach(user => {
      const password = user.user_role === 'Hospital Admin' ? 'Admin123!' :
                      user.user_role === 'Doctor' ? 'Doctor123!' : 'Nurse123!';
      console.log(`${user.user_role}: ${user.email} | ${password}`);
      if (user.hospital_name) {
        console.log(`  Hospital: ${user.hospital_name}`);
      }
    });

    console.log('\n✅ Quick test completed successfully!');
    console.log('\n🚀 You can now:');
    console.log('1. Start backend: npm run dev (in backend folder)');
    console.log('2. Start frontend: ng serve (in frontend folder)');
    console.log('3. Access: http://localhost:4200');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

quickTest();