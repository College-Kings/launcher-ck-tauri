import { useAppStore } from '../stores/useAppStore';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const { selectedGame, downloadPathCk1, downloadPathCk2, setDownloadPathCk1, setDownloadPathCk2 } = useAppStore();
  
  if (!isOpen) return null;

  const currentPath = selectedGame === "CK1" ? downloadPathCk1 : downloadPathCk2;
  const defaultPath = selectedGame === "CK1" 
    ? "C:\\Games\\College Kings 1"
    : "C:\\Games\\College Kings 2";

  const handleBrowse = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        directory: true,
        defaultPath
      });

      if (selectedPath) {
        if (selectedGame === "CK1") {
          setDownloadPathCk1(selectedPath as string);
        } else {
          setDownloadPathCk2(selectedPath as string);
        }
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  const handleContinue = async () => {
    try {
      // First save the path
      if (selectedGame === "CK1") {
        await invoke('save_download_path_ck1', { path: currentPath || defaultPath });
      } else {
        await invoke('save_download_path_ck2', { path: currentPath || defaultPath });
      }
      
      // Close the modal
      onClose();
      
      // Start the download
      await invoke('start_mock_download', { isCk1: selectedGame === "CK1" });
    } catch (error) {
      console.error('Error saving download path:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Backdrop blur */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/30"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-[36rem] h-48 bg-black/75 backdrop-blur-md rounded-3xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <div className="absolute left-1/2 -translate-x-1/2 top-12 font-roboto font-medium text-xl text-white flex items-center justify-center text-shadow">
          Choose download location:
        </div>

        {/* Browse Location Container */}
        <div className="absolute left-1/2 -translate-x-1/2 top-20 w-[27rem] flex gap-2">
          {/* Path Display */}
          <div className="min-w-0 flex-1 h-7 bg-[#E7E7E7]/75 backdrop-blur-lg rounded-3xl flex items-center justify-start">
            <div className="px-1.5 font-roboto font-medium text-lg text-black truncate">
              {currentPath || defaultPath}
            </div>
          </div>

          {/* Browse Button */}
          <button 
            onClick={handleBrowse}
            className="flex-none w-[90px] h-7 rounded-[25px] text-white font-medium bg-gradient-to-b from-gray-300 to-gray-600 shadow-md"
          >
            Browse
          </button>
        </div>

        {/* Action Buttons */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex gap-4">
          <button 
            onClick={onClose}
            className="w-[106px] h-[26px] rounded-[25px] text-white font-medium bg-gradient-to-b from-orange-500 to-red-700 shadow-md"
          >
            Cancel
          </button>
          <button 
            onClick={handleContinue}
            className="w-[106px] h-[26px] rounded-[25px] text-white font-medium bg-gradient-to-b from-green-500 to-green-800 shadow-md"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 