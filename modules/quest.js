// modules/quest.js 
import { logMessage, hero, totalGoldEarned, totalEnemiesKilled } from './game.js'; 
import { initialActiveQuests, questList } from './data/quests.js';
// KHÔNG IMPORT renderQuests. SỬ DỤNG window.updateUI() thay thế.
 
export let activeQuests = []; 

/**
 * Khởi tạo danh sách nhiệm vụ ban đầu khi bắt đầu game mới.
 */
export function initQuests() {
    activeQuests = initialActiveQuests.map(q => ({...q, progress: 0, completed: false})); 
    // Không cần gọi updateUI/renderQuests ở đây, initGame sẽ gọi nó.
}

// ------------------------------------------------
// LOGIC 1: KIỂM TRA VÀ CẬP NHẬT TIẾN TRÌNH
// ------------------------------------------------

/**
 * Kiểm tra và cập nhật tiến trình của tất cả nhiệm vụ đang hoạt động.
 * @param {string} goalType - Loại mục tiêu (ví dụ: 'enemiesDefeated', 'upgradeStat').
 * @param @param {* | null} [currentValue] - Giá trị hiện tại (ví dụ: hero.level, totalGoldEarned) HOẶC dữ liệu phụ (statKey, dungeonId).
 */
export function checkQuestProgress(goalType, currentValue = null) {
    let uiNeedsUpdate = false;
    
    activeQuests.forEach(quest => {
        if (quest.completed) return;
        
        if (quest.goalType === goalType) {
            
            let finalProgressValue = quest.progress; // Mặc định là giữ nguyên
            let shouldIncrement = false; // Cần tăng tiến trình?

            switch (quest.goalType) {
                // Nhiệm vụ theo số lần hành động (Cần TĂNG tiến trình)
                case 'upgradeStat':
                    // Kiểm tra mục tiêu phụ: goalTarget phải khớp với currentValue (statKey)
                    if (quest.goalTarget === currentValue) {
                        shouldIncrement = true;
                    }
                    break;
                case 'dungeonClear':
                    // Kiểm tra mục tiêu phụ: goalDungeon phải khớp với currentValue (dungeonId)
                    if (quest.goalDungeon === currentValue) {
                         shouldIncrement = true;
                    }
                    break;

                // Nhiệm vụ theo giá trị tích lũy (Sử dụng currentValue làm giá trị tiến trình MỚI)
                case 'enemiesDefeated':
                    finalProgressValue = totalEnemiesKilled;
                    break;
                case 'totalGoldEarned':
                    finalProgressValue = totalGoldEarned;
                    break;
                case 'heroLevel':
                    finalProgressValue = hero.baseStats.level; // ✨ FIX: Dùng hero.baseStats.level
                    break;
                default:
                    return; // Bỏ qua nếu không khớp loại mục tiêu
            }
            
            // Cập nhật tiến trình
            if (shouldIncrement) {
                quest.progress++;
                uiNeedsUpdate = true;
            } else if (finalProgressValue !== quest.progress) {
                 quest.progress = finalProgressValue;
                 uiNeedsUpdate = true;
            }
            
            // Kiểm tra hoàn thành
            if (quest.progress >= quest.goalAmount && !quest.completed) {
                quest.completed = true;
                logMessage(`✅ Nhiệm vụ **${quest.name}** đã **HOÀN THÀNH**! Nhận thưởng trong tab Nhiệm vụ.`, 'success');
                uiNeedsUpdate = true;
                
                // Mở khóa nhiệm vụ tiếp theo (nếu có)
                if (quest.unlockQuest) {
                    activateQuest(quest.unlockQuest);
                }
            }
        }
    });

    // SỬ DỤNG HÀM CẬP NHẬT TOÀN CỤC CỦA WINDOW
    if (uiNeedsUpdate && window.updateUI) { 
        window.updateUI(); 
    }
}

// ------------------------------------------------
// LOGIC 2: NHẬN THƯỞNG (GÁN TRỰC TIẾP VÀO WINDOW)
// ------------------------------------------------

/**
 * Xử lý việc nhận thưởng từ nhiệm vụ đã hoàn thành.
 * Hàm này được gọi từ UI (questUI.js/menu.js).
 * @param {string} questId - ID của nhiệm vụ.
 */
window.claimQuestReward = function(questId) { 
    // Tìm nhiệm vụ trong danh sách đang hoạt động
    const index = activeQuests.findIndex(q => q.id === questId);
    const currentQuest = activeQuests[index];

    if (!currentQuest || !currentQuest.completed) {
        logMessage("⚠️ Nhiệm vụ chưa hoàn thành hoặc không tồn tại.", 'warn');
        return;
    }

    // 1. Áp dụng phần thưởng (Vàng & XP)
    // Sử dụng rewardGold và rewardXP từ đối tượng quest
    const gold = currentQuest.rewardGold || 0;
    const xp = currentQuest.rewardXP || 0;

    hero.baseStats.gold += gold;
    const leveledUp = hero.gainXP(xp); 

    logMessage(`🎁 Đã nhận thưởng từ **${currentQuest.name}**: <span class="text-yellow-400">${gold} Vàng</span> và <span class="text-purple-400">${xp} XP</span>.`);
    if (leveledUp) {
        logMessage(`🎉 **CẤP ĐỘ MỚI!** Anh hùng đã đạt Cấp độ ${hero.baseStats.level}!`, 'success');
    }
    
    // 2. Xóa khỏi danh sách nhiệm vụ hoạt động
    activeQuests.splice(index, 1);
    
    // 3. Cập nhật UI và chỉ số Anh hùng
    hero.calculateStats();
    // SỬ DỤNG HÀM CẬP NHẬT TOÀN CỤC CỦA WINDOW
    if (window.updateUI) { 
        window.updateUI(); 
    }
};

/**
 * Thêm một nhiệm vụ mới vào danh sách hoạt động.
 * @param {string} questId - ID của nhiệm vụ cần kích hoạt.
 */
export function activateQuest(questId) {
    const newQuestTemplate = questList[questId];
    
    // Kiểm tra trùng lặp
    if (newQuestTemplate && !activeQuests.some(q => q.id === questId)) {
        // Tạo bản sao và đặt lại trạng thái
        const newQuest = { 
            ...newQuestTemplate, 
            completed: false, 
            progress: 0 
        }; 
        activeQuests.push(newQuest);
        logMessage(`📜 **Nhiệm vụ mới** được kích hoạt: **${newQuest.name}**!`, 'info');
        
        // SỬ DỤNG HÀM CẬP NHẬT TOÀN CỤC CỦA WINDOW
        if (window.updateUI) { 
            window.updateUI(); 
        }
    }
}

/**
 * Áp dụng trạng thái nhiệm vụ đã lưu từ dữ liệu tải game.
 * @param {object} questState - Trạng thái nhiệm vụ đã tải từ save.
 * @returns {object} Các biến theo dõi đã được cập nhật.
 */
export function applyQuestState(questState) {
    // 1. Ghi đè danh sách nhiệm vụ đang hoạt động
    activeQuests = questState.activeQuests || [];
    
    // 2. Trả về các biến theo dõi để game.js cập nhật
    return {
        totalGoldEarned: questState.totalGoldEarned || 0,
        totalEnemiesKilled: questState.totalEnemiesKilled || 0
    };
}
