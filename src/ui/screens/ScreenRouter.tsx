import { motion, AnimatePresence } from 'framer-motion';
import { HomeScreen } from './HomeScreen';
import { MissionBriefingScreen } from './MissionBriefingScreen';
import { DashboardScreen } from './DashboardScreen';
import { TradeScreen } from './TradeScreen';
import { ResultsScreen } from './ResultsScreen';
import { useGameStore, useGameActions } from '../../app/store';
import './ScreenRouter.css';

// Screen names for type safety
export type ScreenName =
    | 'home'
    | 'missionBriefing'
    | 'dashboard'
    | 'trade'
    | 'results'
    | 'stats'
    | 'badges';

// Screen transition variants
const screenVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
};

// Placeholder screens for Sprint 3+
function PlaceholderScreen({ name }: { name: string }) {
    const { navigate } = useGameActions();

    return (
        <div className="placeholder-screen">
            <h2>🚧 {name}</h2>
            <p>Coming soon!</p>
            <button onClick={() => navigate('home')} className="placeholder-screen__back">
                ← Back to Home
            </button>
        </div>
    );
}

// Screen router component - now synced with Zustand store
export function ScreenRouter() {
    const currentScreen = useGameStore((state) => state.ui.currentScreen);

    const renderScreen = () => {
        switch (currentScreen) {
            case 'home':
                return <HomeScreen />;
            case 'missionBriefing':
                return <MissionBriefingScreen />;
            case 'dashboard':
                return <DashboardScreen />;
            case 'trade':
                return <TradeScreen />;
            case 'results':
                return <ResultsScreen />;
            case 'stats':
                return <PlaceholderScreen name="My Stats" />;
            case 'badges':
                return <PlaceholderScreen name="Badges" />;
            default:
                return <HomeScreen />;
        }
    };

    return (
        <div className="screen-router">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentScreen}
                    className="screen-container"
                    variants={screenVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    {renderScreen()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Legacy hook for components that still use it (backward compat)
export function useNavigation() {
    const { navigate } = useGameActions();
    return {
        navigate,
        goBack: () => navigate('home'),
        currentScreen: useGameStore((state) => state.ui.currentScreen),
        screenHistory: [],
    };
}
