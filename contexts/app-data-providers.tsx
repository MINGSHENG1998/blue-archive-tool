import React from "react";

import { AppConfigProvider } from "@/contexts/app-config-context";
import { BannersProvider } from "@/contexts/banners-context";
import { UserDataProvider } from "@/contexts/user-data-context";

/**
 * The 2.0 data planes in one wrapper: the Firestore banner schedule, the
 * remote app config, and on-device user data. None of them reads another
 * context, so they can sit anywhere inside the root layout; each renders its
 * children immediately (no loading gate) and never throws on bad data.
 */
export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return (
    <BannersProvider>
      <AppConfigProvider>
        <UserDataProvider>{children}</UserDataProvider>
      </AppConfigProvider>
    </BannersProvider>
  );
}
