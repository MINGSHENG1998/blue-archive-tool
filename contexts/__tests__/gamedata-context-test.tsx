import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { GameDataProvider, useGameData } from "../gamedata-context";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// The provider wraps the entire app, so its failure modes matter more than its
// happy path: whatever upstream or storage does, every screen must still get a
// usable roster. Network calls are stubbed to reject unless a test says
// otherwise — a test run must never touch schaledb.com.
jest.mock("../../services/gamedata/schaledb", () => ({
  ...jest.requireActual("../../services/gamedata/schaledb"),
  fetchConfig: jest.fn().mockRejectedValue(new Error("offline")),
  fetchStudents: jest.fn().mockRejectedValue(new Error("offline")),
  fetchNameMap: jest.fn().mockRejectedValue(new Error("offline")),
  fetchLocalization: jest.fn().mockRejectedValue(new Error("offline")),
}));

let captured: ReturnType<typeof useGameData>;
function Capture() {
  captured = useGameData();
  return null;
}

async function renderProvider() {
  await act(async () => {
    TestRenderer.create(
      <GameDataProvider>
        <Capture />
      </GameDataProvider>,
    );
  });
  // flush the cache read and the background refresh
  await act(async () => {});
  await act(async () => {});
}

describe("GameDataProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("serves the bundled roster on a cold, offline first launch", async () => {
    await renderProvider();
    expect(captured.students.length).toBeGreaterThan(200);
    expect(captured.source).toBe("bundled");
    expect(captured.ready).toBe(true);
  });

  it("indexes students by id", async () => {
    await renderProvider();
    const first = captured.students[0];
    expect(captured.byId[first.Id]).toBe(first);
  });

  it("still renders when storage itself throws", async () => {
    const getItem = jest
      .spyOn(AsyncStorage, "getItem")
      .mockRejectedValue(new Error("storage unavailable"));
    await renderProvider();
    expect(captured.students.length).toBeGreaterThan(200);
    expect(captured.ready).toBe(true);
    getItem.mockRestore();
  });

  it("falls back to the English name, then the raw key, for labels", async () => {
    await renderProvider();
    // Present in the bundled snapshot.
    expect(captured.label("School", "Gehenna")).toBe("Gehenna");
    // A key SchaleDB has not shipped yet must render as itself, not "undefined".
    expect(captured.label("School", "NotAThing")).toBe("NotAThing");
  });

  it("gives every student a display name", async () => {
    await renderProvider();
    for (const student of captured.students) {
      expect(captured.displayName(student).length).toBeGreaterThan(0);
    }
  });

  it("survives a failed manual refresh", async () => {
    await renderProvider();
    const before = captured.students.length;
    await act(async () => {
      await captured.refresh();
    });
    expect(captured.students).toHaveLength(before);
  });
});
