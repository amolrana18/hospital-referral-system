const { pool } = require('./config/database');

async function testDatabase() {
  try {
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Check if hospitals table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'hospitals'");
    
    if (tables.length === 0) {
      console.log('❌ Hospitals table does not exist. Creating...');
      
      // Create states table first
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS states (
          state_id INT PRIMARY KEY AUTO_INCREMENT,
          state_name VARCHAR(100) NOT NULL,
          state_code VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert Uttarakhand state
      await connection.execute(`
        INSERT IGNORE INTO states (state_id, state_name, state_code) 
        VALUES (1, 'Uttarakhand', 'UK')
      `);
      
      // Create districts table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS districts (
          district_id INT PRIMARY KEY AUTO_INCREMENT,
          district_name VARCHAR(100) NOT NULL,
          district_code VARCHAR(10),
          state_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (state_id) REFERENCES states(state_id)
        )
      `);
      
      // Insert some districts
      await connection.execute(`
        INSERT IGNORE INTO districts (district_id, district_name, state_id) VALUES
        (1, 'Dehradun', 1),
        (2, 'Haridwar', 1),
        (3, 'Chamoli', 1),
        (4, 'Uttarkashi', 1),
        (5, 'Rudraprayag', 1)
      `);
      
      // Create blocks table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS blocks (
          block_id INT PRIMARY KEY AUTO_INCREMENT,
          block_name VARCHAR(100) NOT NULL,
          block_code VARCHAR(10),
          district_id INT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (district_id) REFERENCES districts(district_id)
        )
      `);
      
      // Create hospitals table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS hospitals (
          hospital_id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          type ENUM('Government', 'Private', 'Charitable', 'Trust', 'Medical College', 'AIIMS', 'ESI', 'Military') NOT NULL,
          hospital_level ENUM('Primary Health Centre', 'Community Health Centre', 'Sub-District Hospital', 'District Hospital', 'Tertiary', 'Super Specialty', 'Medical College') NOT NULL,
          state_id INT NOT NULL DEFAULT 1,
          district_id INT NOT NULL,
          block_id INT NULL,
          address TEXT NOT NULL,
          pincode VARCHAR(10) NOT NULL,
          contact_number VARCHAR(15) NOT NULL,
          emergency_number VARCHAR(15) NOT NULL,
          email VARCHAR(255),
          hospital_code VARCHAR(50) UNIQUE NOT NULL,
          bed_capacity INT DEFAULT 0,
          operational_beds INT DEFAULT 0,
          icu_beds INT DEFAULT 0,
          ventilator_beds INT DEFAULT 0,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          is_active BOOLEAN DEFAULT TRUE,
          established_year INT,
          website VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (state_id) REFERENCES states(state_id),
          FOREIGN KEY (district_id) REFERENCES districts(district_id),
          FOREIGN KEY (block_id) REFERENCES blocks(block_id)
        )
      `);
      
      console.log('✅ Hospitals table created successfully');
    } else {
      console.log('✅ Hospitals table exists');
    }
    
    connection.release();
    console.log('Database setup complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

testDatabase();