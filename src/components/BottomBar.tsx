import settingsIcon from '../assets/settings.png';
import dangerIcon from '../assets/danger.png';
import checkIcon from '../assets/check.png';
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Member } from '../types/config';

interface BottomBarProps {
    className?: string;
    appName: string;
    status?: StatusMessage;
    user?: Member;
    onSettingsClick: () => void;
    onPlayClick: (game: Game) => void;
}


const enum GameStatus {
    NotInstalled,
    Downloading,
    Installed
}

function getGameStatus(progress: number, isLatest: boolean): GameStatus {
    if (progress !== -1) {
        return GameStatus.Downloading
    }

    if (!isLatest) {
        return GameStatus.NotInstalled;
    }

    return GameStatus.Installed;
};

interface ButtonConfig {
    text: string;
    bgColor: string;
    shadow: string;
    textSize: string;
    hoverEffect: string;
}

function getButtonConfig(status: GameStatus, appName: string, user?: Member): ButtonConfig {
    switch (status) {
        case GameStatus.Installed:
            if (appName === "College Kings") {
                return {
                    text: 'PLAY',
                    bgColor: 'bg-linear-to-b from-[#67C8FF] to-[#032348]',
                    shadow: 'shadow-[inset_-3px_-3px_0_#01113A,inset_2px_2px_0_#90C9FE]',
                    textSize: 'text-3xl',
                    hoverEffect: 'hover:brightness-90'
                };
            } else {
                return {
                    text: 'PLAY',
                    bgColor: 'bg-[#8F1D68]',
                    shadow: 'shadow-[inset_-3px_-3px_0_#670947,inset_2px_2px_0_#B15793]',
                    textSize: 'text-3xl',
                    hoverEffect: 'hover:bg-[#741956]'
                };
            }
        case GameStatus.NotInstalled:
            if (appName == "College Kings" || verifyUser(user)) {
                return {
                    text: 'DOWNLOAD',
                    bgColor: 'bg-linear-to-b from-[#FFED01] to-[#F6951D]',
                    shadow: 'shadow-[inset_-4px_-4px_0_#925804,inset_4px_4px_0_white]',
                    textSize: 'text-3xl',
                    hoverEffect: 'hover:brightness-90'
                };
            } else {
                return {
                    text: 'DOWNLOAD',
                    bgColor: 'bg-linear-to-b from-[#D3D3D3] to-[#A9A9A9]',
                    shadow: 'shadow-[inset_-4px_-4px_0_#7D7D7D,inset_4px_4px_0_white]',
                    textSize: 'text-3xl',
                    hoverEffect: 'cursor-not-allowed opacity-50'
                };
            }
        case GameStatus.Downloading:
            return {
                text: 'DOWNLOADING...',
                bgColor: 'bg-linear-to-b from-[#C2C2C2] to-[#494949]',
                shadow: 'shadow-[inset_-2px_-2px_0_#535353,inset_2px_2px_0_#FFFFFF]',
                textSize: 'text-xl',
                hoverEffect: 'cursor-not-allowed'
            };
    }
};

function verifyUser(user?: Member): boolean {
    if (user === null) {
        return false;
    }

    if (user!.currently_entitled_amount_cents < 1000 && user!.campaign_lifetime_support_cents < 2000) {
        return false;
    }

    return true;
}

function getStatusMessageStyle(type: StatusType): string {
    switch (type) {
        case StatusType.Error:
            return 'bg-[#2B0606] text-red-200 outline outline-1 outline-[#FF0000]';
        case StatusType.Success:
            return 'bg-[#143707] text-green-200 outline outline-1 outline-[#33FF00]';
        default:
            return 'bg-black/70 text-white';
    }
};

export function BottomBar({ className, appName, status, user, onSettingsClick, onPlayClick }: BottomBarProps) {
    const [progress, setProgress] = useState<number>(-1);
    useEffect(() => {
        const unsubscribe = listen<number>('download-progress', async (event) => {
            setProgress(event.payload);
        });

        return () => { unsubscribe.then((unlisten) => unlisten()); }
    }, []);

    const [game, setGame] = useState<Game>({ name: appName, version: "0.0.0" });
    useEffect(() => {
        invoke<Game>('config_game', { gameName: appName }).then(setGame);
    }, [appName, progress]);

    const [isLatest, setIsLatest] = useState<boolean>(false);
    useEffect(() => {
        invoke<boolean>('game_is_latest_version', { game }).then(setIsLatest);
    }, [progress]);

    const gameStatus = getGameStatus(progress, isLatest);
    const { text, bgColor, shadow, textSize, hoverEffect } = getButtonConfig(gameStatus, game.name, user);

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
                {progress !== -1 && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96">
                        <div className="relative h-12">
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="font-roboto font-black text-lg text-white [text-shadow:_3px_3px_4px_rgba(0,0,0,0.25)]">
                                    {progress}%
                                </span>

                                <div className="w-full h-[5px] bg-[#464646] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-linear-to-r from-[#FFEF01] to-[#F6951D] transition-all duration-300"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status message section */}
                {progress === -1 && status && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className={`pl-3 pr-6 py-2 rounded-full ${getStatusMessageStyle(status.type)} flex items-center gap-1.5`}>
                            <img
                                src={status.type === StatusType.Error ? dangerIcon : checkIcon}
                                alt={status.type === StatusType.Success ? "Error" : "Success"}
                                className="w-6 h-6"
                            />
                            <span className="font-roboto font-bold text-lg">
                                {status.text}
                            </span>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-0 right-4 flex flex-col items-end gap-1">
                    {/* Update available notification */}
                    {gameStatus === GameStatus.NotInstalled && (
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
                        onClick={() => onPlayClick(game)}
                        disabled={gameStatus === GameStatus.Downloading}
                    >
                        {text}
                    </button>

                    {/* Version info */}
                    <div className="w-60 h-8 flex items-center justify-center -mt-1">
                        <span className="text-gray-400 text-base font-roboto whitespace-nowrap">
                            Current game version: {game.version}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
} 