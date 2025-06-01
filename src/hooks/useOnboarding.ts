'use client';

import { useState } from 'react';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  // Khởi tạo state dựa trên localStorage
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    }
    return true;
  });

  const [isOnboardingVisible, setIsOnboardingVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== 'true';
    }
    return false;
  });

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOnboardingCompleted(true);
    setIsOnboardingVisible(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    setIsOnboardingCompleted(false);
    setIsOnboardingVisible(true);
  };

  return {
    isOnboardingCompleted,
    isOnboardingVisible,
    completeOnboarding,
    resetOnboarding,
  };
}; 