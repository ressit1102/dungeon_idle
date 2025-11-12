import assert from 'assert';
import fs from 'fs';
import path from 'path';

function run() {
    console.log('Running test_save_roundtrip...');
    const FILE = path.resolve(process.cwd(), '.node_local_storage.json');
    const SAVE_KEY = 'idle_rpg_save_data';

    const sample = { timestamp: new Date().toISOString(), heroState: { level: 2, name: 'Test' }, gameState: { dungeonId: 'Cave of Slimes' } };
    const raw = {};
    raw[SAVE_KEY] = JSON.stringify(sample);
    fs.writeFileSync(FILE, JSON.stringify(raw, null, 2));

    // Read back using same file format
    const read = JSON.parse(fs.readFileSync(FILE, 'utf8') || '{}');
    const parsed = JSON.parse(read[SAVE_KEY]);
    assert.deepStrictEqual(parsed, sample, 'Loaded save should match saved sample');

    // cleanup
    try { fs.unlinkSync(FILE); } catch {}

    console.log('test_save_roundtrip passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) run();

export default run;
