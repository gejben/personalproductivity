/**
 * Command-line interface for seeding default categories
 */

import { seedDefaultCategories, resetDefaultCategories } from './seedDefaultCategories';

// Handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');
  const shouldSeed = args.includes('--seed') || !shouldReset; // Default to seed if no reset flag
  
  try {
    if (shouldReset) {
      console.log('Running resetDefaultCategories...');
      await resetDefaultCategories();
      console.log('Reset completed successfully.');
    } else if (shouldSeed) {
      console.log('Running seedDefaultCategories...');
      await seedDefaultCategories();
      console.log('Seeding completed successfully.');
    } else {
      console.log('No action specified. Use --seed or --reset.');
    }
  } catch (error) {
    console.error('Error during execution:');
    if (error instanceof Error) {
      console.error(`- Message: ${error.message}`);
      console.error(`- Stack: ${error.stack}`);
    } else {
      console.error(`- Details: ${JSON.stringify(error)}`);
    }
    
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure your Firebase config is correct in src/firebase/config.ts');
    console.error('2. Check that you have proper permissions in your Firebase project');
    console.error('3. Verify your Firestore security rules allow writing to defaultCategories collection');
    console.error('4. Make sure you\'re connected to the internet');
    
    process.exit(1);
  }
  
  // Clean exit
  process.exit(0);
}

// Run the script
main(); 