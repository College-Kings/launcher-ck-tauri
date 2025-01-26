import { useEffect } from "react";
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { TopBar } from "./components/TopBar.tsx";
import { SideBar } from "./components/SideBar.tsx";
import { BottomBar } from "./components/BottomBar.tsx";
import { MainContent } from "./components/MainContent.tsx";
import { SettingsModal } from "./components/SettingsModal";
import { UserModal } from "./components/UserModal";
import { useAppStore } from "./stores/useAppStore";
import { invoke } from '@tauri-apps/api/core';
import "./index.css";
import { DownloadModal } from "./components/DownloadModal";
import { listen } from '@tauri-apps/api/event';
import { Settings } from "./types/settings.ts";

export type GameVersion = "CK1" | "CK2";

export type StatusMessage = {
  type: 'error' | 'success';
  text: string;
};

const getUserData = async (token: string) => {
  try {
    // Use the Tauri command instead of fetch
    const userData = await invoke('handle_login', { code: token });
    console.log('Login response:', userData);
    return userData;
  } catch (error) {
    console.error('Login Error:', error);
    return 'error';
  }
};

function App() {
  const {
    // Config values
    // fullName = useAppStore((state) => state.fullName);
    // accessToken = useAppStore((state) => state.accessToken);
    // expirationDate = useAppStore((state) => state.expirationDate);
    // email = useAppStore((state) => state.email);
    gameVersion,
    gameVersionUser,
    downloadPathCk1,
    downloadPathCk2,
    // lastSelectedGame = useAppStore((state) => state.lastSelectedGame);
    freeGameVersionUser,
    freeGameVersion,
    // membership = useAppStore((state) => state.membership);
    // UI state
    // isLoading = useAppStore((state) => state.isLoading);
    // error = useAppStore((state) => state.error);
    isSettingsOpen,
    isUserModalOpen,
    selectedGame,
    selectedMirror,
    downloadProgress,
    statusMessage,
    // rawConfig = useAppStore((state) => state.rawConfig);
    // Actions
    loadConfig,
    setIsSettingsOpen,
    setIsUserModalOpen,
    setSelectedGame,
    setSelectedMirror,
    setStatusMessage,
    // setDownloadPathCk1 = useAppStore((state) => state.setDownloadPathCk1);
    // setDownloadPathCk2 = useAppStore((state) => state.setDownloadPathCk2);
    isDownloadModalOpen,
    setIsDownloadModalOpen,
    setDownloadProgress,
    checkLatestVersions,
    // setFreeGameVersionUser = useAppStore((state) => state.setFreeGameVersionUser);
    // setGameVersionUser = useAppStore((state) => state.setGameVersionUser);
  } = useAppStore();

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    const init = async () => {
      await onOpenUrl(async (urls) => {
        console.log('Deep link URLs received:', urls);
        try {
          const rawUrl = urls[0];
          console.log('Raw URL:', rawUrl);
          
          // Clean up the URL format
          const cleanedUrl = rawUrl.replace('ck2-launcher://', 'ck2-launcher:/');
          console.log('Cleaned URL:', cleanedUrl);
          
          const url = new URL(cleanedUrl);
          console.log('Parsed URL components:', {
            protocol: url.protocol,
            pathname: url.pathname,
            search: url.search,
            searchParams: Array.from(url.searchParams.entries())
          });
          
          if (url.protocol === 'ck2-launcher:') {
            // Remove all leading and trailing slashes
            const cleanPath = url.pathname.replace(/^\/+|\/+$/g, '');
            console.log('Clean path:', cleanPath);
            
            if (cleanPath === 'login') {
              const code = url.searchParams.get('code');
              console.log('Raw code parameter:', code);
              if (code) {
                const userData = await getUserData(code);
                if (userData !== 'error') {
                  // Update app state
                  useAppStore.setState({
                    accessToken: userData.token.accessToken,
                    fullName: userData.fullName,
                    expirationDate: userData.token.exparationDate,
                    email: userData.email,
                    membership: userData.userMembershipType,
                  });

                  // Save to real config using Rust
                  await invoke('save_user_data', {
                    accessToken: userData.token.accessToken,
                    fullName: userData.fullName,
                    expirationDate: userData.token.exparationDate,
                    email: userData.email,
                    membership: userData.userMembershipType,
                  });

                  setStatusMessage({
                    type: 'success',
                    text: 'Login successful',
                  });
                } else {
                  setStatusMessage({
                    type: 'error',
                    text: 'Login failed',
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Detailed error parsing deep link URL:', error);
          console.error('URLs received:', urls);
          setStatusMessage({
            type: 'error',
            text: 'Invalid deep link URL',
          });
        }
      });
    };

    init();
  }, []);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        useAppStore.getState().clearStatusMessage();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    // Listen for download progress events
    const unlisten = listen('download-progress', (event) => {
      setDownloadProgress(event.payload as number);
    });

    // Listen for download completion
    const unlistenComplete = listen<[boolean, Settings]>('download-complete', (event) => {
      const [, updatedConfig] = event.payload; // Destructure the payload to get updatedConfig
      setDownloadProgress(100);
      
      // Update the entire app state with the new config
      useAppStore.setState({
        gameVersion: updatedConfig.game_version,
        gameVersionUser: updatedConfig.game_version_user,
        downloadPathCk1: updatedConfig.download_path_ck1,
        downloadPathCk2: updatedConfig.download_path_ck2,
        lastSelectedGame: updatedConfig.last_selected_game,
        freeGameVersionUser: updatedConfig.free_game_version_user,
        freeGameVersion: updatedConfig.free_game_version,
        membership: updatedConfig.membership,
        rawConfig: updatedConfig,
      });

      setTimeout(() => {
        setDownloadProgress(undefined);
        setStatusMessage({
          type: 'success',
          text: 'Download completed successfully!'
        });
      }, 500);
    });

    return () => {
      unlisten.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  }, []);

  useEffect(() => {
    // Check latest versions when app starts
    checkLatestVersions();
  }, []);

  useEffect(() => {
    // Listen for deep link events
    const unlisten = listen<string>('deep-link', (event) => {
      const url = event.payload;
      console.log('Received deep link:', url);
      // Handle the deep link URL as needed
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handlePlayClick = async () => {
    const currentPath = selectedGame === "CK1" ? downloadPathCk1 : downloadPathCk2;
    
    if (!currentPath) {
      setIsDownloadModalOpen(true);
      return;
    }

    if (downloadProgress === undefined) {
      const currentVersion = selectedGame === "CK1" ? freeGameVersionUser : gameVersionUser;
      const latestVersion = selectedGame === "CK1" ? freeGameVersion : gameVersion;

      if (currentVersion < latestVersion) {
        // Start download with game type
        try {
          await invoke('start_mock_download', { isCk1: selectedGame === "CK1" });
        } catch (error) {
          console.error('Failed to start download:', error);
          setStatusMessage({
            type: 'error',
            text: 'Failed to start download'
          });
        }
      } else {
        // Launch game
        try {
          await invoke('launch_game', { 
            isCk1: selectedGame === "CK1",
            gamePath: currentPath
          });
        } catch (error) {
          console.error('Failed to launch game:', error);
          setStatusMessage({
            type: 'error',
            text: 'Failed opening game'
          });
        }
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <TopBar 
        onProfileClick={() => setIsUserModalOpen(!isUserModalOpen)} 
        isUserModalOpen={isUserModalOpen}
      />

      <div className="flex flex-1 relative mb-[-7rem]">
        <SideBar 
          selectedGame={selectedGame} 
          onGameSelect={setSelectedGame}
          onError={(message) => setStatusMessage({ type: 'error', text: message })}
        />
        <MainContent
          selectedGame={selectedGame}
          isUserModalOpen={isUserModalOpen}
          setIsUserModalOpen={setIsUserModalOpen}
        >
            <>
              <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                selectedMirror={selectedMirror}
                setSelectedMirror={setSelectedMirror}
              />
              <UserModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
              />
            </>
          
        </MainContent>
      </div>

      <BottomBar 
        className="z-10"
        onSettingsClick={() => setIsSettingsOpen(!isSettingsOpen)} 
        onPlayClick={handlePlayClick}
      />

      <DownloadModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}

export default App;
