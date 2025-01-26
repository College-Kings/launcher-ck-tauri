import settingsIcon from '../assets/settings.png';
import dangerIcon from '../assets/danger.png';
import checkIcon from '../assets/check.png';
import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';

interface BottomBarProps {
  className?: string;
  onSettingsClick: () => void;
  onPlayClick: () => void;
}

export function BottomBar({ className, onSettingsClick, onPlayClick }: BottomBarProps) {
  const {
    freeGameVersionUser,
    gameVersionUser,
    gameVersion,
    freeGameVersion,
    selectedGame,
    downloadProgress,
    statusMessage,
    downloadPathCk1,
    downloadPathCk2,
  } = useAppStore();

  useEffect(() => {
    // Perform any side effects when freeGameVersionUser or gameVersionUser changes
    console.log('Game version user changed:', freeGameVersionUser, gameVersionUser);
  }, [freeGameVersionUser, gameVersionUser]);

  useEffect(() => {
    // When download completes (progress goes from a number to undefined)
    if (downloadProgress === undefined && statusMessage?.type === 'success') {
      // The version update is now handled in App.tsx when receiving the download-complete event
      console.log('Download completed successfully');
    }
  }, [downloadProgress, statusMessage]);

  const getGameStatus = () => {
    const currentPath = selectedGame === "CK1" ? downloadPathCk1 : downloadPathCk2;
    const currentVersion = selectedGame === "CK1" ? freeGameVersionUser : gameVersionUser;
    const latestVersion = selectedGame === "CK1" ? freeGameVersion : gameVersion;

    if (downloadProgress !== undefined) {
      return 'downloading';
    }

    if (!currentPath || currentVersion < latestVersion) {
      return 'not_installed';
    }

    return selectedGame === "CK1" ? 'installed_ck1' : 'installed_ck2';
  };

  const status = getGameStatus();
  const showUpdateBanner = status === 'not_installed' && 
    (selectedGame === "CK1" ? downloadPathCk1 : downloadPathCk2) !== '';

  const getButtonConfig = () => {
    switch (status) {
      case 'installed_ck1':
        return {
          text: 'PLAY',
          bgColor: 'bg-gradient-to-b from-[#67C8FF] to-[#032348]',
          shadow: 'shadow-[inset_-3px_-3px_0_#01113A,inset_2px_2px_0_#90C9FE]',
          textSize: 'text-3xl',
          hoverEffect: 'hover:brightness-90'
        };
      case 'installed_ck2':
        return {
          text: 'PLAY',
          bgColor: 'bg-[#8F1D68]',
          shadow: 'shadow-[inset_-3px_-3px_0_#670947,inset_2px_2px_0_#B15793]',
          textSize: 'text-3xl',
          hoverEffect: 'hover:bg-[#741956]'
        };
      case 'not_installed':
        return {
          text: 'DOWNLOAD',
          bgColor: 'bg-gradient-to-b from-[#FFED01] to-[#F6951D]',
          shadow: 'shadow-[inset_-4px_-4px_0_#925804,inset_4px_4px_0_white]',
          textSize: 'text-3xl',
          hoverEffect: 'hover:brightness-90'
        };
      case 'downloading':
        return {
          text: 'DOWNLOADING...',
          bgColor: 'bg-gradient-to-b from-[#C2C2C2] to-[#494949]',
          shadow: 'shadow-[inset_-2px_-2px_0_#535353,inset_2px_2px_0_#FFFFFF]',
          textSize: 'text-xl',
          hoverEffect: 'cursor-not-allowed'
        };
    }
  };

  const { text, bgColor, shadow, textSize, hoverEffect } = getButtonConfig();

  const getStatusMessageStyle = (type: 'error' | 'success') => {
    switch (type) {
      case 'error':
        return 'bg-[#2B0606] text-red-200 outline outline-1 outline-[#FF0000]';
      case 'success':
        return 'bg-[#143707] text-green-200 outline outline-1 outline-[#33FF00]';
      default:
        return 'bg-black/70 text-white';
    }
  };

  return (
    <div className={`h-44 relative ${className}`}>
      <div className="absolute bottom-0 w-full h-16 bg-black">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <button 
            onClick={onSettingsClick}
            className="w-10 h-10 rounded-lg transition-colors flex items-center justify-center"
          >
            <img 
              src={settingsIcon} 
              alt="Settings" 
              className="w-8 h-8 transition-opacity hover:opacity-60" 
            />
          </button>
        </div>

        {/* Progress bar section */}
        {downloadProgress !== undefined && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96">
            <div className="relative h-12">
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-roboto font-black text-lg text-white [text-shadow:_3px_3px_4px_rgba(0,0,0,0.25)]">
                  {downloadProgress.toFixed(1)}%
                </span>
                
                <div className="w-full h-[5px] bg-[#464646] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#FFEF01] to-[#F6951D] transition-all duration-300"
                    style={{ width: `${Math.min(downloadProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status message section */}
        {!downloadProgress && statusMessage && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`pl-3 pr-6 py-2 rounded-full ${getStatusMessageStyle(statusMessage.type)} flex items-center gap-1.5`}>
              <img 
                src={statusMessage.type === 'error' ? dangerIcon : checkIcon} 
                alt={statusMessage.type === 'error' ? "Error" : "Success"}
                className="w-6 h-6" 
              />
              <span className="font-roboto font-bold text-lg">
                {statusMessage.text}
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 right-4 flex flex-col items-end gap-1">
          {/* Update available notification */}
          {showUpdateBanner && (
            <div className="absolute -top-8 w-60 h-20 bg-black opacity-70 rounded-3xl flex items-start justify-center -z-2 pt-2">
              <span className="text-white text-sm font-roboto font-bold whitespace-nowrap">
                NEW UPDATE AVAILABLE
              </span>
            </div>
          )}

          {/* Play/Download button */}
          <button 
            className={`${bgColor} ${shadow} ${hoverEffect}
                       text-white
                       w-60 h-[87px]
                       rounded-3xl
                       ${textSize} font-freshman
                       [text-shadow:_2px_2px_2px_rgb(0_0_0_/_40%)]
                       pt-1.5 z-10
                       flex items-center justify-center`}
            onClick={onPlayClick}
            disabled={status === 'downloading'}
          >
            {text}
          </button>

          {/* Version info */}
          <div className="w-60 h-8 flex items-center justify-center -mt-1">
            <span className="text-gray-400 text-base font-roboto whitespace-nowrap">
              Current game version: {selectedGame === "CK1" 
                ? (freeGameVersionUser !== undefined ? freeGameVersionUser : "None") 
                : (gameVersionUser !== undefined ? gameVersionUser : "None")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 