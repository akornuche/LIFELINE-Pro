import database from './src/database/connection.js';

async function checkUsers() {
  try {
    await database.connect();
    const result = await database.query('SELECT COUNT(*) as count FROM users');
    console.log('Users in database:', result.rows[0].count);

    if (result.rows[0].count > 0) {
      const users = await database.query('SELECT email, role FROM users LIMIT 5');
      console.log('Sample users:');
      users.rows.forEach(user => console.log(`- ${user.email} (${user.role})`));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await database.disconnect();
  }
}

checkUsers();