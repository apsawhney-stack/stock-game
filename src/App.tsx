import { ScreenRouter } from './ui/screens/ScreenRouter';
import { useProgressPersistence } from './app/hooks';

function App() {
    // Save/load player progress (XP, achievements) to localStorage
    useProgressPersistence();

    return <ScreenRouter />;
}

export default App;
