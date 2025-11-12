// modules/materials.js
import { hero } from './game.js';

export function renderMaterials() {
    const panel = document.getElementById('materials-panel');
    if (!panel) return;
    const mats = (hero && hero.baseStats && hero.baseStats.materials) ? hero.baseStats.materials : {};
    const shard = mats.shard || 0;
    panel.innerHTML = `
        <div class="flex items-center justify-between">
            <div>
                <div class="text-sm font-semibold">Shard</div>
                <div class="text-xs text-gray-500">Dùng để nâng cấp trang bị</div>
            </div>
            <div class="text-indigo-600 font-bold text-lg">${shard}</div>
        </div>
    `;
}
