import type { ReactNode } from "react";

import { NavBar } from "@/components/schale/NavBar";

/**
 * 1.x name for the stack-screen header, kept so existing screens keep
 * compiling. It now renders the Schale NavBar (round ink back disc, title on
 * the yellow underline). New code should import NavBar directly.
 */
export function StackScreenHeader(props: {
  title: string;
  subtitle?: string;
  right?: ReactNode | ReactNode[];
  onBack?: () => void;
}) {
  return <NavBar {...props} />;
}
