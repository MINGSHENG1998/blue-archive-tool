// Like @react-navigation's useIsFocused, but safe outside a navigator (tests,
// the root layout, a Modal portal): with no navigation object the screen is
// treated as focused. Ambient loops (halo orbit, LIVE pulse, shimmer) pause on
// blur so a backgrounded tab does not keep the UI thread busy.

import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";

export function useScreenFocused(): boolean {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => navigation?.isFocused() ?? true);

  useEffect(() => {
    if (!navigation) return;
    setFocused(navigation.isFocused());
    const offFocus = navigation.addListener("focus", () => setFocused(true));
    const offBlur = navigation.addListener("blur", () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);

  return focused;
}
