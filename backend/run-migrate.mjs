/**
 * One-shot migration runner — used for production deployments.
 * Bypasses the import.meta.url CLI guard that fails on Windows paths.
 * DELETE THIS FILE after deployment is complete.
 */
import database from './src/database/connection.js';
import MigrationManager from './src/database/migrate.js';
import DatabaseInitializer from './src/database/init.js';

console.log('[migrate] Connecting to database...');
await database.connect();

console.log('[migrate] Running DatabaseInitializer (schemas + migrations)...');
const init = new DatabaseInitializer();
await init.initialize();

console.log('[migrate] Done. Disconnecting...');
await database.disconnect();
console.log('[migrate] ✅ All migrations complete.');
