import profile from "../assets/profile.png";
import { useAppStore } from '../stores/useAppStore';
import { invoke } from '@tauri-apps/api/core';
import { Settings } from "../types/settings";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserModal({ isOpen, onClose }: UserModalProps) {
  const { fullName, setStatusMessage } = useAppStore();
  const isLoggedIn = fullName && fullName.trim() !== '';

  const handleDisconnect = async () => {
    try {
      const updatedConfig = await invoke<Settings>('handle_logout');
      
      // Update app state with the reset config
      useAppStore.setState({
        fullName: '',
        email: '',
        accessToken: '',
        expirationDate: '',
        membership: '',
        rawConfig: updatedConfig,
      });

      setStatusMessage({
        type: 'success',
        text: 'Successfully disconnected'
      });
      
      onClose(); // Close the modal after disconnecting
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to disconnect'
      });
    }
  };

  // Don't render if not logged in or modal is closed
  if (!isLoggedIn || !isOpen) return null;

  return (
    <div className="absolute top-0 right-0 z-30 pr-9">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Modal content */}
      <div 
        className="bg-black/60 backdrop-blur-sm rounded-bl-3xl rounded-br-3xl pt-3 px-6 pb-6 w-80 h-28 text-white font-roboto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <img 
            src={profile} 
            alt="Profile" 
            className="w-12 h-12 rounded-full object-contain"
          />
          
          <div className="flex flex-col font-roboto">
            <span className="text-lg font-bold">{fullName}</span>
            <span className="text-sm text-gray-300">Connected Account</span>
          </div>
        </div>

        <button 
          onClick={handleDisconnect}
          className="mt-3 bg-gradient-to-b from-[#FF4D01] to-[#B50000] hover:brightness-110 w-28 py-1 rounded-full text-sm transition-all font-roboto font-bold text-center"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
} 