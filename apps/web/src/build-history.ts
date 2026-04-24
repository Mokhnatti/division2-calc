import { encodeBuild, applyUrlToBuild } from './build-url.js';
import type { BuildState } from './build-state.svelte.js';

const KEY = 'divcalc:history';
const MAX_SLOTS = 10;

export interface SavedBuild {
  name: string;
  url: string; // encoded build URL
  at: number; // timestamp
}

export function loadHistory(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedBuild[];
    return Array.isArray(arr) ? arr.slice(0, MAX_SLOTS) : [];
  } catch {
    return [];
  }
}

export function saveBuildToHistory(build: BuildState, name: string): SavedBuild[] {
  const list = loadHistory();
  const entry: SavedBuild = {
    name: name || `Build ${new Date().toLocaleDateString()}`,
    url: encodeBuild(build),
    at: Date.now(),
  };
  const out = [entry, ...list.filter((s) => s.name !== entry.name)].slice(0, MAX_SLOTS);
  try { localStorage.setItem(KEY, JSON.stringify(out)); } catch { /* ignore */ }
  return out;
}

export function loadBuildFromHistory(build: BuildState, saved: SavedBuild): void {
  const params = new URLSearchParams(saved.url);
  build.reset();
  applyUrlToBuild(build, params);
}

export function deleteBuildFromHistory(name: string): SavedBuild[] {
  const list = loadHistory().filter((s) => s.name !== name);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}
