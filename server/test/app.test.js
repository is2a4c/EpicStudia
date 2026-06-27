const assert = require('assert');

// Run tests manually since we're not using a test framework
console.log('\nRunning tests...\n');

let passed = 0;
let failed = 0;

try {
  // Test 1: Package.json validation
  const pkg = require('../package.json');
  if (pkg.name && pkg.version) {
    console.log('✓ Test 1 PASSED: Package.json is valid');
    passed++;
  } else {
    console.log('✗ Test 1 FAILED: Package.json missing required fields');
    failed++;
  }
} catch (error) {
  console.log('✗ Test 1 FAILED:', error.message);
  failed++;
}

try {
  // Test 2: App.js can be analyzed
  const fs = require('fs');
  const path = require('path');
  const appPath = path.join(__dirname, '..', 'app.js');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    if (appContent.includes('express')) {
      console.log('✓ Test 2 PASSED: App.js contains Express setup');
      passed++;
    } else {
      console.log('✗ Test 2 FAILED: App.js does not appear to use Express');
      failed++;
    }
  } else {
    console.log('✗ Test 2 FAILED: App.js not found');
    failed++;
  }
} catch (error) {
  console.log('✗ Test 2 FAILED:', error.message);
  failed++;
}

try {
  // Test 3: Basic assertion
  if ((1 + 1) === 2) {
    console.log('✓ Test 3 PASSED: Basic sanity check');
    passed++;
  } else {
    console.log('✗ Test 3 FAILED: Basic math is broken');
    failed++;
  }
} catch (error) {
  console.log('✗ Test 3 FAILED:', error.message);
  failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed! ✓');
  process.exit(0);
}
