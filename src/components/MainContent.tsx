import backgroundCK1 from "../assets/background-ck1.png";
import backgroundCK2 from "../assets/background-ck2-pool.png";

interface MainContentProps {
    appName: string;
    children?: React.ReactNode;
}

export function MainContent({
    appName,
    children
}: MainContentProps) {
    let background = backgroundCK1;

    switch (appName) {
        case "College Kings 2":
            background = backgroundCK2;
            break;
        default:
            background = backgroundCK1;
            break;
    }

    return (
        <div className="flex-1 relative p-0 m-0">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${background})` }}
            ></div>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
