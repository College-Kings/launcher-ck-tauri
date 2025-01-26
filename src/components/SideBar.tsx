import logo1 from "../assets/CK1 logo.png";
import logo2 from "../assets/CK2 logo.png";
import selectedBox from "../assets/selected box.svg";
import { GameVersion } from "../App";
import { useAppStore } from '../stores/useAppStore';

interface SideBarProps {
  selectedGame: GameVersion;
  onGameSelect: (game: GameVersion) => void;
  onError: (message: string) => void;
}

export function SideBar({ selectedGame, onGameSelect, onError }: SideBarProps) {
  const { fullName, downloadProgress } = useAppStore();
  
  const isLoggedIn = fullName && fullName.trim() !== '';

  const handleGameSelect = (game: GameVersion) => {
    if (downloadProgress !== undefined) {
      onError("Cannot change game while download is in progress");
      return;
    }

    if (game === "CK2" && !isLoggedIn) {
      onError("Please login with Patreon to access College Kings 2");
      return;
    }
    onGameSelect(game);
  };

  return (
    <div className="w-36 bg-[#8F1D68] flex flex-col py-4">
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-[90%] h-48 bg-[#373737] rounded-[20px] drop-shadow-md overflow-visible">
          <div className="h-full flex flex-col">
            <div
              className="relative w-full h-1/2 flex items-center justify-center overflow-visible cursor-pointer"
              onClick={() => handleGameSelect("CK1")}
            >
              <img
                src={selectedBox}
                alt=""
                className={`absolute h-full w-32 z-[-1] transform translate-x-[-50%] transition-opacity duration-300 drop-shadow-md ease-in-out ${
                  selectedGame === "CK1" ? "opacity-100" : "opacity-0"
                }`}
                style={{ left: "55%" }}
              />
              <img
                src={logo1}
                alt="College Kings Logo"
                className="object-none"
              />
            </div>
            <div
              className="relative w-full h-1/2 flex items-center justify-center overflow-visible cursor-pointer"
              onClick={() => handleGameSelect("CK2")}
            >
              <img
                src={selectedBox}
                alt=""
                className={`absolute h-full w-32 z-[-1] transform translate-x-[-50%] transition-opacity duration-300 drop-shadow-md ease-in-out ${
                  selectedGame === "CK2" ? "opacity-100" : "opacity-0"
                }`}
                style={{ left: "55%" }}
              />
              <img
                src={logo2}
                alt="College Kings 2 Logo"
                className="object-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
