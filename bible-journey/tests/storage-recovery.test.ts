import assert from "node:assert/strict";
import test from "node:test";
import { newGame, transition, restore } from "../src/game";
import {
  LEGACY_STORAGE_KEY,
  THREE_GROUP_STORAGE_KEY,
  RECOVERY_BACKUP_PREFIX,
  STORAGE_KEY,
  loadSavedGame,
  recoverSavedGame,
  type ReadableStoragePort,
} from "../src/storage";

function memory(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const writes: string[] = [];
  const storage: ReadableStoragePort = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { writes.push(key); values.set(key, value); },
  };
  return { storage, values, writes };
}

test("missing and valid saves load without writes, retaining all age wallets", async () => {
  const empty = memory();
  assert.deepEqual(await loadSavedGame(empty.storage, []), { kind: "ready", game: newGame() });
  const game = newGame();
  game.tier = "c";
  game.profiles.a.tokens = 11;
  game.profiles.b.tokens = 23;
  game.profiles.c.tokens = 37;
  const saved = memory({ [STORAGE_KEY]: JSON.stringify(game) });
  assert.deepEqual(await loadSavedGame(saved.storage, []), { kind: "ready", game });
  assert.deepEqual([...empty.writes, ...saved.writes], []);
});

test("malformed JSON, invalid schemas, and empty stored strings remain intact as corrupt saves", async () => {
  for (const raw of ['{"version":3,"profiles":', '{"version":3}', 'null', '']) {
    const { storage, values, writes } = memory({ [STORAGE_KEY]: raw });
    assert.deepEqual(await loadSavedGame(storage, []), { kind: "corrupt", save: { key: STORAGE_KEY, raw } });
    assert.equal(values.get(STORAGE_KEY), raw);
    assert.deepEqual(writes, []);
  }
});

test("storage access rejection is retryable and never offered as corrupt data", async () => {
  const { storage, writes } = memory();
  const getItem = storage.getItem;
  storage.getItem = async () => { throw Error("Temporarily unavailable"); };
  assert.deepEqual(await loadSavedGame(storage, []), { kind: "read" });
  storage.getItem = getItem;
  assert.equal((await loadSavedGame(storage, [])).kind, "ready");
  assert.deepEqual(writes, []);
});

test("confirmed recovery verifies an exact backup before replacing the active save and preserves prior backups", async t => {
  t.mock.method(Date, "now", () => 12345);
  const raw = '{"version":3,"profiles":';
  const priorKey = `${RECOVERY_BACKUP_PREFIX}12345`;
  const { storage, values, writes } = memory({ [STORAGE_KEY]: raw, [priorKey]: "older backup" });
  const recovered = await recoverSavedGame(storage, { key: STORAGE_KEY, raw });
  assert.deepEqual(recovered, newGame());
  assert.equal(values.get(priorKey), "older backup");
  assert.equal(values.get(`${priorKey}:1`), raw);
  assert.deepEqual(writes, [`${priorKey}:1`, STORAGE_KEY]);
  assert.deepEqual(await loadSavedGame(storage, []), { kind: "ready", game: recovered });
});

test("backup write failure or unverifiable backup cannot replace the corrupt save", async () => {
  for (const silent of [false, true]) {
    const raw = "{broken";
    const { storage, values, writes } = memory({ [STORAGE_KEY]: raw });
    storage.setItem = async key => {
      writes.push(key);
      if (!silent) throw Error("Quota exceeded");
    };
    await assert.rejects(recoverSavedGame(storage, { key: STORAGE_KEY, raw }));
    assert.equal(values.get(STORAGE_KEY), raw);
    assert.ok(writes.length === 1 && writes[0]!.startsWith(RECOVERY_BACKUP_PREFIX));
  }
});

