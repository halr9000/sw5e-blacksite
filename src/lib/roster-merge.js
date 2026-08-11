/** Species and primary class, uppercased. Never includes a level. */
export function deriveRole(sheet) {
  if (!sheet) return null;
  const primary = [...sheet.classes].sort((a, b) => b.levels - a.levels)[0];
  const parts = [sheet.species, primary?.name].filter(Boolean);
  return parts.length ? parts.join(' · ').toUpperCase() : null;
}

/** The dossier heading: the role plus the subclass, which characterises where a level would not. */
export function dossierRole(role, sheet) {
  const subclass = sheet?.subclasses?.[0];
  if (!role) return null;
  return subclass ? `${role} · ${subclass.toUpperCase()}` : role;
}

export function mergeMembers(entries, roster, warn = console.warn) {
  const referenced = new Set();

  const members = entries.map((entry) => {
    const data = entry.data;
    let sheet = null;

    if (data.export) {
      referenced.add(data.export);
      sheet = roster[data.export] ?? null;
      if (!sheet) throw new Error(`[roster] ${entry.id}: no export named "${data.export}"`);
    }

    return {
      slug: entry.id,
      displayName: data.displayName,
      role: data.role ?? deriveRole(sheet),
      initials: data.initials,
      tagline: data.tagline,
      portrait: data.portrait ?? null,
      languages: data.languages ?? [],
      status: data.status,
      order: data.order,
      bio: (entry.body ?? '').trim(),
      sheet,
      entry,
    };
  }).sort((a, b) => a.order - b.order);

  for (const file of Object.keys(roster)) {
    if (!referenced.has(file)) warn(`[roster] export "${file}" is not referenced by any overlay`);
  }

  return members;
}
