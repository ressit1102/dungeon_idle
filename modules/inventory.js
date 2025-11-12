// modules/inventory.js

// Đảm bảo import hero, logger từ game.js
import { hero, logger } from './game.js'; 
import { RARITIES } from './data/items.js'; // Import RARITIES để lấy màu sắc
import { calculateItemUpgradeCost, applyItemUpgrade, ITEM_UPGRADE_MAX_LEVEL } from './itemUpgradeHelpers.js';

const logMessage = (msg, type = 'info') => logger.log(msg, type); 

// =======================================================
// CÁC HANDLER ĐƯỢC EXPORT (Theo yêu cầu của bạn)
// =======================================================

/**
 * Xử lý sự kiện khi nút Mặc/Bỏ Mặc được nhấn.
 * @param {number} index - Chỉ mục của vật phẩm trong hero.inventory.
 */
export function handleEquipItem(index) {
    const itemToEquip = hero.inventory[index]; 
    
    if (!itemToEquip) {
        logMessage(`⚠️ Lỗi: Không tìm thấy vật phẩm ở chỉ mục ${index}.`);
        return;
    }

    if (itemToEquip.type === 'Consumable' || !itemToEquip.slot) {
        logMessage(`⚠️ **${itemToEquip.name || itemToEquip.id}** không phải là trang bị.`, 'warn');
        return;
    }
    
    // Kiểm tra xem đã trang bị chưa
    if (hero.isEquipped(itemToEquip)) { // ✨ CẦN isEquipped trong hero.js
        // Nếu đã trang bị, Bỏ Mặc (Unequip)
        const item = hero.unequipItem(itemToEquip.slot); // Giả định unequipItem trong hero.js
        logMessage(`👚 Bỏ trang bị **${item.name || item.id}** khỏi slot ${item.slot}.`);
    } else {
        // Nếu chưa trang bị, Trang bị (Equip)
        const oldItem = hero.equipItem(itemToEquip);
        logMessage(`🛡️ Trang bị **${itemToEquip.name || itemToEquip.id}** vào slot ${itemToEquip.slot}.`);
        if (oldItem) {
            logMessage(` > Vật phẩm cũ **${oldItem.name || oldItem.id}** đã chuyển vào Kho đồ.`);
        }
    }

    hero.calculateStats();
    window.updateUI(); 
    window.saveGame();
}


/**
 * Xử lý sự kiện khi nút Bán được nhấn.
 * @param {number} index - Chỉ mục của vật phẩm trong hero.inventory.
 */
export function handleSellItem(index) {
    const result = hero.sellItem(index); // Trả về { gold, item }
    
    if (result.gold > 0) {
        const itemName = result.item.name || result.item.id;
        logMessage(`💰 Đã bán **${itemName}** với giá <span class="text-yellow-500">${result.gold} Vàng</span>.`);
        hero.calculateStats(); // Cập nhật chỉ số (để cập nhật vàng hiển thị)
        window.updateUI();
        window.saveGame();
    } else {
        logMessage(`⚠️ Lỗi khi bán vật phẩm ở chỉ mục ${index}.`);
    }
}

/**
 * Xử lý sự kiện khi nút Sử dụng (Consumable) được nhấn.
 * ✨ HÀM MỚI CHO POTION
 * @param {number} index - Chỉ mục của vật phẩm trong hero.inventory.
 */
export function handleUseItem(index) { 
    const itemToUse = hero.inventory[index];
    
    if (itemToUse && itemToUse.type === 'Consumable') {
        // Hàm useItem nằm trong hero.js (Bước 2)
        if (hero.useItem(index)) { 
            // Việc sử dụng item thành công đã được log trong hero.js
            window.updateUI(); 
            window.saveGame();
        } else {
            // Log lỗi nếu useItem trả về false (ví dụ: HP đã đầy)
            logMessage(`⚠️ Không thể sử dụng ${itemToUse.name} lúc này.`, 'warn');
        }
    } else {
        logMessage(`⚠️ Lỗi: Không thể sử dụng vật phẩm ở chỉ mục ${index}.`);
    }
}


