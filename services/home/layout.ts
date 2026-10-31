// Customizable Home: which sections ("widgets") show, in what order, and which
// tools the pinned-tools row carries. Everything here is pure so the rules can
// be tested without React or storage; services/userdata/homeLayout.ts persists
// the result and components/home/useHomeLayout.ts binds it to the screen.
//
// Stored shape (AsyncStorage 'home:v1'):
//   { v: 1, order: WidgetId[], hidden: WidgetId[], pinnedTools: ToolId[] }
//
// `order` lists every widget, hidden ones included, so hiding and re-showing a
// section keeps its place. The file is untrusted on read: it may come from an
// older build (fewer widgets), a newer one (ids this build does not know), a
// half-written save or a hand edit, and normalizeHomeLayout() turns any of
// those into a valid layout without throwing.

/** Every Home section in its default order. Append new ids where they belong. */
export const HOME_WIDGETS = [
  'resources',
  'recruitment',
  'happening',
  'comingUp',
  'dailyStudent',
  'birthdays',
  'tools',
] as const;
export type HomeWidgetId = (typeof HOME_WIDGETS)[number];

/** Widgets a fresh install starts with switched off. None today. */
export const DEFAULT_HIDDEN: readonly HomeWidgetId[] = [];

/**
 * Tools the pinned-tools row can carry, in the order the picker lists them.
 * Each id is a key of TOOL_ROUTES (components/schale/ToolGrid.tsx); the
 * tools widget checks that at compile time.
 */
export const PINNABLE_TOOLS = [
  'Planner',
  'Gacha',
  'Ap',
  'Bond',
  'Banners',
  'Level',
  'Eleph',
  'Skill',
  'Raid',
  'Birthdays',
  'Reminders',
] as const;
export type PinnableTool = (typeof PINNABLE_TOOLS)[number];

export const DEFAULT_PINNED_TOOLS: readonly PinnableTool[] = ['Planner', 'Gacha', 'Ap', 'Bond'];

/** Two rows of four keeps the row compact on a phone. */
export const MAX_PINNED_TOOLS = 8;

export const HOME_LAYOUT_VERSION = 1;

export interface HomeLayout {
  v: typeof HOME_LAYOUT_VERSION;
  order: HomeWidgetId[];
  hidden: HomeWidgetId[];
  pinnedTools: PinnableTool[];
}

export function defaultHomeLayout(): HomeLayout {
  return {
    v: HOME_LAYOUT_VERSION,
    order: [...HOME_WIDGETS],
    hidden: [...DEFAULT_HIDDEN],
    pinnedTools: [...DEFAULT_PINNED_TOOLS],
  };
}

const WIDGET_SET: ReadonlySet<string> = new Set(HOME_WIDGETS);
const TOOL_SET: ReadonlySet<string> = new Set(PINNABLE_TOOLS);

export const isHomeWidgetId = (value: unknown): value is HomeWidgetId =>
  typeof value === 'string' && WIDGET_SET.has(value);

export const isPinnableTool = (value: unknown): value is PinnableTool =>
  typeof value === 'string' && TOOL_SET.has(value);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Known, unique ids from an untrusted list, first occurrence wins. */