test("failure to write the new game leaves both the original and its backup available", async () => {
  const raw = "{broken";
  const { storage, values } = memory({ [STORAGE_KEY]: raw });
  const write = storage.setItem;
  storage.setItem = async (key, value) => {
    if (key === STORAGE_KEY) throw Error("Quota exceeded");
    return write(key, value);
  };
  await assert.rejects(recoverSavedGame(storage, { key: STORAGE_KEY, raw }));
  assert.equal(values.get(STORAGE_KEY), raw);
  assert.ok([...values.entries()].some(([key, value]) => key.startsWith(RECOVERY_BACKUP_PREFIX) && value === raw));
});

test("recovery refuses a save changed since diagnosis or changed while backing up", async () => {
  const raw = "{broken", replacement = JSON.stringify(newGame());
  const changed = memory({ [STORAGE_KEY]: replacement });
  await assert.rejects(recoverSavedGame(changed.storage, { key: STORAGE_KEY, raw }));
  assert.deepEqual(changed.writes, []);
  assert.equal(changed.values.get(STORAGE_KEY), replacement);

  const racing = memory({ [STORAGE_KEY]: raw });
  const write = racing.storage.setItem;
  racing.storage.setItem = async (key, value) => {
    await write(key, value);
    if (key.startsWith(RECOVERY_BACKUP_PREFIX)) racing.values.set(STORAGE_KEY, replacement);
  };
  await assert.rejects(recoverSavedGame(racing.storage, { key: STORAGE_KEY, raw }));
  assert.equal(racing.values.get(STORAGE_KEY), replacement);
  assert.ok(!racing.writes.includes(STORAGE_KEY));
});

test("legacy corrupt recovery preserves the legacy source and will not overwrite a newly created save", async () => {
  const raw = "{legacy-broken";
  const legacy = memory({ [LEGACY_STORAGE_KEY]: raw });
  assert.deepEqual(await loadSavedGame(legacy.storage, []), { kind: "corrupt", save: { key: LEGACY_STORAGE_KEY, raw } });
  await recoverSavedGame(legacy.storage, { key: LEGACY_STORAGE_KEY, raw });
  assert.equal(legacy.values.get(LEGACY_STORAGE_KEY), raw);
  assert.equal((await loadSavedGame(legacy.storage, [])).kind, "ready");
  const replacement = JSON.stringify(newGame());
  const changed = memory({ [LEGACY_STORAGE_KEY]: raw, [STORAGE_KEY]: replacement });
  await assert.rejects(recoverSavedGame(changed.storage, { key: LEGACY_STORAGE_KEY, raw }));
  assert.deepEqual(changed.writes, []);
  assert.equal(changed.values.get(STORAGE_KEY), replacement);
});

test("players assign the old school-age wallet once and keep independent saves thereafter", async () => {
  const old = newGame();
  old.profiles.b.tokens = 31;
  const { a, b, c } = old.profiles;
  const raw = JSON.stringify({ version: 3, tier: "b", profiles: { a, b, c } });
  for (const tier of ["b", "teen"] as const) {
    const { storage, values } = memory({ [THREE_GROUP_STORAGE_KEY]: raw });
    const loaded = await loadSavedGame(storage, []);
    assert.equal(loaded.kind, "ready");
    if (loaded.kind !== "ready") throw Error("Missing school profile");
    assert.equal(loaded.game.pendingSchoolSplit, true);
    const choose = { type: "assign-school-profile", tier } as const;
    const assigned = transition(loaded.game, choose, []);
    assert.equal(assigned.profiles[tier].tokens, 31);
    assert.equal(assigned.profiles[tier === "b" ? "teen" : "b"].tokens, 3);
    assert.equal(assigned.pendingSchoolSplit, undefined);
    assert.equal(transition(assigned, choose, []), assigned);
    await storage.setItem(STORAGE_KEY, JSON.stringify(assigned));
    assert.deepEqual(await loadSavedGame(storage, []), { kind: "ready", game: assigned });
    assert.equal(values.get(THREE_GROUP_STORAGE_KEY), raw);
  }
  assert.equal(restore(JSON.stringify({ version: 3, tier: "a", profiles: { a, b: newGame().profiles.b, c } }), []).pendingSchoolSplit, undefined);
});
