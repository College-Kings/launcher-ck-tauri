import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { Settings } from '../types/settings';
import type { GameVersion, StatusMessage } from '../App';
import { emit } from '@tauri-apps/api/event';

interface AppState {
  // Config-derived state
  fullName: string;
  accessToken: string;
  expirationDate: string;
  email: string;
  gameVersion: number;
  gameVersionUser: number;
  downloadPathCk1: string;
  downloadPathCk2: string;
  lastSelectedGame: boolean;
  freeGameVersionUser: number;
  freeGameVersion: number;
  membership: string;

  // UI State
  isLoading: boolean;
  error: string | null;
  isSettingsOpen: boolean;
  isUserModalOpen: boolean;
  selectedGame: GameVersion;
  selectedMirror: number;
  downloadProgress: number | undefined;
  statusMessage: StatusMessage | undefined;

  // Raw config (can be used if needed)
  rawConfig: Settings | undefined;

  // Actions
  loadConfig: () => Promise<void>;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsUserModalOpen: (isOpen: boolean) => void;
  setSelectedGame: (game: GameVersion) => void;
  setSelectedMirror: (mirror: number) => void;
  setDownloadProgress: (progress: number | undefined) => void;
  setStatusMessage: (message: StatusMessage | undefined) => void;
  clearStatusMessage: () => void;
  setDownloadPathCk1: (path: string) => void;
  setDownloadPathCk2: (path: string) => void;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (isOpen: boolean) => void;
  setFreeGameVersionUser: (version: number) => void;
  setGameVersionUser: (version: number) => void;
  checkLatestVersions: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Config-derived state with defaults
  fullName: '',
  accessToken: '',
  expirationDate: '',
  email: '',
  gameVersion: 0,
  gameVersionUser: 0,
  downloadPathCk1: '',
  downloadPathCk2: '',
  lastSelectedGame: false,
  freeGameVersionUser: 0,
  freeGameVersion: 0,
  membership: '',
  
  // UI State
  isLoading: true,
  error: null,
  isSettingsOpen: false,
  isUserModalOpen: false,
  selectedGame: "CK1",
  selectedMirror: 1,
  downloadProgress: undefined,
  statusMessage: undefined,
  rawConfig: undefined,
  isDownloadModalOpen: false,

  // Actions
  loadConfig: async () => {
    if (get().rawConfig !== undefined) {
      console.log('Config already loaded, skipping...');
      return;
    }

    try {
      console.log('Requesting config from Tauri...');
      const configData = await invoke<Settings>('get_config');
      
      set({
        rawConfig: configData,
        // Set individual fields from config
        fullName: configData.full_name,
        accessToken: configData.access_token,
        expirationDate: configData.expiration_date,
        email: configData.email,
        gameVersion: configData.game_version,
        gameVersionUser: configData.game_version_user,
        downloadPathCk1: configData.download_path_ck1,
        downloadPathCk2: configData.download_path_ck2,
        lastSelectedGame: configData.last_selected_game,
        freeGameVersionUser: configData.free_game_version_user,
        freeGameVersion: configData.free_game_version,
        membership: configData.membership,
        error: null,
        isLoading: false,
      });
      
      await emit('app-ready');
    } catch (err) {
      console.error('Failed to load config:', err);
      set({
        error: err instanceof Error ? err.toString() : 'Unknown error',
        isLoading: false,
      });
      
      await emit('app-ready');
    }
  },
  
  setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setIsUserModalOpen: (isOpen) => set({ isUserModalOpen: isOpen }),
  setSelectedGame: (game) => set({ selectedGame: game }),
  setSelectedMirror: (mirror) => set({ selectedMirror: mirror }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setStatusMessage: (message) => set({ statusMessage: message }),
  clearStatusMessage: () => set({ statusMessage: undefined }),
  setDownloadPathCk1: (path) => set({ downloadPathCk1: path }),
  setDownloadPathCk2: (path) => set({ downloadPathCk2: path }),
  setIsDownloadModalOpen: (isOpen) => set({ isDownloadModalOpen: isOpen }),
  setFreeGameVersionUser: (version) => set({ freeGameVersionUser: version }),
  setGameVersionUser: (version) => set({ gameVersionUser: version }),
  checkLatestVersions: async () => {
    try {
      const [ck1Version, ck2Version] = await invoke<[number, number]>('check_latest_version');
      set({
        freeGameVersion: ck1Version,
        gameVersion: ck2Version,
      });
    } catch (error) {
      console.error('Failed to check latest versions:', error);
    }
  },
})); 