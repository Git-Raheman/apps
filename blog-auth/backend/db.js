const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initDb = async () => {
  let client;
  let connected = false;
  let retries = 5;

  while (retries > 0 && !connected) {
    try {
      client = await pool.connect();
      connected = true;
    } catch (err) {
      console.log(`Database not ready, retrying... (${retries} attempts left)`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  if (!connected) {
    console.error('Could not connect to database after multiple retries');
    process.exit(1);
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  initDb
};
