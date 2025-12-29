const { pool } = require('./config/database');

async function addCurrentStatusField() {
  try {
    console.log('Adding current_status field to hospital_staff table...');
    
    // Check if the field already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hospital_referral_system' 
      AND TABLE_NAME = 'hospital_staff' 
      AND COLUMN_NAME = 'current_status'
    `);
    
    if (columns.length > 0) {
      console.log('current_status field already exists');
      return;
    }
    
    // Add the field
    await pool.execute(`
      ALTER TABLE hospital_staff 
      ADD COLUMN current_status ENUM('On-Duty', 'Off-Duty', 'On-Leave', 'On-Call', 'Emergency Duty') 
      DEFAULT 'Off-Duty' 
      AFTER contact_number
    `);
    
    // Update existing records
    await pool.execute(`
      UPDATE hospital_staff 
      SET current_status = 'Off-Duty' 
      WHERE current_status IS NULL
    `);
    
    console.log('Successfully added current_status field to hospital_staff table');
    
  } catch (error) {
    console.error('Error adding current_status field:', error);
  } finally {
    process.exit();
  }
}

addCurrentStatusField();