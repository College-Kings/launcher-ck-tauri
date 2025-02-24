import { invoke } from '@tauri-apps/api/core';
import patreon from "../assets/patreon.png";
import instagram from "../assets/instagram.png";
import twitter from "../assets/twitter.png";
import discord from "../assets/discord.png";
import profile from "../assets/profile.png";
import patreonIcon from "../assets/patreon-icon.png";
import { openUrl } from '@tauri-apps/plugin-opener';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { Member } from '../types/config';

const PATREON = 'https://www.patreon.com/collegekings';
const INSTAGRAM = 'https://www.instagram.com/collegekingsgame/';
const TWITTER = 'https://x.com/collegekings';
const DISCORD = 'https://discord.gg/undergradsteve';

interface TopBarProps {
    isUserModalOpen: boolean;
    user?: Member;
    onProfileClick: () => void;
}

async function handlePatreonClick(signedIn: boolean) {
    if (signedIn) {
        return;
    }

    const url = 'https://www.patreon.com/oauth2/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id: 'abgEn1iMz-3vWg_yjFX4bIUwmt7hNOAMgRakiIvyahYXQAGR_XsK6thmoUkRS_l7',
        redirect_uri: 'http://localhost:6710',
        scope: 'identity identity[email]',
    });

    console.log(url);

    await openUrl(url);
    await invoke('start_web_server');
};

export function TopBar({ onProfileClick, user, isUserModalOpen }: TopBarProps) {
    useEffect(() => {
        const unlisten = listen<string>('web-callback', async (event) => {
            const path = event.payload;
            await invoke('patreon_access_token', { path });
        });

        return () => { unlisten.then((unlisten) => unlisten()); }
    }, []);

    return (
        <div className="h-16 bg-black text-white flex items-center justify-between px-4">
            {/* Left side social icons */}
            <div className="flex gap-4">
                <button
                    onClick={() => openUrl(PATREON)}
                    className="w-10 h-10 hover:opacity-80 transition-opacity"
                >
                    <img
                        src={patreon}
                        alt="Patreon"
                        className="w-full h-full object-contain scale-90"
                    />
                </button>
                <button
                    onClick={() => openUrl(INSTAGRAM)}
                    className="w-10 h-10 hover:opacity-80 transition-opacity"
                >
                    <img
                        src={instagram}
                        alt="Instagram"
                        className="w-full h-full object-contain scale-90"
                    />
                </button>
                <button
                    onClick={() => openUrl(TWITTER)}
                    className="w-10 h-10 hover:opacity-80 transition-opacity"
                >
                    <img
                        src={twitter}
                        alt="Twitter"
                        className="w-full h-full object-contain scale-90"
                    />
                </button>
                <button
                    onClick={() => openUrl(DISCORD)}
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
                    onClick={() => { handlePatreonClick(user !== null) }}
                    className={`bg-white/20 text-white w-60 h-10 rounded-lg flex items-center px-4 font-roboto truncate ${!user ? 'hover:bg-white/30 transition-colors' : ''
                        }`}
                >
                    <img src={patreonIcon} alt="" className="w-6 h-6 object-contain shrink-0" />
                    <span className={`text-base font-medium truncate ${user ? 'grow text-center' : 'ml-auto'
                        }`}>
                        {user?.full_name ? `Hello, ${user.full_name}` : 'LOGIN WITH PATREON'}
                    </span>
                </button>
                <button
                    onClick={() => user ? onProfileClick() : null}
                    className={`w-8 h-8 ${isUserModalOpen ? 'opacity-50' : ''} ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    <img
                        src={profile}
                        alt="Profile"
                        className="w-full h-full object-contain"
                    />
                </button>
                {/* <div className="w-8 h-8">
                    <img
                        src={bell}
                        alt="Notifications"
                        className="w-full h-full object-contain"
                    />
                </div> */}
            </div>
        </div>
    );
}
