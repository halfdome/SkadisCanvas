// Run only with a file opened and saved through the Bambu Studio GUI.
import {unzipSync,strFromU8} from 'fflate';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const [source,saved]=process.argv.slice(2);
const config=p=>JSON.parse(strFromU8(unzipSync(readFileSync(p))['Metadata/project_settings.config']));
const a=config(source),b=config(saved),keys=a.different_settings_to_system[0].split(';');
const normalized=value=>Array.isArray(value)?value.map(normalized):typeof value==='string'&&value.trim()!==''&&Number.isFinite(Number(value))?Math.round(Number(value)*1e6)/1e6:value;
for(const key of [...keys,'filament_colour','layer_height','initial_layer_print_height','wipe_tower_y'])assert.deepEqual(normalized(b[key]),normalized(a[key]),`GUI must retain ${key}`);
// Studio moves a tower away from the left bed edge (5 -> 15 mm on H3C).
// Its Y clearance from the board must stay unchanged; its X extent must fit.
const bedWidth=Math.max(...a.printable_area.map(p=>Number(p.split('x')[0])));
assert.equal(b.wipe_tower_x.length,a.wipe_tower_x.length);
for(const x of b.wipe_tower_x){assert.ok(Number(x)>=0);assert.ok(Number(x)+Number(b.prime_tower_width)<=bedWidth);}
console.log(JSON.stringify({source,saved,preserved:keys,filaments:b.filament_colour.length,towerPosition:[b.wipe_tower_x[0],b.wipe_tower_y[0]]},null,2));
