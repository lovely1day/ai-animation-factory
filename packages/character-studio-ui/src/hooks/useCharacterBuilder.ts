import { useState, useCallback } from "react";
import type {
  DNASegmentKey,
  GenderCode,
  CharacterBuilderSegments,
} from "@ai-animation-factory/shared";
import { encodeDNA, dnaToSegments } from "@ai-animation-factory/shared";

export type CharacterTab =
  | "face" | "eye" | "hair" | "skin"
  | "body" | "jaw" | "era" | "makeup" | "wardrobe";

export interface CharacterState {
  id?: string;
  name: string;
  isDirty: boolean;
}

export interface UseCharacterBuilder {
  segments: CharacterBuilderSegments;
  activeTab: CharacterTab;
  isDirty: boolean;
  name: string;
  id: string | undefined;
  state: CharacterState;

  getSegment: (key: DNASegmentKey) => string | undefined;
  setName: (name: string) => void;
  setSegment: (key: DNASegmentKey, value: string) => void;
  removeSegment: (key: DNASegmentKey) => void;
  setGender: (g: GenderCode) => void;
  setActiveTab: (tab: CharacterTab) => void;

  exportDNA: () => string;
  loadDNA: (dna: string) => void;

  markClean: () => void;
  loadFromSaved: (id: string, savedName: string, dna: string) => void;
  reset: () => void;
  resetAll: () => void;
}

const DEFAULT_GENDER: GenderCode = "M";

export function useCharacterBuilder(): UseCharacterBuilder {
  const [segments, setSegments] = useState<CharacterBuilderSegments>({ G: DEFAULT_GENDER });
  const [name, setNameState] = useState("");
  const [id, setId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTabState] = useState<CharacterTab>("face");
  const [isDirty, setIsDirty] = useState(false);

  const setName = useCallback((newName: string) => {
    setNameState(newName);
    setIsDirty(true);
  }, []);

  const getSegment = useCallback((key: DNASegmentKey): string | undefined => {
    return segments[key];
  }, [segments]);

  const setSegment = useCallback((key: DNASegmentKey, value: string) => {
    setSegments(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const removeSegment = useCallback((key: DNASegmentKey) => {
    setSegments(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setIsDirty(true);
  }, []);

  const setGender = useCallback((g: GenderCode) => {
    setSegments(prev => ({ ...prev, G: g }));
    setIsDirty(true);
  }, []);

  const setActiveTab = useCallback((tab: CharacterTab) => {
    setActiveTabState(tab);
  }, []);

  const exportDNA = useCallback(() => {
    return encodeDNA({ version: "v1", segments });
  }, [segments]);

  const loadDNA = useCallback((dna: string) => {
    const parsed = dnaToSegments(dna);
    setSegments(parsed);
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const loadFromSaved = useCallback((charId: string, savedName: string, dna: string) => {
    setId(charId);
    setNameState(savedName);
    const parsed = dnaToSegments(dna);
    setSegments(parsed);
    setIsDirty(false);
  }, []);

  const resetAll = useCallback(() => {
    setSegments({ G: DEFAULT_GENDER });
    setNameState("");
    setId(undefined);
    setActiveTabState("face");
    setIsDirty(false);
  }, []);

  return {
    segments, activeTab, isDirty, name, id,
    state: { id, name, isDirty },
    getSegment, setName, setSegment, removeSegment, setGender, setActiveTab,
    exportDNA, loadDNA,
    markClean, loadFromSaved, reset: resetAll, resetAll,
  };
}
