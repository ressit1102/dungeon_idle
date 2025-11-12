import assert from 'assert';
import { calculateItemUpgradeCost, applyItemUpgrade, ITEM_UPGRADE_MAX_LEVEL } from '../../modules/itemUpgradeHelpers.js';

function run() {
    console.log('Running test_inventory_upgrades...');

    const item = {
        stats: { attack: 10, defense: 5, maxHP: 50, critChance: 0.05 },
        sellValue: 100
    };

    const cost1 = calculateItemUpgradeCost(item);
    applyItemUpgrade(item);
    assert.strictEqual(item.upgradeLevel, 1, 'upgradeLevel should be 1 after one upgrade');
    assert(item.stats.attack > 10, 'attack should increase after upgrade');

    // Upgrade up to max and ensure no exceptions
    for (let i = 1; i < ITEM_UPGRADE_MAX_LEVEL; i++) {
        applyItemUpgrade(item);
    }
    assert(item.upgradeLevel === ITEM_UPGRADE_MAX_LEVEL, 'upgradeLevel should reach max level');

    console.log('test_inventory_upgrades passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) run();

export default run;
