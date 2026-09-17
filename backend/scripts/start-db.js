const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
const path = require('path');
const fs = require('fs');

async function startDb() {
  const dbPath = path.join(__dirname, '../.pgdata');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbPath,
    port: 5433,
    user: 'postgres',
    password: 'postgresPassword',
    persistent: true,
  });

  try {
    console.log('Initializing embedded PostgreSQL database on port 5433...');
    try {
      await pg.initialise();
    } catch (e) {
      console.log('Database directory already initialized, skipping initdb.');
    }
    console.log('Starting PostgreSQL server on port 5433...');
    await pg.start();
    console.log('Creating database "erp_db"...');
    try {
      await pg.createDatabase('erp_db');
    } catch (e) {
      console.log('Database erp_db already exists or created:', e.message);
    }
    console.log('PostgreSQL is running successfully on port 5433!');
  } catch (error) {
    if (error && error.message && error.message.includes('already running')) {
      console.log('PostgreSQL is already running on port 5433.');
    } else {
      console.error('Failed to start embedded PostgreSQL:', error);
    }
  }
}

startDb();

