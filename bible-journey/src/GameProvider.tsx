import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCharacters } from "./localizedCatalog";
import { catalogFor } from "./catalogs";
import { newGame, transition } from "./game";
import { createSaveQueue, loadSavedGame, recoverSavedGame, type CorruptSave } from "./storage";
import type { Action, Game } from "./types";

type Context = {
  game: Game;
  ready: boolean;
  error: "read" | "write" | "corrupt" | null;
  recoveryBusy: boolean;
  recoveryFailed: boolean;
  dispatch: (action: Action) => void;
  retry: () => void;
  recoverCorruptSave: () => void;
};
const GameContext = createContext<Context | null>(null);
export function GameProvider({ children }: React.PropsWithChildren) {
  const characters = useCharacters();
  const catalogRef = useRef(characters);
  catalogRef.current = characters;
  const [game, setGame] = useState(newGame);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Context["error"]>(null);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const current = useRef(game);
  const save = useRef(createSaveQueue(AsyncStorage));
  const failed = useRef(false);
  const corrupt = useRef<CorruptSave | null>(null);
  const recovering = useRef(false);
  const load = useCallback(async () => {
    if (recovering.current) return;
    const result = await loadSavedGame(AsyncStorage, catalogFor("en"));
    setRecoveryFailed(false);
    if (result.kind === "ready") {
      current.current = result.game;
      setGame(result.game);
      setReady(true);
      setError(null);
      failed.current = false;
      corrupt.current = null;
    } else {
      corrupt.current = result.kind === "corrupt" ? result.save : null;
      setError(result.kind);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const persist = useCallback((next: Game) => {
    void save.current(next).catch(() => {
      failed.current = true;
      setError("write");
    });
  }, []);
  const dispatch = useCallback(
    (action: Action) => {
      if (!ready || failed.current) return;
      const next = transition(current.current, action, catalogRef.current);
      if (next === current.current) return;
      current.current = next;
      setGame(next);
      persist(next);
    },
    [ready, persist],
  );
  const retry = useCallback(() => {
    if (error === "read" || error === "corrupt") {
      void load();
      return;
    }
    void save
      .current(current.current)
      .then(() => {
        failed.current = false;
        setError(null);
      })
      .catch(() => setError("write"));
  }, [error, load]);
  const recoverCorruptSave = useCallback(() => {
    if (error !== "corrupt" || !corrupt.current || recovering.current) return;
    recovering.current = true;
    setRecoveryBusy(true);
    setRecoveryFailed(false);
    void recoverSavedGame(AsyncStorage, corrupt.current).then(next => {
      current.current = next;
      setGame(next);
      setReady(true);
      setError(null);
      failed.current = false;
      corrupt.current = null;
    }).catch(() => {
      setRecoveryFailed(true);
    }).finally(() => {
      recovering.current = false;
      setRecoveryBusy(false);
    });
  }, [error]);
  return (
    <GameContext.Provider value={{ game, ready, error, recoveryBusy, recoveryFailed, dispatch, retry, recoverCorruptSave }}>
      {children}
    </GameContext.Provider>
  );
}
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("GameProvider missing");
  return context;
}