// =======================================================
// HÀM RENDER (Đã sửa bố cục)
// =======================================================

export function renderInventory() {
    const inventoryDiv = document.getElementById('hero-inventory');
    if (!inventoryDiv) return;
    
    // Clear nội dung cũ
    inventoryDiv.innerHTML = ''; 

    if (hero.inventory.length === 0) {
        inventoryDiv.innerHTML = `<p class="text-gray-400 text-center italic">Kho đồ trống.</p>`;
        return;
    }

   // Hiển thị danh sách vật phẩm và nút Bán, Mặc / Sử dụng
   hero.inventory.forEach((item, index) => {
        const sellPrice = item.sellValue || 0; 
        const isEquipable = item.slot && item.type !== 'Consumable';
        const isConsumable = item.type === 'Consumable';
        // Giả định hàm isEquipped() tồn tại trong hero.js
        const isEquipped = hero.isEquipped ? hero.isEquipped(item) : false; 
        
        const itemEl = document.createElement('div');
        
        // Lấy màu sắc độ hiếm hoặc màu Consumable
        const rarityColor = isConsumable ? 'text-red-500' : (RARITIES[item.rarity] ? RARITIES[item.rarity].color : 'text-white');
        
        itemEl.className = 'flex justify-between items-center p-2 border-b border-gray-200 hover:bg-gray-50';
        itemEl.dataset.index = index; // Gán index cho element cha

        // Hiển thị chỉ số
        let statsDisplay = '';
        if (isConsumable) {
             statsDisplay = `<span class="text-red-500">${item.effect === 'healHP' ? `Hồi ${item.value} HP` : `Tác dụng: ${item.effect}`}</span>`;
        } else {
             statsDisplay = `ATK: ${item.stats?.attack || 0}, DEF: ${item.stats?.defense || 0}`;
        }
        
        itemEl.innerHTML = `
            <div class="truncate flex-1 min-w-0">
                <span class="font-bold ${rarityColor} ${isEquipped ? 'underline' : ''}">${item.name || item.id}</span>
                <p class="text-xs text-gray-500">
                    (${item.rarity || item.type}) - Slot: ${item.slot || 'N/A'}
                    <span class="text-gray-700"> [${statsDisplay}] </span>
                </p>
            </div>
            <div class="flex space-x-2 flex-shrink-0" id="item-actions-${index}">
                <button
                    class="sell-item-btn text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded transition duration-150"
                    data-index="${index}"
                >
                    Bán (${sellPrice} 💰)
                </button>
            </div>
        `;
        
        const actionContainer = itemEl.querySelector(`#item-actions-${index}`);
        let actionButtonHTML = '';

        // Nút Mặc HOẶC Bỏ Mặc
        let upgradeButtonHTML = '';
        if (isEquipable) {
            actionButtonHTML = `
                <button
                    class="equip-item-btn text-xs font-bold py-1 px-3 rounded transition duration-150 
                    ${isEquipped ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}"
                    data-index="${index}"
                >
                    ${isEquipped ? 'Bỏ Mặc' : 'Mặc'}
                </button>
            `;
            // Upgrade button for equipable items: show gold cost and shard requirement
            const upgradeCost = calculateItemUpgradeCost(item);
            const shardCost = Math.max(1, Math.floor((item.upgradeLevel || 0) + 1));
            const upgradeLabel = item.upgradeLevel ? `+${item.upgradeLevel}` : '';
            upgradeButtonHTML = `
                <button
                    class="upgrade-item-btn text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded transition duration-150"
                    data-index="${index}"
                    data-cost="${upgradeCost}"
                    data-shard="${shardCost}"
                >
                    🔧 ${upgradeLabel} (${upgradeCost}💰 + ${shardCost} Shard)
                </button>
            `;
        }
        // Nút Sử dụng (Consumable)
        else if (isConsumable) {
            actionButtonHTML = `
                <button
                    class="use-item-btn text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded transition duration-150"
                    data-index="${index}"
                >
                    Sử dụng
                </button>
            `;
        }
        
        // Chèn nút hành động chính vào trước nút Bán
        if (actionButtonHTML) {
            actionContainer.insertAdjacentHTML('afterbegin', actionButtonHTML);
        }
        // Chèn nút Upgrade (nếu có)
        if (upgradeButtonHTML) {
            actionContainer.insertAdjacentHTML('afterbegin', upgradeButtonHTML);
        }

        inventoryDiv.appendChild(itemEl);
    });

    // ----------------------------------------------------
    // Gán lại sự kiện cho TẤT CẢ các nút bằng addEventListener
    // ----------------------------------------------------
    
    // GÁN SỰ KIỆN CHO NÚT BÁN
    document.querySelectorAll('.sell-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            handleSellItem(index); 
        });
    });

    // GÁN SỰ KIỆN CHO NÚT MẶC/BỎ MẶC
    document.querySelectorAll('.equip-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            handleEquipItem(index);
        });
    });

    // GÁN SỰ KIỆN CHO NÚT SỬ DỤNG
    document.querySelectorAll('.use-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            handleUseItem(index);
        });
    });

    // GÁN SỰ KIỆN CHO NÚT NÂNG CẤP
    document.querySelectorAll('.upgrade-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            handleUpgradeItem(index);
        });
    });
}

