import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveRole, dossierRole, mergeMembers } from './roster-merge.js';

const sheet = {
  sourceName: 'Deech Zhetriss',
  species: 'Rodian',
  background: 'Jedi',
  size: 'Medium',
  classes: [{ name: 'Sentinel', levels: 12 }],
  subclasses: ['Path of the Forceblade'],
  abilities: { str: 10, dex: 18, con: 13, int: 11, wis: 18, cha: 13 },
  skills: [{ name: 'Insight', expertise: false }],
};

const entry = (id, data, body = '') => ({ id, body, data: { languages: [], ...data } });

test('deriveRole omits the level entirely', () => {
  const role = deriveRole(sheet);
  assert.equal(role, 'RODIAN · SENTINEL');
  assert.ok(!/\d/.test(role), 'a derived role must contain no digits');
});

test('deriveRole picks the highest-level class when multiclassed', () => {
  const multi = { ...sheet, classes: [{ name: 'Scout', levels: 3 }, { name: 'Sentinel', levels: 9 }] };
  assert.equal(deriveRole(multi), 'RODIAN · SENTINEL');
});

test('deriveRole returns null with no sheet', () => {
  assert.equal(deriveRole(null), null);
});

test('dossierRole appends the subclass to a hand-written role', () => {
  assert.equal(
    dossierRole('RODIAN JEDI SENTINEL', sheet),
    'RODIAN JEDI SENTINEL · PATH OF THE FORCEBLADE',
  );
});

test('dossierRole leaves the role alone when there is no subclass', () => {
  assert.equal(dossierRole('LARGE CLAW-LIKE DROID', { ...sheet, subclasses: [] }), 'LARGE CLAW-LIKE DROID');
  assert.equal(dossierRole('STALKER', null), 'STALKER');
});

test('a hand-written role wins over derivation', () => {
  const [member] = mergeMembers([entry('deech', { role: 'RODIAN JEDI SENTINEL', order: 1 })], {});
  assert.equal(member.role, 'RODIAN JEDI SENTINEL');
});

test('members are joined to their sheet and sorted by order', () => {
  const members = mergeMembers(
    [entry('b', { export: 'x.json', order: 2 }), entry('a', { order: 1 })],
    { 'x.json': sheet },
  );
  assert.deepEqual(members.map((m) => m.slug), ['a', 'b']);
  assert.equal(members[0].sheet, null);
  assert.equal(members[1].sheet, sheet);
});

test('bio is the markdown body as trimmed plain text', () => {
  const [member] = mergeMembers(
    [entry('deech', { order: 1 }, '\nRodian Jedi sentinel. Keeps the archive.\n')],
    {},
  );
  assert.equal(member.bio, 'Rodian Jedi sentinel. Keeps the archive.');
});

test('bio is an empty string when the body is missing', () => {
  const [member] = mergeMembers([{ id: 'bare', data: { languages: [], order: 1 } }], {});
  assert.equal(member.bio, '');
});

test('an overlay naming a missing export warns and does not throw', () => {
  const warnings = [];
  const members = mergeMembers([entry('ghost', { export: 'nope.json', order: 1 })], {}, (m) => warnings.push(m));
  assert.equal(members[0].sheet, null);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /ghost.*nope\.json/);
});

test('an export no overlay references warns', () => {
  const warnings = [];
  mergeMembers([entry('a', { order: 1 })], { 'orphan.json': sheet }, (m) => warnings.push(m));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /orphan\.json.*not referenced/);
});
