import backgroundCK1 from "../assets/background-ck1.png";
import backgroundCK2 from "../assets/background-ck2-pool.png";

type GameVersion = "CK1" | "CK2";

interface MainContentProps {
  selectedGame: GameVersion;
  isUserModalOpen: boolean;
  setIsUserModalOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
}

export function MainContent({ 
  selectedGame, 
  children 
}: MainContentProps) {
  const backgroundImage =
    selectedGame === "CK1" ? backgroundCK1 : backgroundCK2;

  return (
    <div className="flex-1 relative p-0 m-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
