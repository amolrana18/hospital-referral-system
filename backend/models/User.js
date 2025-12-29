const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(userId) {
    const [rows] = await pool.execute(
      'SELECT user_id, email, first_name, last_name, user_role, is_active, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      user_role,
      date_of_birth,
      gender
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users 
       (email, password_hash, phone, first_name, last_name, date_of_birth, gender, user_role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email, 
        hashedPassword, 
        phone || null, 
        first_name, 
        last_name, 
        date_of_birth || null, 
        gender || null, 
        user_role
      ]
    );

    return result.insertId;
  }

  static async update(userId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  static async comparePassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
}

module.exports = User;