import React, { createContext, useContext, ReactNode } from 'react';
import useOnboardingState from '@/hooks/use-onboarding-state';
import { OnboardingTutorial } from './OnboardingTutorial';

// Context type
type OnboardingContextType = ReturnType<typeof useOnboardingState> & {
  showOnboarding: () => void;
};

// Create the context with a default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Provider component
export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const onboardingState = useOnboardingState();
  const [showTutorial, setShowTutorial] = React.useState(false);
  
  // Handle tutorial completion
  const handleTutorialComplete = () => {
    onboardingState.completeOnboarding();
    setShowTutorial(false);
  };
  
  // Function to manually show onboarding
  const showOnboarding = () => {
    setShowTutorial(true);
  };
  
  // Check if tutorial should be shown on first login
  React.useEffect(() => {
    if (onboardingState.isFirstLogin && !onboardingState.hasCompletedOnboarding) {
      setShowTutorial(true);
    }
  }, [onboardingState.isFirstLogin, onboardingState.hasCompletedOnboarding]);
  
  return (
    <OnboardingContext.Provider value={{ ...onboardingState, showOnboarding }}>
      {children}
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} isFirstLogin={onboardingState.isFirstLogin} />}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use the context
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
};