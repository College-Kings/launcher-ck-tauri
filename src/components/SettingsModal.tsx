import xIcon from '../assets/x-icon.png';
import { invoke } from '@tauri-apps/api/core';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

async function handleRefreshPatreon() {
    // const updatedConfig = await invoke<Settings>('refresh_patreon_api');

    // useAppStore.setState({
    //     fullName: updatedConfig.full_name,
    //     email: updatedConfig.email,
    //     membership: updatedConfig.membership,
    //     gameVersion: updatedConfig.game_version,
    //     freeGameVersion: updatedConfig.free_game_version,
    //     rawConfig: updatedConfig,
    // });

    // setStatusMessage({
    //     type: 'success',
    //     text: 'Patreon status updated successfully'
    //   });
}

async function handleResetConfig() {
    // const updatedConfig = await invoke<Settings>('config_reset');

    // Update all relevant state with the new config
    // useAppStore.setState({
    //     gameVersion: updatedConfig.game_version,
    //     gameVersionUser: updatedConfig.game_version_user,
    //     downloadPathCk2: updatedConfig.download_path_ck2,
    //     freeGameVersion: updatedConfig.free_game_version,
    //     freeGameVersionUser: updatedConfig.free_game_version_user,
    //     downloadPathCk1: updatedConfig.download_path_ck1,
    //     rawConfig: updatedConfig,
    // });

    // setStatusMessage({
    //     type: 'success',
    //     text: `${isCk1 ? 'College Kings' : 'College Kings 2'} configuration reset successfully`
    //   });
}

async function handleCopyErrorLog() {
    await invoke('copy_error_log');

    // setStatusMessage({
    //     type: 'success',
    //     text: 'Error log copied to clipboard'
    // });
};


export function SettingsModal({
    isOpen,
    onClose,
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30"
                onClick={onClose}
            />

            {/* Modal container */}
            <div className="absolute inset-0 flex items-start py-4" onClick={onClose}>
                {/* Modal content */}
                <div
                    className="bg-black/80 backdrop-blur-xs rounded-tr-3xl rounded-br-3xl p-6 w-[300px] h-full text-white font-roboto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Settings</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <img
                                src={xIcon}
                                alt="Close"
                                className="w-9 h-9"
                            />
                        </button>
                    </div>

                    <div className="w-full h-px bg-gray-600 mx-auto" />


                    <div className="space-y-4">
                        {/* Patreon API Section */}
                        <div className="flex justify-between items-center pt-3">
                            <span className="text-lg font-bold">Patreon API</span>
                            <button
                                onClick={handleRefreshPatreon}
                                className="bg-linear-to-b from-[#FFC701] to-[#F6951D] hover:brightness-110 w-24 py-1 rounded-full text-sm transition-all font-roboto font-bold text-center"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="w-full h-px bg-gray-600 mx-auto" />

                        {/* Error Log Section */}
                        <div className="flex justify-between items-center py-1">
                            <span className="text-lg font-bold">Error Log</span>
                            <button
                                onClick={handleCopyErrorLog}
                                className="bg-linear-to-b from-[#FFC701] to-[#F6951D] hover:brightness-110 w-24 py-1 rounded-full text-sm transition-all font-roboto font-bold text-center"
                            >
                                Copy
                            </button>
                        </div>

                        <div className="w-full h-px bg-gray-600 mx-auto" />

                        {/* Download Options Section */}
                        {/* <div className="py-1">
                            <h3 className="mb-3 text-lg font-bold">Download options</h3>
                            <div className="space-y-2">
                                <label className="flex justify-between items-center">
                                    <span>Mirror Server 1</span>
                                    <div className="relative w-5 h-5">
                                        <img src={radioIcon} alt="" className="w-5 h-5" />
                                        <img
                                            src={ballIcon}
                                            alt=""
                                            className={`absolute inset-0 w-3 h-3 m-1 transition-opacity ${selectedMirror === 1 ? 'opacity-100' : 'opacity-0'
                                                }`}
                                        />
                                        <input
                                            type="radio"
                                            name="mirror"
                                            checked={selectedMirror === 1}
                                            onChange={() => setSelectedMirror(1)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        />
                                    </div>
                                </label>
                                <label className="flex justify-between items-center">
                                    <span>Mirror Server 2</span>
                                    <div className="relative w-5 h-5">
                                        <img src={radioIcon} alt="" className="w-5 h-5" />
                                        <img
                                            src={ballIcon}
                                            alt=""
                                            className={`absolute inset-0 w-3 h-3 m-1 transition-opacity ${selectedMirror === 2 ? 'opacity-100' : 'opacity-0'
                                                }`}
                                        />
                                        <input
                                            type="radio"
                                            name="mirror"
                                            checked={selectedMirror === 2}
                                            onChange={() => setSelectedMirror(2)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        />
                                    </div>
                                </label>
                            </div>
                        </div> */}

                        <div className="w-full h-px bg-gray-600 mx-auto" />


                        {/* Reset Configuration Section */}
                        <div className="py-1">
                            <h3 className="mb-3 text-lg font-bold">Reset configuration</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-roboto">Main Config</span>
                                    <button
                                        onClick={() => handleResetConfig()}
                                        className="bg-linear-to-b from-[#FF4D01] to-[#B50000] hover:brightness-110 w-24 py-1 rounded-full text-sm transition-all font-roboto font-bold text-center flex items-center justify-center"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-600 mx-auto" />

                    </div>
                </div>
            </div>
        </div>
    );
} 