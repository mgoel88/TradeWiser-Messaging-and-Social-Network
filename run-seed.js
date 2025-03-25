import { execSync } from 'child_process';

console.log('Building the TypeScript seed file...');
try {
  execSync('npx tsx server/seed.ts', { stdio: 'inherit' });
  console.log('Seed completed successfully!');
} catch (error) {
  console.error('Error running seed:', error);
  process.exit(1);
}