import {
  homeAdSlot,
  DEFAULT_PINNED_TOOLS,
  HOME_WIDGETS,
  MAX_PINNED_TOOLS,
  PINNABLE_TOOLS,
  canMoveWidget,
  canPinMoreTools,
  defaultHomeLayout,
  isDefaultHomeLayout,
  moveWidget,
  moveWidgetDown,
  moveWidgetUp,
  normalizeHomeLayout,
  setToolPinned,
  setWidgetVisible,
  toggleTool,
  toggleWidget,
  visibleWidgets,
  withMissingWidgets,
  type HomeLayout,
} from '../layout';

const layout = (patch: Partial<HomeLayout> = {}): HomeLayout => ({ ...defaultHomeLayout(), ...patch });

describe('defaultHomeLayout', () => {
  it('shows every widget in the default order with the default tools', () => {
    const fresh = defaultHomeLayout();
    expect(fresh).toEqual({ v: 1, order: [...HOME_WIDGETS], hidden: [], pinnedTools: ['Planner', 'Gacha', 'Bond', 'Raid'] });
    expect(visibleWidgets(fresh)).toEqual([...HOME_WIDGETS]);
    expect(isDefaultHomeLayout(fresh)).toBe(true);
  });

  it('hands out a fresh copy every call', () => {
    const a = defaultHomeLayout();
    a.order.reverse();
    a.pinnedTools.pop();
    expect(defaultHomeLayout().order).toEqual([...HOME_WIDGETS]);
    expect(defaultHomeLayout().pinnedTools).toEqual([...DEFAULT_PINNED_TOOLS]);
  });
});

describe('normalizeHomeLayout', () => {
  it.each([null, undefined, 42, 'home', [], ['tools'], { order: 'tools' }, { order: [] }, { order: ['nope', 7] }])(
    'falls back to the default layout for %p',
    (raw) => {
      expect(normalizeHomeLayout(raw)).toEqual(defaultHomeLayout());
    },
  );

  it('keeps a valid saved layout as is', () => {
    const saved = {
      v: 1,
      order: ['tools', 'birthdays', 'dailyStudent', 'comingUp', 'happening', 'recruitment', 'resources'],
      hidden: ['happening', 'resources'],
      pinnedTools: ['Raid', 'Skill'],
    };
    expect(normalizeHomeLayout(saved)).toEqual(saved);
  });

  it('drops unknown and duplicate ids', () => {
    const result = normalizeHomeLayout({
      v: 1,
      order: ['tools', 'tools', 'widgetFrom2030', 'resources', 3, null, ...HOME_WIDGETS],
      hidden: ['tools', 'ghost', 'tools', {}],
      pinnedTools: ['Raid', 'Raid', 'Teleporter', 12, 'Ap', 'Bond'],
    });
    expect(result.order).toEqual(['tools', 'resources', 'recruitment', 'happening', 'comingUp', 'dailyStudent', 'birthdays']);
    expect(result.hidden).toEqual(['tools']);
    // 'Ap' is no longer pinnable (the AP timer is hidden), so it drops like an unknown id.
    expect(result.pinnedTools).toEqual(['Raid', 'Bond']);
  });

  it('keeps hidden in display order', () => {
    const result = normalizeHomeLayout({ order: [...HOME_WIDGETS], hidden: ['tools', 'resources', 'happening'] });
    expect(result.hidden).toEqual(['resources', 'happening', 'tools']);
  });

  it('respects an explicit empty pinned list but defaults a missing or malformed one', () => {
    expect(normalizeHomeLayout({ order: [...HOME_WIDGETS], pinnedTools: [] }).pinnedTools).toEqual([]);
    expect(normalizeHomeLayout({ order: [...HOME_WIDGETS] }).pinnedTools).toEqual([...DEFAULT_PINNED_TOOLS]);
    expect(normalizeHomeLayout({ order: [...HOME_WIDGETS], pinnedTools: 'Raid' }).pinnedTools).toEqual([...DEFAULT_PINNED_TOOLS]);
  });

  it('caps pinned tools', () => {
    const result = normalizeHomeLayout({ order: [...HOME_WIDGETS], pinnedTools: [...PINNABLE_TOOLS] });
    expect(result.pinnedTools).toEqual(PINNABLE_TOOLS.slice(0, MAX_PINNED_TOOLS));
  });

  it('tolerates missing hidden and a missing version', () => {
    expect(normalizeHomeLayout({ order: ['tools', 'resources'] })).toEqual({
      v: 1,
      order: ['tools', 'resources', 'recruitment', 'happening', 'comingUp', 'dailyStudent', 'birthdays'],
      hidden: [],
      pinnedTools: [...DEFAULT_PINNED_TOOLS],
    });
  });

  it('reads a save from a newer build by the fields it understands', () => {
    const result = normalizeHomeLayout({ v: 7, order: ['comingUp', 'quests', ...HOME_WIDGETS], hidden: ['quests', 'tools'], pinnedTools: ['Gacha'], theme: 'dense' });
    expect(result.v).toBe(1);
    expect(result.order[0]).toBe('comingUp');
    expect(result.hidden).toEqual(['tools']);
    expect(result.pinnedTools).toEqual(['Gacha']);
  });

  it('never throws on odd shapes', () => {
    const odd = { order: [['tools'], { id: 'tools' }, 'tools'], hidden: 'tools', pinnedTools: [null, ['Ap'], { Ap: true }] };
    expect(() => normalizeHomeLayout(odd)).not.toThrow();
    expect(normalizeHomeLayout(odd)).toMatchObject({ hidden: [], pinnedTools: [...DEFAULT_PINNED_TOOLS] });
  });

  it('defaults the tools when none of the pinned ones are known to this build', () => {
    expect(normalizeHomeLayout({ order: [...HOME_WIDGETS], pinnedTools: ['ShopFrom2030'] }).pinnedTools).toEqual([...DEFAULT_PINNED_TOOLS]);
  });
});

