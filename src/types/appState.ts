import { Modal } from "./modal";

export interface AppState {
    appName: string;
    status?: StatusMessage;
    openModal?: Modal
}