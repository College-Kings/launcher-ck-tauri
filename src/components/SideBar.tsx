import logo1 from "../assets/CK1 logo.png";
import logo2 from "../assets/CK2 logo.png";
import selectedBox from "../assets/selected box.svg";

interface SideBarProps {
    appName: string;
    onGameSelect: (appName: string) => void;
}

export function SideBar({ appName, onGameSelect }: SideBarProps) {
    return (
        <div className="w-36 bg-[#8F1D68] flex flex-col py-4">
            <div className="flex-1 flex justify-center px-4">
                <div className="relative w-[90%] h-48 bg-[#373737] rounded-[20px] drop-shadow-md overflow-visible">
                    <div className="h-full flex flex-col">
                        <div
                            className="relative w-full h-1/2 flex items-center justify-center overflow-visible cursor-pointer"
                            onClick={() => onGameSelect("College Kings")}
                        >
                            <img
                                src={selectedBox}
                                alt=""
                                className={`absolute h-full w-32 z-[-1] transform translate-x-[-50%] transition-opacity duration-300 drop-shadow-md ease-in-out ${appName === "College Kings" ? "opacity-100" : "opacity-0"
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
                            onClick={() => onGameSelect("College Kings 2")}
                        >
                            <img
                                src={selectedBox}
                                alt=""
                                className={`absolute h-full w-32 z-[-1] transform translate-x-[-50%] transition-opacity duration-300 drop-shadow-md ease-in-out ${appName === "College Kings 2" ? "opacity-100" : "opacity-0"
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
