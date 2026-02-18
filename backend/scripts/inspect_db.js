const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'data', 'process_management.db');
const db = new Database(dbPath);

const query = process.argv[2];

if (query) {
  try {
    console.log(`\n--- Running Query: "${query}" ---`);
    const stmt = db.prepare(query);
    const rows = stmt.all();
    console.table(rows);
  } catch (error) {
    console.error('Error executing query:', error.message);
  }
} else {
  // Default behavior
  function inspectTable(tableName) {
    try {
      console.log(`\n--- Inspecting table: ${tableName} ---`);
      const stmt = db.prepare(`SELECT * FROM ${tableName}`);
      const rows = stmt.all();
      if (rows.length === 0) {
        console.log(`Table '${tableName}' is empty.`);
      } else {
        console.table(rows);
      }
    } catch (error) {
      console.error(`Error inspecting table ${tableName}:`, error.message);
    }
  }

  console.log('--- Starting Database Inspection ---');
  inspectTable('equipment');
  inspectTable('human_resources');
  inspectTable('expense_categories');
  console.log('--- Database Inspection Complete ---');
}

db.close();
