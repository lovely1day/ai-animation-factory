// ============================================================
// useCharacterBuilder — React Hook
// Version: 1.0.0
//
// Manages the full character builder state:
//   segments (DNA keys), activeTab, isDirty, saved profiles
//
// Usage:
//   const cb = useCharacterBuilder();
//   cb.setSegment("FS", "FS001");
//   cb.setGender("F");
//   const dnaString = cb.exportDNA();
// ============================================================

import { useState, useCallback, useRef } from "react";
import {
  type CharacterBuilderState,
  type CharacterBuilderSegments,
  type DNASegmentKey,
  type Code,
  type GenderCode,
  type EraCode,
  type CharacterDNAProfile,
} from "@ai-animation-factory/shared";
import {
  encodeDNA,
  decodeDNA,
  segmentsToDNA,
  dnaToSegments,
  setDNASegment,
  removeDNASegment,
  diffDNA,
} from "@ai-animation-factory/shared";

// ─── INITIAL STATE ─────────────────────────────────────────

const EMPTY_SEGMENTS: CharacterBuilderSegments = {};

function makeInitialState(overrides?: Partial<CharacterBuilderState>): CharacterBuilderState {
  return {
    id: undefined,
    name: "",
    segments: { ...EMPTY_SEGMENTS },
    activeTab: "face",
    isDirty: false,
    ...overrides,
  };
}

// ─── HOOK RETURN TYPE ──────────────────────────────────────

export interface UseCharacterBuilder {
  // ── State (read-only) ──────────────────────────────────
  state: CharacterBuilderState;
  segments: CharacterBuilderSegments;
  activeTab: CharacterBuilderState["activeTab"];
  isDirty: boolean;
  name: string;

  // ── Segment mutations ──────────────────────────────────
  setSegment: (key: DNASegmentKey, value: Code) => void;
  removeSegment: (key: DNASegmentKey) => void;
  setGender: (gender: GenderCode) => void;
  setEra: (era: EraCode) => void;
  setHeight: (cm: number) => void;

  // ── Tab navigation ─────────────────────────────────────
  setActiveTab: (tab: CharacterBuilderState["activeTab"]) => void;

  // ── Name ───────────────────────────────────────────────
  setName: (name: string) => void;

  // ── DNA import / export ────────────────────────────────
  exportDNA: () => string;
  loadFromDNA: (raw: string) => void;

  // ── Persistence ────────────────────────────────────────
  reset: () => void;
  markClean: () => void;

  // ── Computed ───────────────────────────────────────────
  hasSegment: (key: DNASegmentKey) => boolean;
  getSegment: (key: DNASegmentKey) => Code | undefined;
  changedSegments: () => DNASegmentKey[];

  // ── History (undo/redo) ────────────────────────────────
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

// ─── HOOK ──────────────────────────────────────────────────

export function useCharacterBuilder(
  initial?: Partial<CharacterBuilderState>
): UseCharacterBuilder {
  const [state, setState] = useState<CharacterBuilderState>(() =>
    makeInitialState(initial)
  );

  // ── Undo / Redo history ────────────────────────────────
  // Each entry is a CharacterBuilderSegments snapshot
  const historyRef = useRef<CharacterBuilderSegments[]>([{ ...EMPTY_SEGMENTS }]);
  const historyIndexRef = useRef<number>(0);

  const pushHistory = useCallback((segments: CharacterBuilderSegments) => {
    // Drop redo stack when new action is taken
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ ...segments });
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  // ── Segment mutations ──────────────────────────────────

  const setSegment = useCallback(
    (key: DNASegmentKey, value: Code) => {
      setState((prev) => {
        const updated: CharacterBuilderSegments = { ...prev.segments, [key]: value };
        pushHistory(updated);
        return { ...prev, segments: updated, isDirty: true };
      });
    },
    [pushHistory]
  );

  const removeSegment = useCallback(
    (key: DNASegmentKey) => {
      setState((prev) => {
        const updated = { ...prev.segments };
        delete updated[key as keyof CharacterBuilderSegments];
        pushHistory(updated);
        return { ...prev, segments: updated, isDirty: true };
      });
    },
    [pushHistory]
  );

  const setGender = useCallback(
    (gender: GenderCode) => setSegment("G", gender),
    [setSegment]
  );

  const setEra = useCallback(
    (era: EraCode) => setSegment("ERA", era),
    [setSegment]
  );

  const setHeight = useCallback(
    (cm: number) => setSegment("HT", String(cm)),
    [setSegment]
  );

  // ── Tab navigation ─────────────────────────────────────

  const setActiveTab = useCallback(
    (tab: CharacterBuilderState["activeTab"]) => {
      setState((prev) => ({ ...prev, activeTab: tab }));
    },
    []
  );

  // ── Name ───────────────────────────────────────────────

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name, isDirty: true }));
  }, []);

  // ── DNA import / export ────────────────────────────────

  const exportDNA = useCallback((): string => {
    return segmentsToDNA(state.segments);
  }, [state.segments]);

  const loadFromDNA = useCallback(
    (raw: string) => {
      const segments = dnaToSegments(raw);
      pushHistory(segments);
      setState((prev) => ({
        ...prev,
        segments,
        isDirty: false,
      }));
    },
    [pushHistory]
  );

  // ── Persistence ────────────────────────────────────────

  const reset = useCallback(() => {
    const empty = { ...EMPTY_SEGMENTS };
    historyRef.current = [empty];
    historyIndexRef.current = 0;
    setState(makeInitialState());
  }, []);

  const markClean = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  // ── Computed helpers ───────────────────────────────────

  const hasSegment = useCallback(
    (key: DNASegmentKey): boolean =>
      state.segments[key as keyof CharacterBuilderSegments] !== undefined,
    [state.segments]
  );

  const getSegment = useCallback(
    (key: DNASegmentKey): Code | undefined =>
      state.segments[key as keyof CharacterBuilderSegments] as Code | undefined,
    [state.segments]
  );

  // Returns which keys differ from the initial/saved DNA
  const savedDNARef = useRef<string>(segmentsToDNA(EMPTY_SEGMENTS));

  const changedSegments = useCallback((): DNASegmentKey[] => {
    const currentDNA = segmentsToDNA(state.segments);
    return diffDNA(savedDNARef.current, currentDNA);
  }, [state.segments]);

  // ── Undo / Redo ────────────────────────────────────────

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const segments = { ...historyRef.current[historyIndexRef.current] };
    setState((prev) => ({ ...prev, segments, isDirty: true }));
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const segments = { ...historyRef.current[historyIndexRef.current] };
    setState((prev) => ({ ...prev, segments, isDirty: true }));
  }, []);

  // ── Return ─────────────────────────────────────────────

  return {
    state,
    segments: state.segments,
    activeTab: state.activeTab,
    isDirty: state.isDirty,
    name: state.name,
    setSegment,
    removeSegment,
    setGender,
    setEra,
    setHeight,
    setActiveTab,
    setName,
    exportDNA,
    loadFromDNA,
    reset,
    markClean,
    hasSegment,
    getSegment,
    changedSegments,
    canUndo,
    canRedo,
    undo,
    redo,
  };
}
