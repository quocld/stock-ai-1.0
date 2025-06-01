'use client';

import { useEffect } from 'react';
import { TourProvider, useTour, StepType } from '@reactour/tour';
import { useOnboarding } from '@/hooks/useOnboarding';

const steps: StepType[] = [
  {
    selector: 'body',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">1</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Welcome to StockGPT</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Your intelligent AI tool for stock market research and analysis. 
          Let&apos;s explore the key features of the application.
        </p>
      </div>
    ),
  },
  {
    selector: '.group button[aria-label="Information"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">2</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">About StockGPT</h3>
        </div>
        <div className="space-y-2">
          <p className="text-gray-600">We use cutting-edge technology to deliver the best experience:</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">AI Model:</span>
              <span className="text-gray-600">Llama 4 Scout (Groq)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-medium">Data Source:</span>
              <span className="text-gray-600">Yahoo Finance</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">
            * Due to using the free version, there may be limitations on speed and accuracy
          </p>
        </div>
      </div>
    ),
    position: 'left',
  },
  {
    selector: '#chat-sidebar',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">3</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
        </div>
        <div className="space-y-2">
          <p className="text-gray-600">This area helps you manage your conversations:</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Create a new conversation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Review previous analyses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Compare results over time</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    selector: '#chat-window',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">4</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Chat Area</h3>
        </div>
        <div className="space-y-2">
          <p className="text-gray-600">This is where you interact with AI for stock analysis:</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Ask about stock prices (e.g., &quot;What&apos;s the current price of AAPL?&quot;)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Analyze market trends</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">View charts automatically when AI mentions stock symbols</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    selector: '#chat-input',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">5</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Ask Questions</h3>
        </div>
        <div className="space-y-2">
          <p className="text-gray-600">Enter your questions here to start analyzing:</p>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Use stock symbols (e.g., AAPL, GOOGL)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Ask about prices, volume, trends</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span className="text-gray-600">Request technical or fundamental analysis</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">
            * Due to using the free version, there may be limitations on speed and accuracy
          </p>
        </div>
      </div>
    ),
  },
];

const TourContent = () => {
  const { isOnboardingVisible } = useOnboarding();
  const { setIsOpen } = useTour();

  useEffect(() => {
    if (isOnboardingVisible) {
      setIsOpen(true);
    }
  }, [isOnboardingVisible, setIsOpen]);

  return null;
};

export const Onboarding = () => {
  const { isOnboardingVisible, completeOnboarding } = useOnboarding();

  if (!isOnboardingVisible) return null;

  return (
    <TourProvider
      steps={steps}
      showNavigation
      showBadge={false}
      onClickClose={completeOnboarding}
      onClickMask={completeOnboarding}
      styles={{
        popover: (base) => ({
          ...base,
          borderRadius: '12px',
          padding: '20px',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          maxWidth: '380px',
          margin: '0 16px',
        }),
        controls: (base) => ({
          ...base,
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }),
        button: (base, state) => ({
          ...base,
          backgroundColor: state?.current ? '#0070f3' : '#f3f4f6',
          color: state?.current ? '#ffffff' : '#374151',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: state?.current ? '#0051a8' : '#e5e7eb',
          },
          '&:disabled': {
            backgroundColor: '#f3f4f6',
            color: '#9ca3af',
            cursor: 'not-allowed',
          },
        }),
        arrow: (base) => ({
          ...base,
          color: '#ffffff',
        }),
        dot: (base, state) => ({
          ...base,
          backgroundColor: state?.current ? '#0070f3' : '#e5e7eb',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          margin: '0 4px',
          transition: 'background-color 0.2s ease-in-out',
        }),
      }}
      padding={{
        mask: 8,
      }}
      disableInteraction={false}
      disableDotsNavigation={false}
      disableKeyboardNavigation={false}
      showCloseButton={false}
      disableFocusLock
      inViewThreshold={100}
      components={{
        Navigation: ({ currentStep, steps, setCurrentStep, setIsOpen }) => (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (currentStep === steps.length - 1) {
                    completeOnboarding();
                    setIsOpen(false);
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
            {currentStep < steps.length - 1 && (
              <button
                onClick={() => {
                  completeOnboarding();
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        ),
      }}
    >
      <TourContent />
    </TourProvider>
  );
}; 