// modules/debug.js

import { debugIncrementEnemies, debugAddGold } from './game.js';
import { activateQuest } from './quest.js';
import { setCombatBalance } from './combat.js';

export function initDebugUI() {
    // Create a small fixed debug panel
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.bottom = '12px';
    panel.style.background = 'rgba(17,24,39,0.95)';
    panel.style.color = '#fff';
    panel.style.padding = '8px';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = '9999';
    panel.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    panel.style.fontSize = '12px';
    panel.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px">DEBUG / TEST</div>
        <div style="display:flex;flex-direction:column;gap:6px">
            <button id="dbg-kill-1" style="padding:6px;border-radius:6px;background:#10b981;border:none;color:#fff;cursor:pointer">Simulate +1 Kill</button>
            <button id="dbg-kill-10" style="padding:6px;border-radius:6px;background:#059669;border:none;color:#fff;cursor:pointer">Simulate +10 Kills</button>
            <button id="dbg-gold-100" style="padding:6px;border-radius:6px;background:#f59e0b;border:none;color:#111;cursor:pointer">Give +100 Gold</button>
            <button id="dbg-gold-1000" style="padding:6px;border-radius:6px;background:#d97706;border:none;color:#fff;cursor:pointer">Give +1000 Gold</button>
            <button id="dbg-activate-upgrade" style="padding:6px;border-radius:6px;background:#3b82f6;border:none;color:#fff;cursor:pointer">Activate UPGRADE_ATTACK_1</button>
            <button id="dbg-balance-50" style="padding:6px;border-radius:6px;background:#6b21a8;border:none;color:#fff;cursor:pointer">Set Balance ~50%</button>
            <button id="dbg-close" style="padding:6px;border-radius:6px;background:#ef4444;border:none;color:#fff;cursor:pointer">Close Panel</button>
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('dbg-kill-1').addEventListener('click', () => {
        debugIncrementEnemies(1);
        console.log('Debug: +1 kill');
    });

    document.getElementById('dbg-kill-10').addEventListener('click', () => {
        debugIncrementEnemies(10);
        console.log('Debug: +10 kills');
    });

    document.getElementById('dbg-gold-100').addEventListener('click', () => {
        debugAddGold(100);
        console.log('Debug: +100 gold');
    });

    document.getElementById('dbg-gold-1000').addEventListener('click', () => {
        debugAddGold(1000);
        console.log('Debug: +1000 gold');
    });

    document.getElementById('dbg-activate-upgrade').addEventListener('click', () => {
        activateQuest('UPGRADE_ATTACK_1');
        if (window.updateUI) window.updateUI();
        console.log('Debug: Activated UPGRADE_ATTACK_1');
    });

    document.getElementById('dbg-balance-50').addEventListener('click', () => {
        // Heuristic tuning to aim for ~50% balance: reduce defense effectiveness and reduce variance
        try {
            setCombatBalance({ defenseEffectiveness: 0.5, damageVariance: 0.08, bossDefenseBypass: 0.3 });
            console.log('Debug: Set balance params to approx 50%');
        } catch (e) {
            console.warn('Failed to set combat balance', e);
        }
    });

    document.getElementById('dbg-close').addEventListener('click', () => {
        panel.remove();
    });
}
