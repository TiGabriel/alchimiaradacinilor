/** Consent records are append-only; the current state is the latest record per purpose. Pure. */

export type ConsentLike = {
  purpose: string;
  granted: boolean;
  createdAt: Date;
  policyVersion: string;
};

export function latestConsents<T extends ConsentLike>(records: T[]): Map<string, T> {
  const latest = new Map<string, T>();
  for (const record of records) {
    const current = latest.get(record.purpose);
    if (!current || record.createdAt.getTime() >= current.createdAt.getTime())
      latest.set(record.purpose, record);
  }
  return latest;
}

export function isGranted(records: ConsentLike[], purpose: string): boolean {
  return latestConsents(records).get(purpose)?.granted ?? false;
}
