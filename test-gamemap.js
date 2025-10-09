// Simple test to check class loading
console.log('Testing GameMap.js loading...');

// Check if ZeldaGameMap class is defined
if (typeof ZeldaGameMap !== 'undefined') {
    console.log('✅ ZeldaGameMap class is properly defined');
} else {
    console.log('❌ ZeldaGameMap class is not defined - there may be syntax errors');
}

// Test basic instantiation
try {
    const testMap = new ZeldaGameMap(null, 'main');
    console.log('✅ ZeldaGameMap can be instantiated');
} catch (error) {
    console.log('❌ Error creating ZeldaGameMap:', error.message);
}