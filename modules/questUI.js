// modules/questUI.js

import { activeQuests } from './quest.js'; // Import danh sách nhiệm vụ đang hoạt động
import { logger } from './game.js'; // ✅ IMPORT logger đã được export

export function renderQuests() {
    const questListDiv = document.getElementById('quest-list'); // Giả định ID của container Nhiệm vụ
    if (!questListDiv) return;

    if (activeQuests.length === 0) {
        questListDiv.innerHTML = '<i class="text-gray-500">Không có nhiệm vụ nào đang hoạt động.</i>';
        return;
    }

    let questHTML = '';
    activeQuests.forEach(quest => {
        const progressPercent = Math.min(100, (quest.progress / quest.goalAmount) * 100);
        const statusClass = quest.completed ? 'text-green-400' : 'text-yellow-400';
        const completionText = quest.completed ? 'HOÀN THÀNH' : `${quest.progress}/${quest.goalAmount}`;

		questHTML += `
            <div class="quest-item p-2 border-b border-gray-700 ${quest.completed ? 'bg-green-900/20' : ''}">
                <p class="font-bold ${statusClass}">${quest.name}</p>
                <p class="text-sm text-gray-400">${quest.description}</p>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-xs ${statusClass}">${completionText}</span>
                    <div class="w-2/3 bg-gray-600 rounded-full h-1.5">
                        <div class="bg-blue-400 h-1.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <p class="text-xs text-gray-700 font-semibold mb-2">
                    Phần thưởng: ${quest.rewardGold}💰, ${quest.rewardXP} EXP
                </p>
                
                ${quest.completed ? 
                // ✨ FIX: Đổi từ 'claimReward' thành 'claimQuestReward' 
                `<button onclick="claimQuestReward('${quest.id}')" class="mt-2 text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-white font-bold">Nhận Thưởng!</button>` 
                : ''}
            </div>
        `;
    });

    questListDiv.innerHTML = questHTML;
}