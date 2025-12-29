const { pool } = require('./config/database');

async function checkTables() {
  try {
    console.log('Checking existing tables...');
    
    // Get all tables
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_referral_system'
    `);
    
    console.log('Existing tables:');
    tables.forEach(table => console.log('- ' + table.TABLE_NAME));
    
    // Check foreign key constraints on referrals table
    console.log('\nForeign key constraints referencing referrals table:');
    const [constraints] = await pool.execute(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = 'hospital_referral_system'
      AND REFERENCED_TABLE_NAME = 'referrals'
    `);
    
    constraints.forEach(constraint => {
      console.log(`- ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME} (${constraint.CONSTRAINT_NAME})`);
    });
    
    // Check referrals table structure
    console.log('\nReferrals table structure:');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_referral_system'
      AND TABLE_NAME = 'referrals'
      ORDER BY ORDINAL_POSITION
    `);
    
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT ? 'DEFAULT ' + col.COLUMN_DEFAULT : ''}`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    process.exit();
  }
}

checkTables();