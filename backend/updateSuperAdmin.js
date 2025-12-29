const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

const updateSuperAdmin = async () => {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    
    // Update the super admin user
    const [result] = await pool.execute(
      `UPDATE users 
       SET password_hash = ?, first_name = ?, last_name = ?, phone = ?, user_role = ?, is_active = 1
       WHERE email = ?`,
      [
        hashedPassword,
        'Amol',
        'Rana', 
        '9876543210',
        'Super Admin',
        'ranaamol2005@gmail.com'
      ]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Super Admin credentials updated successfully');
    } else {
      console.log('❌ Super Admin user not found, creating new one...');
      
      // Create new super admin if not found
      await pool.execute(
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
    }

    console.log('');
    console.log('🎯 Super Admin Login Credentials:');
    console.log('📧 Email: ranaamol2005@gmail.com');
    console.log('🔑 Password: admin1234');
    console.log('👤 Role: Super Admin');
    console.log('');
    console.log('🚀 You can now login to the system!');
    
  } catch (error) {
    console.error('❌ Error updating super admin:', error.message);
  } finally {
    process.exit(0);
  }
};

// Run the script
updateSuperAdmin();