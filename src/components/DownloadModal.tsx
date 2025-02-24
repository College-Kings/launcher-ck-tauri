import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

async function handleBrowse() {
    await invoke('update_download_path')
};

async function handleContinue(closeFn: () => void, gameName: string) {
    closeFn();

    await invoke('start_full_download', { gameName });
};

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
    const [path, setPath] = useState<string>(".");

    useEffect(() => {
        invoke<string>('config_download_path')
            .then((result) => setPath(result))
    }, []);

    useEffect(() => {
        const unlisten = listen('config-update', async () => {
            invoke<string>('config_download_path').then(setPath);
        });

        return () => { unlisten.then((unlisten) => unlisten()); }
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            {/* Backdrop blur */}
            <div
                className="absolute inset-0 backdrop-blur-xs bg-black/30"
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
                            {path}
                        </div>
                    </div>

                    {/* Browse Button */}
                    <button
                        onClick={handleBrowse}
                        className="flex-none w-[90px] h-7 rounded-[25px] text-white font-medium bg-linear-to-b from-gray-300 to-gray-600 shadow-md"
                    >
                        Browse
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex gap-4">
                    <button
                        onClick={onClose}
                        className="w-[106px] h-[26px] rounded-[25px] text-white font-medium bg-linear-to-b from-orange-500 to-red-700 shadow-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleContinue(onClose, "College Kings")}
                        className="w-[106px] h-[26px] rounded-[25px] text-white font-medium bg-linear-to-b from-green-500 to-green-800 shadow-md"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
} 