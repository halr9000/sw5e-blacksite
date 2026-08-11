import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = join(ROOT, 'data', 'actors');
const OUTPUT = join(ROOT, 'src', 'data', 'roster.json');

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// Every skill code observed across the exports. Some actors carry the legacy
// arc/his/rel trio alongside SW5e's lor, so all of them are recognised.
const SKILLS = {
  acr: 'Acrobatics', ani: 'Animal Handling', arc: 'Arcana', ath: 'Athletics',
  dec: 'Deception', his: 'History', ins: 'Insight', inv: 'Investigation',
  itm: 'Intimidation', lor: 'Lore', med: 'Medicine', nat: 'Nature',
  per: 'Persuasion', pil: 'Piloting', prc: 'Perception', prf: 'Performance',
  rel: 'Religion', slt: 'Sleight of Hand', ste: 'Stealth', sur: 'Survival',
  tec: 'Technology',
};

const SIZES = {
  tiny: 'Tiny', sm: 'Small', med: 'Medium',
  lg: 'Large', huge: 'Huge', grg: 'Gargantuan',
};

export function pruneActor(actor) {
  const items = actor.items ?? [];
  const firstNamed = (type) => items.find((i) => i.type === type)?.name ?? null;

  const sizeCode = actor.system.traits.size;
  const size = SIZES[sizeCode];
  if (!size) throw new Error(`Unknown size code "${sizeCode}" for ${actor.name}`);

  const skills = Object.entries(actor.system.skills ?? {})
    .filter(([, skill]) => skill.value > 0)
    .map(([code, skill]) => {
      const name = SKILLS[code];
      if (!name) throw new Error(`Unknown skill code "${code}" for ${actor.name}`);
      return { name, expertise: skill.value >= 2 };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const abilities = {};
  for (const key of ABILITIES) abilities[key] = actor.system.abilities[key].value;

  return {
    sourceName: actor.name,
    species: firstNamed('race'),
    background: firstNamed('background'),
    size,
    // levels identify the primary class for a multiclass character.
    // They are deliberately never rendered.
    classes: items
      .filter((i) => i.type === 'class')
      .map((i) => ({ name: i.name, levels: i.system.levels })),
    subclasses: items.filter((i) => i.type === 'subclass').map((i) => i.name),
    abilities,
    skills,
  };
}

export function buildRoster(dir = SOURCE_DIR) {
  const roster = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const actor = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    roster[file] = pruneActor(actor);
  }
  return roster;
}

function main() {
  const roster = buildRoster();
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(roster, null, 2)}\n`, 'utf8');
  console.log(`[roster] wrote ${Object.keys(roster).length} sheets to src/data/roster.json`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
