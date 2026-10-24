import { studentIconUrl } from "./schaledb";

/**
 * Our own copy of every student icon on Firebase Hosting, refreshed with
 * `npm run icons:refresh`. Tried before SchaleDB so a third party blocking
 * hotlinks (bluearchive.wiki did, Oct 2026) cannot blank the app.
 */
const HOSTED_ICON_BASE = "https://blue-archive-tool.web.app/icons";

export const hostedIconUrl = (id: number) => `${HOSTED_ICON_BASE}/${id}.webp`;

/** Icon candidates in load order: our mirror, then SchaleDB. */
export const studentIconUris = (id: number): string[] => [
  hostedIconUrl(id),
  studentIconUrl(id),
];

/**
 * Candidates for a Firestore character: the stored image first (what every
 * shipped app version uses), then icons derived from its SchaleDB id.
 */
export function characterImageUris(char: {
  image?: string;
  studentId?: number;
}): string[] {
  const derived =
    typeof char.studentId === "number" ? studentIconUris(char.studentId) : [];
  return [...new Set([char.image, ...derived].filter((u): u is string => !!u))];
}
