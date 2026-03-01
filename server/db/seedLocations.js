/**
 * Seed Location communities. Locations are created and moderated by developers.
 * Run after init-db: npm run seed-locations
 * Ensure COMUNITREE database and warehouse exist in Snowflake first.
 */
import 'dotenv/config';
import { query, execute } from '../config/snowflake.js';

const LOCATIONS = [
  { name: 'Austin', slug: 'austin', description: 'Austin metropolitan area' },
  { name: 'San Francisco', slug: 'san-francisco', description: 'San Francisco Bay Area' },
  { name: 'New York', slug: 'new-york', description: 'New York City metropolitan area' },
];

async function seed() {
  try {
    for (const loc of LOCATIONS) {
      const existing = await query('SELECT id FROM communities WHERE slug = ? AND type = ?', [
        loc.slug,
        'LOCATION',
      ]);
      if (existing.length > 0) {
        console.log(`Location "${loc.name}" (${loc.slug}) already exists, skipping.`);
        continue;
      }
      await execute(
        'INSERT INTO communities (name, slug, type, description) VALUES (?, ?, ?, ?)',
        [loc.name, loc.slug, 'LOCATION', loc.description || null]
      );
      console.log(`Created Location: ${loc.name} (${loc.slug}).`);
    }
    console.log('Seed locations done.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

seed();
