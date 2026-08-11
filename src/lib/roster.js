import { getCollection } from 'astro:content';
import roster from '../data/roster.json';
import { mergeMembers } from './roster-merge.js';

export { deriveRole, dossierRole } from './roster-merge.js';

export async function getRoster() {
  return mergeMembers(await getCollection('crew'), roster);
}
