import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  defaultHomeLayout,
  moveWidget,
  setToolPinned,
  setWidgetVisible,
  visibleWidgets,
  type HomeLayout,
  type HomeWidgetId,
  type PinnableTool,
} from '@/services/home/layout';
import { homeLayoutStore } from '@/services/userdata/homeLayout';
import { usePersistentState } from '@/services/userdata/usePersistentState';

/**
 * How long Home waits for the saved layout before drawing the default one.
 * The read normally lands in a frame or two; holding the widgets back that
 * long avoids a visible reshuffle on launch, and the cap keeps a stalled
 * storage module from leaving Home blank. Edits made in the meantime are
 * replayed onto the stored layout, so nothing is clobbered either way.
 */
const SETTLE_MS = 400;

export interface HomeLayoutApi {
  layout: HomeLayout;
  /** Widgets to render, top to bottom. */
  visible: HomeWidgetId[];
  /** False only during the brief initial read (see SETTLE_MS). */
  settled: boolean;
  move: (id: HomeWidgetId, delta: -1 | 1) => void;
  setVisible: (id: HomeWidgetId, visible: boolean) => void;
  setPinned: (tool: PinnableTool, pinned: boolean) => void;
  reset: () => void;
}

/** The Home screen's layout. One owner: mount it in the Home screen only. */
export function useHomeLayout(): HomeLayoutApi {
  const { value, ready, update } = usePersistentState(homeLayoutStore);
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setWaited(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [ready]);

  const move = useCallback((id: HomeWidgetId, delta: -1 | 1) => update(prev => moveWidget(prev, id, delta)), [update]);
  const setVisible = useCallback((id: HomeWidgetId, visible: boolean) => update(prev => setWidgetVisible(prev, id, visible)), [update]);
  const setPinned = useCallback((tool: PinnableTool, pinned: boolean) => update(prev => setToolPinned(prev, tool, pinned)), [update]);
  const reset = useCallback(() => update(() => defaultHomeLayout()), [update]);
  const visible = useMemo(() => visibleWidgets(value), [value]);

  return { layout: value, visible, settled: ready || waited, move, setVisible, setPinned, reset };
}
