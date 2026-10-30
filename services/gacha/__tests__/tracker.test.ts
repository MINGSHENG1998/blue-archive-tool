import AsyncStorage from '@react-native-async-storage/async-storage';
import { addTrackedPulls, emptyTracker, normalizeTracker, trackerCharges, trackerStore, undoTrackedPull } from '../tracker';

describe('tracker v2', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });
  it('migrates the validated old history without deleting the original', async () => {
    await AsyncStorage.setItem('gacha:v1:session', JSON.stringify({ history: ['miss', 'no', 'pickup', 'miss'] }));
    const loaded = await trackerStore.load();
    expect(loaded.value.history.map(p => p.kind)).toEqual(['miss', 'pickup', 'miss']);
    expect(trackerCharges(loaded.value)).toEqual({ standard: 0, limited: 0 });
    expect(await AsyncStorage.getItem('gacha:v1:session')).not.toBeNull();
  });
  it('prefers v2 even when its history is empty', async () => {
    await AsyncStorage.setItem('gacha:v1:session', JSON.stringify({ history: ['miss'] }));
    await trackerStore.save(emptyTracker());
    expect((await trackerStore.load()).value.history).toEqual([]);
  });
  it('resets only the pickup pool and undo restores its previous charge', () => {
    let state = { ...emptyTracker(), initialCharges: { standard: 95, limited: 12 } };
    state = addTrackedPulls(state, 'threeStar', 'standard');
    state = addTrackedPulls(state, 'pickup', 'limited');
    expect(trackerCharges(state)).toEqual({ standard: 96, limited: 0 });
    expect(trackerCharges(undoTrackedPull(state))).toEqual({ standard: 96, limited: 12 });
  });
  it('ignores invalid persisted events and invalid bulk counts', () => {
    expect(normalizeTracker({ history: [{ kind: 'miss', pool: 'standard' }, { kind: 'bad', pool: 'limited' }, null] }).history).toHaveLength(1);
    expect(addTrackedPulls(emptyTracker(), 'miss', 'standard', Infinity).history).toHaveLength(0);
  });
  it('keeps legacy spark pulls out of the charge buckets', () => {
    let state = addTrackedPulls(emptyTracker(), 'miss', 'standard', 10, 'spark');
    state = addTrackedPulls(state, 'miss', 'limited', 1, 'charge');
    expect(trackerCharges(state)).toEqual({ standard: 0, limited: 1 });
  });
  it('does not write after a failed v2 read', async () => {
    // AsyncStorage's methods are already jest.fn; mockRestore would erase
    // their storage implementation and corrupt the following test's setup.
    const read = jest.spyOn(AsyncStorage, 'getItem');
    const original = read.getMockImplementation()!;
    read.mockRejectedValue(new Error('disk'));
    const write = jest.mocked(AsyncStorage.setItem);
    write.mockClear();
    try {
      expect((await trackerStore.load()).writable).toBe(false);
      expect(write).not.toHaveBeenCalled();
    } finally {
      read.mockImplementation(original);
    }
  });
  it('recovers corrupt v2 from v1 and makes the migration durable', async () => {
    await AsyncStorage.setItem('gacha:v2', 'bad JSON');
    await AsyncStorage.setItem('gacha:v1:session', JSON.stringify({ history: ['threeStar', 'miss'] }));
    const first = await trackerStore.load();
    const second = await trackerStore.load();
    expect(second.value).toEqual(first.value);
    expect(second.value.history).toHaveLength(2);
    expect(await AsyncStorage.getItem('gacha:v1:session')).not.toBeNull();
  });
  it('crosses 100 and 200 without resetting on a non-pickup 3 star', () => {
    let state = { ...emptyTracker(), initialCharges: { standard: 99, limited: 199 } };
    state = addTrackedPulls(state, 'threeStar', 'standard');
    state = addTrackedPulls(state, 'threeStar', 'limited');
    expect(trackerCharges(state)).toEqual({ standard: 100, limited: 200 });
    state = addTrackedPulls(state, 'pickup', 'standard');
    expect(trackerCharges(state)).toEqual({ standard: 0, limited: 200 });
  });
});
