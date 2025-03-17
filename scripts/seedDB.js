/**
 * Script to seed default data into the database
 */

// Import required modules
const { execFile } = require('child_process');
const path = require('path');

// Check command line arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

console.log('Starting database seeding process...');

// On Windows, we need to use the npm script directly
if (shouldReset) {
  console.log('Running seed:reset:direct script...');
  execFile('npm.cmd', ['run', 'seed:reset:direct'], { shell: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during execution: ${error.message}`);
      console.error(stderr);
      process.exit(1);
    }
    
    console.log(stdout);
    console.log('Seeding process completed!');
    process.exit(0);
  });
} else {
  console.log('Running seed:direct script...');
  execFile('npm.cmd', ['run', 'seed:direct'], { shell: true }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during execution: ${error.message}`);
      console.error(stderr);
      process.exit(1);
    }
    
    console.log(stdout);
    console.log('Seeding process completed!');
    process.exit(0);
  });
} 