const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

const createSuperAdmin = async () => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ?',
      ['ranaamol2005@gmail.com']
    );

    if (existingUsers.length > 0) {
      console.log('✅ Super Admin user already exists');
      return;
    }

    // Insert super admin user
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, user_role, is_active, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'ranaamol2005@gmail.com',
        hashedPassword,
        'Amol',
        'Rana',
        '9876543210',
        'Super Admin',
        1
      ]
    );

    console.log('✅ Super Admin user created successfully');
    console.log('📧 Email: ranaamol2005@gmail.com');
    console.log('🔑 Password: admin1234');
    console.log('👤 Role: Super Admin');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
  } finally {
    process.exit(0);
  }
};

// Run the script
createSuperAdmin();