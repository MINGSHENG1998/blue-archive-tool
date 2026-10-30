import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Clocks stop on hidden tabs and catch up as soon as the app returns. */
export function useFocusedNow(interval = 30000) {
  const focused = useIsFocused();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!focused) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, interval);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') tick(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [focused, interval]);
  return now;
}
