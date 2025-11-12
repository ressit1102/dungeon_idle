// data/upgrades.js

export const upgradeList = {
    'hp': {
        name: 'HP Tối Đa',
        stat: 'maxHP',
        baseCost: 100,
        costScaling: 1.5, // Chi phí tăng 50% sau mỗi cấp
        baseValue: 10, // Tăng 10 HP mỗi cấp
        currentLevel: 0
    },
    'attack': {
        name: 'Sức Tấn Công',
        stat: 'attack',
        baseCost: 150,
        costScaling: 1.6,
        baseValue: 5, // Tăng 5 ATK mỗi cấp
        currentLevel: 0
    },
    'defense': {
        name: 'Phòng Thủ',
        stat: 'defense',
        baseCost: 120,
        costScaling: 1.4,
        baseValue: 3, // Tăng 3 DEF mỗi cấp
        currentLevel: 0
    }
    ,
    'str': {
        name: 'Sức Mạnh (STR)',
        stat: 'str',
        baseCost: 200,
        costScaling: 1.5,
        baseValue: 1, // +1 STR mỗi cấp (tăng damage/crit scaler)
        currentLevel: 0
    },
    'dex': {
        name: 'Nhanh Nhẹn (DEX)',
        stat: 'dex',
        baseCost: 180,
        costScaling: 1.45,
        baseValue: 1, // +1 DEX mỗi cấp (tăng attack speed)
        currentLevel: 0
    },
    'int': {
        name: 'Trí Tuệ (INT)',
        stat: 'int',
        baseCost: 160,
        costScaling: 1.4,
        baseValue: 1, // +1 INT mỗi cấp (dự phòng cho skill/magic)
        currentLevel: 0
    },
    'lux': {
        name: 'May Mắn (LUX)',
        stat: 'lux',
        baseCost: 220,
        costScaling: 1.6,
        baseValue: 1, // +1 LUX mỗi cấp (tăng crit chance / rare interactions)
        currentLevel: 0
    }
};

// Hàm tính chi phí cấp tiếp theo
export function calculateUpgradeCost(upgrade) {
    return Math.floor(upgrade.baseCost * (upgrade.costScaling ** upgrade.currentLevel));
}

// Hàm tính giá trị cộng thêm ở cấp tiếp theo
export function calculateUpgradeValue(upgrade) {
    return upgrade.baseValue; // Giữ đơn giản: giá trị cộng thêm không đổi theo cấp
}