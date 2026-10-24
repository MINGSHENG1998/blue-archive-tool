// Persists the in-progress pull session so closing the app mid-pull does not
// lose the count. Best-effort: a storage failure just means starting over.

import AsyncStorage from "@react-native-async-storage/async-storage";

import { emptySession, type GachaSession, type PullKind } from "./session";

const KEY = "gacha:v1:session";
const VALID: PullKind[] = ["miss", "threeStar", "pickup"];

export async function loadSession(): Promise<GachaSession> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as unknown;
    const history = (parsed as GachaSession | null)?.history;
    if (!Array.isArray(history)) return emptySession();
    // Drop anything unrecognised rather than letting it reach the reducer.
    return {
      history: history.filter((kind): kind is PullKind =>
        VALID.includes(kind as PullKind),
      ),
    };
  } catch {
    return emptySession();
  }
}

export async function saveSession(session: GachaSession): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Nothing actionable; the in-memory session is still correct.
  }
}
