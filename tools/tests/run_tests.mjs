import testInventory from './test_inventory_upgrades.js';
import testSave from './test_save_roundtrip.js';

async function runAll() {
    try {
        await testInventory();
        await testSave();
        console.log('\nAll tests passed.');
        process.exit(0);
    } catch (e) {
        console.error('\nTest failed:', e);
        process.exit(2);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) runAll();
