const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkAndCreateTestUser() {
  try {
    console.log('Checking existing users...');
    
    // Check existing users
    const [users] = await pool.execute(`
      SELECT u.user_id, u.email, u.user_role, u.first_name, u.last_name,
             hs.hospital_id, hs.staff_id, h.name as hospital_name
      FROM users u
      LEFT JOIN hospital_staff hs ON u.user_id = hs.user_id
      LEFT JOIN hospitals h ON hs.hospital_id = h.hospital_id
      ORDER BY u.user_id
    `);
    
    console.log('Existing users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.user_role}) - Hospital: ${user.hospital_name || 'None'}`);
    });
    
    // Check if we have a test user
    const testUser = users.find(u => u.email === 'doctor@test.com');
    
    if (!testUser) {
      console.log('\\nCreating test user...');
      
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const [userResult] = await pool.execute(`
        INSERT INTO users (email, password_hash, first_name, last_name, user_role)
        VALUES (?, ?, ?, ?, ?)
      `, ['doctor@test.com', hashedPassword, 'Test', 'Doctor', 'Doctor']);
      
      const userId = userResult.insertId;
      
      // Create staff record
      const [staffResult] = await pool.execute(`
        INSERT INTO hospital_staff 
        (user_id, hospital_id, employee_code, designation, department, joining_date, is_active)
        VALUES (?, ?, ?, ?, ?, CURDATE(), TRUE)
      `, [userId, 1, `EMP${userId}`, 'Doctor', 'General Medicine']);
      
      console.log('Test user created successfully!');
      console.log('Email: doctor@test.com');
      console.log('Password: password123');
      console.log('Role: Doctor');
      console.log('Hospital ID: 1');
    } else {
      console.log('\\nTest user already exists:');
      console.log('Email: doctor@test.com');
      console.log('Password: password123');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkAndCreateTestUser();