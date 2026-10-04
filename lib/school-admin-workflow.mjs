export function createSchoolFieldDiff({ base, draft }) {
  return Object.keys(draft).filter((field) => String(base[field] ?? '') !== String(draft[field] ?? '')).map((field) => ({
    field,
    oldValue: String(base[field] ?? ''),
    newValue: String(draft[field] ?? ''),
  }));
}

export function detectSchoolFieldConflicts({ base, latest, updates }) {
  return Object.keys(updates).flatMap((field) => {
    const loadedValue = String(base[field] ?? '');
    const latestValue = String(latest[field] ?? '');
    const proposedValue = String(updates[field] ?? '');
    if (latestValue === loadedValue || latestValue === proposedValue) return [];
    return [{ field, loadedValue, latestValue, proposedValue }];
  });
}

export function buildSchoolCommitMessage({ schoolCode, schoolName, fields }) {
  return [
    `admin(schools): update ${schoolCode} ${schoolName}`,
    '',
    'Changed:',
    ...fields.map((field) => `- ${field}`),
    '',
    'Edited via JSHS Admin',
  ].join('\n');
}

