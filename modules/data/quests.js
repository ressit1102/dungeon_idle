/**
 * 📜 Danh sách tất cả nhiệm vụ trong game
 * (Các nhiệm vụ này là mẫu — không lưu tiến trình hiện tại)
 */
export const questList = {
    // === GIAI ĐOẠN 1: Tân thủ ===
    'slay_10_mobs': {
        id: 'slay_10_mobs',
        name: 'Dọn dẹp Cơ bản',
        description: 'Đánh bại 10 quái vật bất kỳ để làm quen với hệ thống chiến đấu.',
        goalType: 'enemiesDefeated',
        goalAmount: 10,
        rewardGold: 500,
        rewardXP: 100,
        isAvailable: true,
        unlockQuest: 'earn_1k_gold',
    },

    'earn_1k_gold': {
        id: 'earn_1k_gold',
        name: 'Túi tiền rủng rỉnh',
        description: 'Kiếm được tổng cộng 1,000 Vàng từ mọi nguồn.',
        goalType: 'totalGoldEarned',
        goalAmount: 1000,
        rewardGold: 1000,
        rewardXP: 200,
        isAvailable: false,
        unlockQuest: 'reach_level_5',
    },

    'reach_level_5': {
        id: 'reach_level_5',
        name: 'Khởi đầu Vĩ đại',
        description: 'Đạt cấp độ Anh hùng 5.',
        goalType: 'heroLevel',
        goalAmount: 5,
        rewardGold: 2000,
        rewardXP: 500,
        isAvailable: true,
        unlockQuest: 'clear_forest_boss',
    },

    'clear_forest_boss': {
        id: 'clear_forest_boss',
        name: 'Thợ săn Boss: Rừng Thanh Tĩnh',
        description: 'Đánh bại Boss cuối trong Rừng Thanh Tĩnh.',
        goalType: 'dungeonClear',
        goalDungeon: 'Forest Clearing',
        goalAmount: 1,
        rewardGold: 3500,
        rewardXP: 1000,
        isAvailable: false,
        unlockQuest: 'slay_50_mobs',
    },

    // === GIAI ĐOẠN 2: Chiến binh Lành nghề ===
    'slay_50_mobs': {
        id: 'slay_50_mobs',
        name: 'Kẻ hủy diệt nhỏ bé',
        description: 'Tiêu diệt tổng cộng 50 quái vật.',
        goalType: 'enemiesDefeated',
        goalAmount: 50,
        rewardGold: 2500,
        rewardXP: 800,
        isAvailable: false,
        unlockQuest: 'earn_10k_gold',
    },

    'earn_10k_gold': {
        id: 'earn_10k_gold',
        name: 'Nhà buôn nhỏ',
        description: 'Tích lũy được 10,000 vàng.',
        goalType: 'totalGoldEarned',
        goalAmount: 10000,
        rewardGold: 3000,
        rewardXP: 1200,
        isAvailable: false,
        unlockQuest: 'reach_level_10',
    },

    'reach_level_10': {
        id: 'reach_level_10',
        name: 'Anh hùng thực thụ',
        description: 'Đạt cấp độ Anh hùng 10.',
        goalType: 'heroLevel',
        goalAmount: 10,
        rewardGold: 4000,
        rewardXP: 2000,
        isAvailable: false,
        unlockQuest: 'clear_cave_boss',
    },

    'clear_cave_boss': {
        id: 'clear_cave_boss',
        name: 'Bóng tối trong hang động',
        description: 'Đánh bại Boss trong khu vực Hang Sâu (Dark Cave).',
        goalType: 'dungeonClear',
        goalDungeon: 'Dark Cave',
        goalAmount: 1,
        rewardGold: 5000,
        rewardXP: 2500,
        isAvailable: false,
        unlockQuest: 'upgrade_attack_10',
    },

    // === GIAI ĐOẠN 3: Nâng cấp bản thân ===
    'upgrade_attack_10': {
        id: 'upgrade_attack_10',
        name: 'Sức mạnh đầu tiên',
        description: 'Nâng cấp chỉ số Tấn công lên ít nhất 10 lần.',
        goalType: 'upgradeStat',
        goalTarget: 'attack',
        goalAmount: 10,
        rewardGold: 3000,
        rewardXP: 1500,
        isAvailable: false,
        unlockQuest: 'upgrade_defense_10',
    },

    'upgrade_defense_10': {
        id: 'upgrade_defense_10',
        name: 'Khiên kiên cố',
        description: 'Nâng cấp chỉ số Phòng thủ lên 10 lần.',
        goalType: 'upgradeStat',
        goalTarget: 'defense',
        goalAmount: 10,
        rewardGold: 3000,
        rewardXP: 1500,
        isAvailable: false,
        unlockQuest: 'reach_level_15',
    },

    'reach_level_15': {
        id: 'reach_level_15',
        name: 'Chiến binh dày dạn',
        description: 'Đạt cấp độ 15.',
        goalType: 'heroLevel',
        goalAmount: 15,
        rewardGold: 6000,
        rewardXP: 3000,
        isAvailable: false,
        unlockQuest: 'clear_desert_boss',
    },

    'clear_desert_boss': {
        id: 'clear_desert_boss',
        name: 'Hoàng mạc khắc nghiệt',
        description: 'Đánh bại Boss cuối trong Sa mạc Lửa (Blazing Desert).',
        goalType: 'dungeonClear',
        goalDungeon: 'Blazing Desert',
        goalAmount: 1,
        rewardGold: 8000,
        rewardXP: 4000,
        isAvailable: false,
        unlockQuest: 'collect_rare_gear',
    },

    // === GIAI ĐOẠN 4: Thợ săn báu vật ===
    'collect_rare_gear': {
        id: 'collect_rare_gear',
        name: 'Săn đồ hiếm',
        description: 'Thu thập ít nhất 5 vật phẩm hiếm (Rare hoặc cao hơn).',
        goalType: 'rareItemsCollected',
        goalAmount: 5,
        rewardGold: 8000,
        rewardXP: 3500,
        isAvailable: false,
        unlockQuest: 'sell_20_items',
    },

    'sell_20_items': {
        id: 'sell_20_items',
        name: 'Nhà buôn dày dạn',
        description: 'Bán 20 vật phẩm bất kỳ.',
        goalType: 'itemsSold',
        goalAmount: 20,
        rewardGold: 6000,
        rewardXP: 2500,
        isAvailable: false,
        unlockQuest: 'reach_level_20',
    },

    'reach_level_20': {
        id: 'reach_level_20',
        name: 'Chiến binh kỳ cựu',
        description: 'Đạt cấp độ 20.',
        goalType: 'heroLevel',
        goalAmount: 20,
        rewardGold: 10000,
        rewardXP: 6000,
        isAvailable: false,
        unlockQuest: 'clear_ice_boss',
    },

    'clear_ice_boss': {
        id: 'clear_ice_boss',
        name: 'Băng giá vĩnh hằng',
        description: 'Đánh bại Boss cuối trong Vùng Băng Cổ Đại (Frozen Tundra).',
        goalType: 'dungeonClear',
        goalDungeon: 'Frozen Tundra',
        goalAmount: 1,
        rewardGold: 12000,
        rewardXP: 8000,
        isAvailable: false,
        unlockQuest: 'slay_200_mobs',
    },

    // === GIAI ĐOẠN 5: Anh hùng huyền thoại ===
    'slay_200_mobs': {
        id: 'slay_200_mobs',
        name: 'Thợ săn huyền thoại',
        description: 'Tiêu diệt tổng cộng 200 quái vật.',
        goalType: 'enemiesDefeated',
        goalAmount: 200,
        rewardGold: 15000,
        rewardXP: 10000,
        isAvailable: false,
        unlockQuest: 'earn_100k_gold',
    },

    'earn_100k_gold': {
        id: 'earn_100k_gold',
        name: 'Đại phú ông',
        description: 'Kiếm được 100,000 vàng.',
        goalType: 'totalGoldEarned',
        goalAmount: 100000,
        rewardGold: 20000,
        rewardXP: 12000,
        isAvailable: false,
        unlockQuest: 'reach_level_30',
    },

    'reach_level_30': {
        id: 'reach_level_30',
        name: 'Bậc thầy chiến đấu',
        description: 'Đạt cấp độ 30.',
        goalType: 'heroLevel',
        goalAmount: 30,
        rewardGold: 25000,
        rewardXP: 20000,
        isAvailable: false,
        unlockQuest: 'clear_final_boss',
    },

    'clear_final_boss': {
        id: 'clear_final_boss',
        name: 'Huyền thoại được viết nên',
        description: 'Đánh bại Boss cuối cùng trong Dungeon Tối Thượng (Abyss Core).',
        goalType: 'dungeonClear',
        goalDungeon: 'Abyss Core',
        goalAmount: 1,
        rewardGold: 50000,
        rewardXP: 50000,
        isAvailable: false,
    },
        'UPGRADE_ATTACK_1': {
            id: 'UPGRADE_ATTACK_1',
            name: 'Tăng cường Sức mạnh',
            description: 'Nâng cấp chỉ số Tấn công (Attack) 5 lần.',
            goalType: 'upgradeStat',
            goalTarget: 'attack', // ✨ Cần khớp với statKey trong hero.js
            goalAmount: 5,
            rewardGold: 100,
            rewardXP: 50,
            isAvailable: true,
        },
        'UPGRADE_DEFENSE_1': {
            id: 'UPGRADE_DEFENSE_1',
            name: 'Bức tường Thép',
            description: 'Nâng cấp chỉ số Phòng thủ (Defense) 3 lần.',
            goalType: 'upgradeStat',
            goalTarget: 'defense', // ✨ Cần khớp với statKey trong hero.js
            goalAmount: 3,
            rewardGold: 50,
            rewardXP: 30,
            isAvailable: true,
        },
};

export const initialActiveQuests = [
    { ...questList['slay_10_mobs'], progress: 0, completed: false }, // ✨ FIX: Phải lấy cả object nếu muốn sửa đổi (progress, completed)
    { ...questList['reach_level_5'], progress: 0, completed: false }, // ✨ FIX: Phải lấy cả object nếu muốn sửa đổi
    { ...questList['UPGRADE_ATTACK_1'], progress: 0, completed: false }, 
];