// Simple script to run the seed.ts file
const { exec } = require('child_process');

console.log('Running database seed script...');
exec('npx tsx server/seed.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});