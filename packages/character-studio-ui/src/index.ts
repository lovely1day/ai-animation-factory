// ============================================================
// @ai-animation-factory/character-studio-ui
// Reusable React components for Character Studio
// ============================================================

// Hook
export { useCharacterBuilder } from "./hooks/useCharacterBuilder";
export type { UseCharacterBuilder, CharacterState, CharacterTab } from "./hooks/useCharacterBuilder";

// Shared components
export { SegmentSelector } from "./components/shared/SegmentSelector";
export { GenderToggle } from "./components/shared/GenderToggle";

// Core components
export { LivingCanvas } from "./components/LivingCanvas";
export { PromptGuide } from "./components/PromptGuide";

// Tabs
export { FaceTab } from "./components/tabs/FaceTab";
export { EyeTab } from "./components/tabs/EyeTab";
export { HairTab } from "./components/tabs/HairTab";
export { SkinTab } from "./components/tabs/SkinTab";
export { BodyTab } from "./components/tabs/BodyTab";
export { JawTab } from "./components/tabs/JawTab";
export { EraTab } from "./components/tabs/EraTab";
export { MakeupTab } from "./components/tabs/MakeupTab";
export { WardrobeTab } from "./components/tabs/WardrobeTab";
