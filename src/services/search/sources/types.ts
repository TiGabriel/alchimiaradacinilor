import type { SearchDocument } from "../engine";

/** A pluggable search source. Register new ones in ../index.ts (e.g. articles, routines). */
export type SearchSource = {
  type: string;
  /** Group label shown in the UI. */
  label: string;
  load: () => Promise<SearchDocument[]>;
};
