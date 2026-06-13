import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme } from "../theme-context";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

let captured: ReturnType<typeof useTheme>;
function Capture() {
  captured = useTheme();
  return null;
}

async function renderProvider() {
  await act(async () => {
    TestRenderer.create(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>
    );
  });
  // flush the AsyncStorage.getItem().then(...) microtask
  await act(async () => {});
}

describe("ThemeProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("defaults to baBlue when nothing stored", async () => {
    await renderProvider();
    expect(captured.themeId).toBe("baBlue");
    expect(captured.theme.tokens.primaryColor).toBe("#128AFA");
  });

  it("loads a valid persisted themeId", async () => {
    await AsyncStorage.setItem("app_theme_id", "cafe");
    await renderProvider();
    expect(captured.themeId).toBe("cafe");
  });

  it("falls back to baBlue for an invalid persisted id", async () => {
    await AsyncStorage.setItem("app_theme_id", "not-a-theme");
    await renderProvider();
    expect(captured.themeId).toBe("baBlue");
  });

  it("setThemeId updates and persists", async () => {
    await renderProvider();
    await act(async () => {
      captured.setThemeId("sea");
    });
    expect(captured.themeId).toBe("sea");
    expect(await AsyncStorage.getItem("app_theme_id")).toBe("sea");
  });
});
