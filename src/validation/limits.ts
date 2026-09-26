/** Upload limits shared by forms (browser) and services — no Zod, so client bundles stay small. */

/** Serverless hosts cap request bodies (Netlify: ~4.5 MB for binary uploads), so images stay under 4 MB. */
export const IMAGE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const REVIEW_IMAGE_MAX_BYTES = IMAGE_UPLOAD_MAX_BYTES;
