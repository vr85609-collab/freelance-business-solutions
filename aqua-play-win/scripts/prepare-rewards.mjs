// Run only when the operator explicitly enables database initialization in Render.
if (process.env.ARCADE_MIGRATE_ON_START === 'true') {
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required for rewards initialization');
  await import('./migrate.mjs');
  await import('./cleanup.mjs');
} else {
  console.log('Rewards database initialization is disabled. Practice games remain available.');
}