describe('migration: widgets added in a later release', () => {
  // An older build only knew these five, and the user had moved tools up.
  const olderSave = { v: 1, order: ['tools', 'resources', 'recruitment', 'comingUp', 'birthdays'], hidden: ['recruitment'], pinnedTools: ['Raid'] };

  it('inserts each new widget at its default position and shows it', () => {
    const result = normalizeHomeLayout(olderSave);
    // happening follows recruitment; dailyStudent follows comingUp.
    expect(result.order).toEqual(['tools', 'resources', 'recruitment', 'happening', 'comingUp', 'dailyStudent', 'birthdays']);
    expect(result.hidden).toEqual(['recruitment']);
    expect(visibleWidgets(result)).toContain('happening');
    expect(visibleWidgets(result)).toContain('dailyStudent');
    expect(result.pinnedTools).toEqual(['Raid']);
  });

  it('puts a new first widget first and a new last widget last', () => {
    expect(withMissingWidgets(['recruitment', 'happening', 'comingUp', 'dailyStudent', 'birthdays'])).toEqual([...HOME_WIDGETS]);
    expect(withMissingWidgets(['birthdays', 'resources'])).toEqual(['birthdays', 'tools', 'resources', 'recruitment', 'happening', 'comingUp', 'dailyStudent']);
  });

  it('is stable: normalizing twice changes nothing', () => {
    const once = normalizeHomeLayout(olderSave);
    expect(normalizeHomeLayout(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });
});

describe('moveWidget', () => {
  it('swaps with the neighbour above and below', () => {
    expect(moveWidgetUp(layout(), 'recruitment').order.slice(0, 2)).toEqual(['recruitment', 'resources']);
    expect(moveWidgetDown(layout(), 'resources').order.slice(0, 2)).toEqual(['recruitment', 'resources']);
  });

  it('returns the same layout at the edges', () => {
    const fresh = layout();
    expect(moveWidgetUp(fresh, 'resources')).toBe(fresh);
    expect(moveWidgetDown(fresh, 'tools')).toBe(fresh);
    expect(canMoveWidget(fresh, 'resources', -1)).toBe(false);
    expect(canMoveWidget(fresh, 'tools', 1)).toBe(false);
    expect(canMoveWidget(fresh, 'happening', 1)).toBe(true);
  });

  it('moves hidden widgets too and keeps hidden in order', () => {
    const start = layout({ hidden: ['happening', 'tools'] });
    const moved = moveWidget(moveWidget(start, 'tools', -1), 'tools', -1);
    expect(moved.order).toEqual(['resources', 'recruitment', 'happening', 'comingUp', 'tools', 'dailyStudent', 'birthdays']);
    expect(moved.hidden).toEqual(['happening', 'tools']);
    expect(start.order).toEqual([...HOME_WIDGETS]);
  });

  it('can walk a widget from bottom to top', () => {
    let current = layout();
    for (let i = 0; i < HOME_WIDGETS.length + 2; i++) current = moveWidgetUp(current, 'tools');
    expect(current.order[0]).toBe('tools');
    expect(current.order).toHaveLength(HOME_WIDGETS.length);
  });
});

describe('setWidgetVisible / toggleWidget', () => {
  it('hides and shows a widget without moving it', () => {
    const hidden = setWidgetVisible(layout(), 'comingUp', false);
    expect(hidden.hidden).toEqual(['comingUp']);
    expect(visibleWidgets(hidden)).not.toContain('comingUp');
    expect(hidden.order).toEqual([...HOME_WIDGETS]);
    const shown = setWidgetVisible(hidden, 'comingUp', true);
    expect(shown.hidden).toEqual([]);
    expect(visibleWidgets(shown)).toEqual([...HOME_WIDGETS]);
  });

  it('returns the same layout when nothing changes', () => {
    const fresh = layout();
    expect(setWidgetVisible(fresh, 'tools', true)).toBe(fresh);
    const hidden = setWidgetVisible(fresh, 'tools', false);
    expect(setWidgetVisible(hidden, 'tools', false)).toBe(hidden);
  });

  it('toggles and can hide everything', () => {
    let current = layout();
    for (const id of HOME_WIDGETS) current = toggleWidget(current, id);
    expect(visibleWidgets(current)).toEqual([]);
    expect(current.hidden).toEqual([...HOME_WIDGETS]);
    expect(toggleWidget(current, 'birthdays').hidden).not.toContain('birthdays');
  });
});

describe('pinned tools', () => {
  it('appends on pin and removes in place', () => {
    expect(setToolPinned(layout(), 'Level', true).pinnedTools).toEqual(['Planner', 'Gacha', 'Bond', 'Raid', 'Level']);
    expect(setToolPinned(layout(), 'Gacha', false).pinnedTools).toEqual(['Planner', 'Bond', 'Raid']);
    expect(toggleTool(layout(), 'Raid').pinnedTools).toEqual(['Planner', 'Gacha', 'Bond']);
  });

  it('stops at the cap and ignores unknown tools', () => {
    const full = layout({ pinnedTools: PINNABLE_TOOLS.slice(0, MAX_PINNED_TOOLS) });
    expect(canPinMoreTools(full)).toBe(false);
    expect(setToolPinned(full, PINNABLE_TOOLS[MAX_PINNED_TOOLS], true)).toBe(full);
    const fresh = layout();
    expect(setToolPinned(fresh, 'Teleporter' as never, true)).toBe(fresh);
    expect(setToolPinned(fresh, 'Planner', true)).toBe(fresh);
  });
});

describe('isDefaultHomeLayout', () => {
  it('notices any change', () => {
    expect(isDefaultHomeLayout(moveWidgetDown(layout(), 'resources'))).toBe(false);
    expect(isDefaultHomeLayout(toggleWidget(layout(), 'tools'))).toBe(false);
    expect(isDefaultHomeLayout(toggleTool(layout(), 'Raid'))).toBe(false);
    expect(isDefaultHomeLayout(normalizeHomeLayout(JSON.parse(JSON.stringify(layout()))))).toBe(true);
  });
});

describe('homeAdSlot', () => {
  it('follows the third widget when it does not end in a button', () => {
    expect(homeAdSlot(['resources', 'recruitment', 'happening', 'comingUp'])).toBe(2);
  });

  it('skips widgets that end in a button', () => {
    expect(homeAdSlot(['resources', 'happening', 'recruitment', 'tools', 'comingUp'])).toBe(4);
  });

  it('falls back to the last widget on a short Home', () => {
    expect(homeAdSlot(['recruitment', 'tools'])).toBe(1);
    expect(homeAdSlot(['resources'])).toBe(0);
  });
});
