import { useEffect, useState } from "react";
import { TopBar } from "./components/TopBar.tsx";
import { SideBar } from "./components/SideBar.tsx";
import { BottomBar } from "./components/BottomBar.tsx";
import { MainContent } from "./components/MainContent.tsx";
import { SettingsModal } from "./components/SettingsModal";
import { UserModal } from "./components/UserModal";
import "./index.css";
import { DownloadModal } from "./components/DownloadModal";
import { Modal } from "./types/modal.ts";
import { AppState } from "./types/appState.ts";
import { invoke } from "@tauri-apps/api/core";
import { Member } from "./types/config.ts";
import { listen } from "@tauri-apps/api/event";

function App() {
    const [state, setState] = useState<AppState>({ appName: "College Kings" });

    const handlePlayClick = async (game: Game) => {
        let path = await invoke<string | null>('config_raw_path');

        if (path === null) {
            setState({ ...state, openModal: Modal.Download });
            return;
        }

        await invoke('start_game_process', { game })
    };

    const [user, setUser] = useState<Member | undefined>();
    useEffect(() => {
        invoke<Member>('config_user')
            .then((user) => setUser(user))
    }, []);

    useEffect(() => {
        const unlisten = listen('config-update', () => {
            invoke<Member>('config_user').then(setUser);
        });

        return () => { unlisten.then((unlisten) => unlisten()); }
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
            <TopBar
                onProfileClick={() => setState({ ...state, openModal: Modal.User })}
                user={user}
                isUserModalOpen={state.openModal === Modal.User}
            />

            <div className="flex flex-1 relative mb-[-7rem]">
                <SideBar
                    appName={state.appName}
                    onGameSelect={(appName: string) => setState({
                        ...state, appName
                    }
                    )}
                />
                <MainContent
                    appName={state.appName}
                >
                    <>
                        <SettingsModal
                            isOpen={state.openModal === Modal.Settings}
                            onClose={() => setState({ ...state, openModal: undefined })}
                        />
                        <UserModal
                            isOpen={state.openModal === Modal.User}
                            user={user}
                            onClose={() => setState({ ...state, openModal: undefined })}
                        />
                    </>

                </MainContent>
            </div>

            <BottomBar
                className="z-10"
                appName={state.appName}
                status={state.status}
                user={user}
                onSettingsClick={() => setState({ ...state, openModal: Modal.Settings })}
                onPlayClick={handlePlayClick}
            />

            <DownloadModal
                isOpen={state.openModal === Modal.Download}
                onClose={() => setState({ ...state, openModal: undefined })}
            />
        </div>
    );
}

export default App;