/**
 * Bỏ trang bị theo slot (gọi từ các nút trong UI). 
 * @param {string} slot - Tên slot cần bỏ (ví dụ: 'weapon').
 */
export function handleUnequip(slot) {
    if (!hero) return;
    const item = hero.unequipItem(slot);
    if (item) {
        logMessage(`👚 Bỏ trang bị **${item.name || item.id}** khỏi slot ${slot}.`);
        hero.calculateStats();
        window.updateUI();
        window.saveGame && window.saveGame();
    } else {
        logMessage(`⚠️ Không có trang bị ở slot ${slot}.`, 'warn');
    }
}

/**
 * Nâng cấp item tại chỉ mục trong inventory.
 * @param {number} index
 */
export function handleUpgradeItem(index) {
    const item = hero.inventory[index];
    if (!item) { logMessage(`⚠️ Không tìm thấy vật phẩm ở chỉ mục ${index}.`, 'warn'); return; }
    if (!item.slot) { logMessage(`⚠️ Vật phẩm **${item.name || item.id}** không thể nâng cấp (không phải trang bị).`, 'warn'); return; }
    const currentLevel = Number(item.upgradeLevel || 0);
    if (currentLevel >= ITEM_UPGRADE_MAX_LEVEL) { logMessage(`⚠️ **${item.name || item.id}** đã đạt cấp nâng cấp tối đa.`, 'info'); return; }
    const cost = calculateItemUpgradeCost(item);
    const shardCost = Math.max(1, Math.floor((item.upgradeLevel || 0) + 1));
    // Ensure materials object exists
    hero.baseStats.materials = hero.baseStats.materials || {};
    hero.baseStats.materials.shard = hero.baseStats.materials.shard || 0;
    if (hero.baseStats.gold < cost) { logMessage(`⚠️ Không đủ vàng để nâng cấp ${item.name || item.id}. Cần ${cost}💰`, 'warn'); return; }
    if (hero.baseStats.materials.shard < shardCost) { logMessage(`⚠️ Không đủ Shard để nâng cấp ${item.name || item.id}. Cần ${shardCost} Shard`, 'warn'); return; }
    // Deduct gold and shards
    hero.baseStats.gold -= cost;
    hero.baseStats.materials.shard -= shardCost;
    applyItemUpgrade(item);
    hero.calculateStats();
    logMessage(`🔧 Đã nâng cấp **${item.name || item.id}** lên +${item.upgradeLevel}. (-${cost}💰, -${shardCost} Shard)`, 'success');
    window.updateUI();
    window.saveGame && window.saveGame();
}