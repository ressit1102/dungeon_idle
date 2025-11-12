// modules/itemUpgradeHelpers.js

// Item upgrade configuration (shared and testable)
export const ITEM_UPGRADE_MAX_LEVEL = 5;
export const ITEM_UPGRADE_MULTIPLIER_PER_LEVEL = 0.20; // +20% per upgrade level

export function calculateItemUpgradeCost(item) {
    const atk = Number(item.stats?.attack || 0);
    const def = Number(item.stats?.defense || 0);
    const hp = Number(item.stats?.maxHP || 0);
    const base = Math.max(1, Math.round((atk + def + hp / 5)));
    const currentLevel = Number(item.upgradeLevel || 0);
    return Math.max(10, Math.floor(base * 20 * Math.pow(1.6, currentLevel)));
}

export function applyItemUpgrade(item) {
    if (!item.baseStats) item.baseStats = JSON.parse(JSON.stringify(item.stats || {}));
    const lvl = Number(item.upgradeLevel || 0) + 1;
    const newStats = JSON.parse(JSON.stringify(item.baseStats));
    const mult = 1 + ITEM_UPGRADE_MULTIPLIER_PER_LEVEL * lvl;
    for (const k of Object.keys(newStats)) {
        if (typeof newStats[k] === 'number') {
            if (k.toLowerCase().includes('chance') || k.toLowerCase().includes('speed') || k.toLowerCase().includes('mult')) {
                newStats[k] = Number((newStats[k] * mult).toFixed(3));
            } else {
                newStats[k] = Math.round(newStats[k] * mult);
            }
        }
    }
    item.stats = newStats;
    item.upgradeLevel = lvl;
    if (item.sellValue) item.sellValue = Math.round(item.sellValue * (1 + 0.25 * lvl));
}
