import { invoke } from '@tauri-apps/api/core';
import patreon from "../assets/patreon.png";
import instagram from "../assets/instagram.png";
import twitter from "../assets/twitter.png";
import discord from "../assets/discord.png";
import profile from "../assets/profile.png";
import bell from "../assets/bell.png";
import patreonIcon from "../assets/patreon-icon.png";
import { useAppStore } from '../stores/useAppStore';

interface TopBarProps {
  onProfileClick: () => void;
  isUserModalOpen: boolean;
}

export function TopBar({ onProfileClick, isUserModalOpen }: TopBarProps) {
  const { fullName } = useAppStore();

  // Get first name from full name
  const firstName = fullName ? fullName.split(' ')[0] : '';
  const isLoggedIn = fullName && fullName.trim() !== '';

  const handlePatreonClick = async () => {
    if (!isLoggedIn) {
      const url = 'https://www.patreon.com/oauth2/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id: 'YOUR_CLIENT_ID',
        redirect_uri: 'YOUR_REDIRECT_URI',
        scope: 'identity identity[email]',
        state: 'some_random_state'
      });
      
      try {
        await invoke('open_browser', { url });
        console.log('Opened Patreon login in browser');
      } catch (err) {
        console.error('Failed to open Patreon login:', err);
      }
    }
  };

  const openLink = async (url: string) => {
    try {
      await invoke('open_browser', { url });
      console.log('Opened URL in browser:', url);
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  return (
    <div className="h-16 bg-black text-white flex items-center justify-between px-4">
      {/* Left side social icons */}
      <div className="flex gap-4">
        <button
          onClick={() => openLink('https://patreon.com')}
          className="w-10 h-10 hover:opacity-80 transition-opacity"
        >
          <img
            src={patreon}
            alt="Patreon"
            className="w-full h-full object-contain scale-90"
          />
        </button>
        <button
          onClick={() => openLink('https://instagram.com')}
          className="w-10 h-10 hover:opacity-80 transition-opacity"
        >
          <img
            src={instagram}
            alt="Instagram"
            className="w-full h-full object-contain scale-90"
          />
        </button>
        <button
          onClick={() => openLink('https://x.com')}
          className="w-10 h-10 hover:opacity-80 transition-opacity"
        >
          <img
            src={twitter}
            alt="Twitter"
            className="w-full h-full object-contain scale-90"
          />
        </button>
        <button
          onClick={() => openLink('https://discord.com')}
          className="w-10 h-10 hover:opacity-80 transition-opacity"
        >
          <img
            src={discord}
            alt="Discord"
            className="w-full h-full object-contain scale-95"
          />
        </button>
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handlePatreonClick}
          className={`bg-white/20 text-white w-60 h-10 rounded-lg flex items-center px-4 font-roboto truncate ${
            !isLoggedIn ? 'hover:bg-white/30 transition-colors' : ''
          }`}
        >
          <img src={patreonIcon} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
          <span className={`text-base font-medium truncate ${
            firstName ? 'flex-grow text-center' : 'ml-auto'
          }`}>
            {firstName ? `Hello, ${firstName}` : 'LOGIN WITH PATREON'}
          </span>
        </button>
        <button 
          onClick={() => isLoggedIn ? onProfileClick() : null}
          className={`w-8 h-8 ${isUserModalOpen ? 'opacity-50' : ''} ${!isLoggedIn ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <img
            src={profile}
            alt="Profile"
            className="w-full h-full object-contain"
          />
        </button>
        <div className="w-8 h-8">
          <img
            src={bell}
            alt="Notifications"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