function uniqueKnown<T extends string>(raw: unknown, isKnown: (value: unknown) => value is T, limit = Infinity): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (!isKnown(value) || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Completes a saved order with the widgets it does not mention (a section
 * added in a later release). Each one goes back to its default position:
 * right after the nearest widget that precedes it in HOME_WIDGETS, or first
 * when none of those are present. A widget that is last by default is
 * therefore appended.
 */
export function withMissingWidgets(saved: readonly HomeWidgetId[]): HomeWidgetId[] {
  const order = [...saved];
  HOME_WIDGETS.forEach((id, index) => {
    if (order.includes(id)) return;
    let at = 0;
    for (let i = index - 1; i >= 0; i--) {
      const pos = order.indexOf(HOME_WIDGETS[i]);
      if (pos !== -1) { at = pos + 1; break; }
    }
    order.splice(at, 0, id);
  });
  return order;
}

/**
 * Any stored value to a valid layout. Never throws.
 *  - not an object, or no usable `order` → the default layout;
 *  - unknown widget/tool ids are dropped, duplicates collapse;
 *  - widgets the save does not know about are inserted at their default
 *    position and keep their default visibility;
 *  - a missing `pinnedTools`, or one with no tool this build knows, falls
 *    back to the default set, but an explicit empty list is respected (the
 *    user unpinned everything).
 * A save from a newer build (v > 1) is read the same way: fields are only
 * ever added, so what this build understands is still valid.
 */
export function normalizeHomeLayout(raw: unknown): HomeLayout {
  const record = asRecord(raw);
  if (!record) return defaultHomeLayout();
  const saved = uniqueKnown(record.order, isHomeWidgetId);
  if (!saved.length) return defaultHomeLayout();
  const order = withMissingWidgets(saved);
  const savedSet = new Set<HomeWidgetId>(saved);
  const hidden = uniqueKnown(record.hidden, isHomeWidgetId);
  // A widget new to this save takes its default visibility.
  for (const id of DEFAULT_HIDDEN) if (!savedSet.has(id) && !hidden.includes(id)) hidden.push(id);
  const pinned = uniqueKnown(record.pinnedTools, isPinnableTool, MAX_PINNED_TOOLS);
  const unpinnedOnPurpose = Array.isArray(record.pinnedTools) && record.pinnedTools.length === 0;
  const pinnedTools = pinned.length || unpinnedOnPurpose ? pinned : [...DEFAULT_PINNED_TOOLS];
  return { v: HOME_LAYOUT_VERSION, order, hidden: order.filter(id => hidden.includes(id)), pinnedTools };
}

/** The widgets Home renders, top to bottom. */
export function visibleWidgets(layout: HomeLayout): HomeWidgetId[] {
  return layout.order.filter(id => !layout.hidden.includes(id));
}

export const isWidgetVisible = (layout: HomeLayout, id: HomeWidgetId) => !layout.hidden.includes(id);

/** Whether `id` can move one step up (-1) or down (+1). */
export function canMoveWidget(layout: HomeLayout, id: HomeWidgetId, delta: -1 | 1): boolean {
  const from = layout.order.indexOf(id);
  const to = from + delta;
  return from !== -1 && to >= 0 && to < layout.order.length;
}

/** Swaps `id` with its neighbour. Returns `layout` itself when it cannot move. */
export function moveWidget(layout: HomeLayout, id: HomeWidgetId, delta: -1 | 1): HomeLayout {
  if (!canMoveWidget(layout, id, delta)) return layout;
  const from = layout.order.indexOf(id);
  const order = [...layout.order];
  [order[from], order[from + delta]] = [order[from + delta], order[from]];
  return { ...layout, order, hidden: order.filter(w => layout.hidden.includes(w)) };
}

export const moveWidgetUp = (layout: HomeLayout, id: HomeWidgetId) => moveWidget(layout, id, -1);
export const moveWidgetDown = (layout: HomeLayout, id: HomeWidgetId) => moveWidget(layout, id, 1);

/** Shows or hides one widget. Returns `layout` itself when nothing changes. */
export function setWidgetVisible(layout: HomeLayout, id: HomeWidgetId, visible: boolean): HomeLayout {
  if (!isHomeWidgetId(id) || isWidgetVisible(layout, id) === visible) return layout;
  const hidden = visible
    ? layout.hidden.filter(w => w !== id)
    : layout.order.filter(w => w === id || layout.hidden.includes(w));
  return { ...layout, hidden };
}

export const toggleWidget = (layout: HomeLayout, id: HomeWidgetId) =>
  setWidgetVisible(layout, id, !isWidgetVisible(layout, id));

export const canPinMoreTools = (layout: HomeLayout) => layout.pinnedTools.length < MAX_PINNED_TOOLS;

/**
 * Pins (appended, so the row follows the order you pick in) or unpins a tool.
 * Returns `layout` itself when nothing changes, including at the cap.
 */
export function setToolPinned(layout: HomeLayout, tool: PinnableTool, pinned: boolean): HomeLayout {
  if (!isPinnableTool(tool)) return layout;
  const present = layout.pinnedTools.includes(tool);
  if (present === pinned) return layout;
  if (!pinned) return { ...layout, pinnedTools: layout.pinnedTools.filter(t => t !== tool) };
  if (!canPinMoreTools(layout)) return layout;
  return { ...layout, pinnedTools: [...layout.pinnedTools, tool] };
}

export const toggleTool = (layout: HomeLayout, tool: PinnableTool) =>
  setToolPinned(layout, tool, !layout.pinnedTools.includes(tool));

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** True when the layout matches a fresh install (drives "Reset to default"). */
export function isDefaultHomeLayout(layout: HomeLayout): boolean {
  const fresh = defaultHomeLayout();
  return sameList(layout.order, fresh.order) && sameList(layout.hidden, fresh.hidden) && sameList(layout.pinnedTools, fresh.pinnedTools);
}

// Widgets whose last element is a button; an ad right below one invites
// accidental taps (an AdMob policy risk), so the ad skips past them.
const ENDS_IN_BUTTON: ReadonlySet<HomeWidgetId> = new Set(['recruitment', 'tools']);

/**
 * Index of the visible widget the Home banner ad follows: the third widget or
 * later (below the fold), never one that ends in a button; the last widget
 * when nothing qualifies.
 */
export function homeAdSlot(visible: readonly HomeWidgetId[]): number {
  for (let i = 2; i < visible.length; i++) if (!ENDS_IN_BUTTON.has(visible[i])) return i;
  return visible.length - 1;
}
