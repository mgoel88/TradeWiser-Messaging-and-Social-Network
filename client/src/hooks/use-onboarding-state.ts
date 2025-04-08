import { useState, useCallback, useEffect } from 'react';

type OnboardingState = {
  hasCompletedOnboarding: boolean;
  isFirstLogin: boolean;
  currentPage: string;
  hasVisitedPages: Record<string, boolean>;
};

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState>({
    hasCompletedOnboarding: localStorage.getItem('onboardingCompleted') === 'true',
    isFirstLogin: false,
    currentPage: window.location.pathname,
    hasVisitedPages: JSON.parse(localStorage.getItem('hasVisitedPages') || '{}'),
  });

  const markPageVisited = useCallback((page: string) => {
    setState(prev => {
      const newHasVisitedPages = { ...prev.hasVisitedPages, [page]: true };
      localStorage.setItem('hasVisitedPages', JSON.stringify(newHasVisitedPages));
      return {
        ...prev,
        hasVisitedPages: newHasVisitedPages,
        currentPage: page
      };
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboardingCompleted', 'true');
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('onboardingCompleted');
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: false
    }));
  }, []);

  const setIsFirstLogin = useCallback((value: boolean) => {
    setState(prev => ({
      ...prev,
      isFirstLogin: value
    }));
  }, []);

  useEffect(() => {
    // Update current page when URL changes
    const handleLocationChange = () => {
      const newPage = window.location.pathname;
      setState(prev => ({
        ...prev,
        currentPage: newPage
      }));
      markPageVisited(newPage);
    };

    // Call once on initial load
    handleLocationChange();

    // Setup listener for future changes
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [markPageVisited]);

  // Check if we should show feature-specific onboarding
  const shouldShowFeatureOnboarding = useCallback((featurePath: string): boolean => {
    return !state.hasVisitedPages[featurePath] && !state.hasCompletedOnboarding;
  }, [state.hasVisitedPages, state.hasCompletedOnboarding]);

  return {
    ...state,
    markPageVisited,
    completeOnboarding,
    resetOnboarding,
    setIsFirstLogin,
    shouldShowFeatureOnboarding
  };
}

export default useOnboardingState;