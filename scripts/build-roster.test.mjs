import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruneActor, buildRoster } from './build-roster.mjs';

const TZEL = "fvtt-Actor-t'zel-nloZyUHeyUKNuQDw.json";
const BORIS = 'fvtt-Actor-boris-7BRzg2DgZ1bBO6pP.json';
const DAX = 'fvtt-Actor-dax-thorn-habx4L2skJff6owM.json';

// Minimal hand-built actor for the error paths. Real exports never look this bare.
const stubActor = ({ skills = {}, size = 'med' } = {}) => ({
  name: 'Stub',
  system: {
    traits: { size },
    skills,
    abilities: Object.fromEntries(
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => [k, { value: 10 }]),
    ),
  },
  items: [],
});

test('every committed export prunes to a usable sheet', () => {
  const roster = buildRoster();
  assert.equal(Object.keys(roster).length, 9);
  for (const [file, sheet] of Object.entries(roster)) {
    assert.ok(sheet.species, `${file} has no species`);
    assert.ok(sheet.classes.length >= 1, `${file} has no class`);
    assert.ok(sheet.classes[0].levels > 0, `${file} class has no levels`);
    assert.ok(sheet.size, `${file} has no size`);
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      assert.equal(typeof sheet.abilities[key], 'number', `${file} missing ${key}`);
    }
  }
});

test('accented names survive the UTF-8 read', () => {
  assert.equal(buildRoster()[BORIS].sourceName, 'Borís');
});

test('known sheets carry the expected values', () => {
  const tzel = buildRoster()[TZEL];
  assert.equal(tzel.species, 'Echani');
  assert.equal(tzel.background, 'Bounty Hunter');
  assert.equal(tzel.size, 'Medium');
  assert.deepEqual(tzel.classes, [{ name: 'Monk', levels: 11 }]);
  assert.deepEqual(tzel.subclasses, ['Echani Order']);
  assert.equal(tzel.abilities.dex, 19);
  assert.equal(tzel.abilities.cha, 9);
});

test('expertise is distinguished from plain proficiency', () => {
  const tzel = buildRoster()[TZEL];
  const stealth = tzel.skills.find((s) => s.name === 'Stealth');
  const insight = tzel.skills.find((s) => s.name === 'Insight');
  assert.equal(stealth.expertise, true);
  assert.equal(insight.expertise, false);

  const dax = buildRoster()[DAX];
  assert.equal(dax.skills.find((s) => s.name === 'Deception').expertise, true);
  assert.equal(dax.skills.find((s) => s.name === 'Intimidation').expertise, true);
  assert.equal(dax.skills.find((s) => s.name === 'Stealth').expertise, false);
});

test('only proficient skills are emitted, sorted by name', () => {
  const tzel = buildRoster()[TZEL];
  assert.deepEqual(
    tzel.skills.map((s) => s.name),
    ['Acrobatics', 'Athletics', 'Insight', 'Lore', 'Perception', 'Stealth'],
  );
});

test('legacy arc/his/rel codes are recognised, not fatal', () => {
  const sheet = pruneActor(stubActor({
    skills: { arc: { value: 1 }, his: { value: 1 }, rel: { value: 1 } },
  }));
  assert.deepEqual(sheet.skills.map((s) => s.name), ['Arcana', 'History', 'Religion']);
});

test('an unknown skill code throws', () => {
  assert.throws(
    () => pruneActor(stubActor({ skills: { zzz: { value: 1 } } })),
    /Unknown skill code "zzz"/,
  );
});

test('an unrecognised skill code with no proficiency is ignored', () => {
  const sheet = pruneActor(stubActor({ skills: { zzz: { value: 0 } } }));
  assert.deepEqual(sheet.skills, []);
});

test('an unknown size code throws', () => {
  assert.throws(
    () => pruneActor(stubActor({ size: 'enormous' })),
    /Unknown size code "enormous"/,
  );
});
