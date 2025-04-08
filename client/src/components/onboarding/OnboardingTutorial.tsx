import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Define the tutorial steps
type TutorialStep = {
  id: number;
  title: string;
  content: string;
  image?: string;
  avatar: 'farmer' | 'trader';
  animation?: string;
};

// Tutorial steps
const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to WizXConnect!',
    content: 'Your agricultural trading platform designed specifically for Indian farmers, traders, and aggregators.',
    avatar: 'farmer',
    animation: 'wave'
  },
  {
    id: 2,
    title: 'Connect with Regional Circles',
    content: 'Join geographical trading circles representing APMCs and mandis across India to connect with relevant trading partners.',
    avatar: 'trader',
    animation: 'point'
  },
  {
    id: 3,
    title: 'Real-time Market Updates',
    content: 'Get live commodity prices, trends, and updates for your regions and commodities of interest.',
    avatar: 'trader'
  },
  {
    id: 4,
    title: 'Trade with Templates',
    content: 'Use our customizable trade templates to create standardized buy/sell offers that include quality specs, delivery terms, and payment details.',
    avatar: 'farmer'
  },
  {
    id: 5,
    title: 'Instant Contract Generation',
    content: 'Generate smart contracts from your completed negotiations with just one click and share them via WhatsApp.',
    avatar: 'trader'
  },
  {
    id: 6,
    title: 'Your Profile & KYC',
    content: 'Complete your KYC verification to build trust with potential trading partners and access all platform features.',
    avatar: 'farmer',
    animation: 'celebrate'
  }
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// Avatar animations
const getAvatarAnimation = (type?: string) => {
  switch (type) {
    case 'wave':
      return {
        initial: { rotateZ: 0 },
        animate: { 
          rotateZ: [0, 15, -15, 15, 0],
          transition: { duration: 1.5, repeat: 1 }
        }
      };
    case 'point':
      return {
        initial: { x: 0 },
        animate: { 
          x: [0, 10, 0],
          transition: { duration: 1, repeat: 2, repeatType: "reverse" as const }
        }
      };
    case 'celebrate':
      return {
        initial: { y: 0 },
        animate: { 
          y: [0, -15, 0],
          transition: { duration: 0.5, repeat: 3, repeatType: "reverse" as const }
        }
      };
    default:
      return {
        initial: {},
        animate: {}
      };
  }
};

// Get avatar image based on type and customized for the user type
const getAvatarImage = (type: 'farmer' | 'trader', userType?: string) => {
  // Default avatars
  const defaults = {
    farmer: '/assets/avatars/farmer-avatar.svg',
    trader: '/assets/avatars/trader-avatar.svg'
  };
  
  // If userType is provided, can customize based on it
  if (userType === 'farmer' && type === 'farmer') {
    return '/assets/avatars/farmer-avatar-highlighted.svg';
  }
  
  if (userType === 'trader' && type === 'trader') {
    return '/assets/avatars/trader-avatar-highlighted.svg';
  }
  
  return defaults[type];
};

interface OnboardingTutorialProps {
  onComplete: () => void;
  isFirstLogin?: boolean;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ 
  onComplete,
  isFirstLogin = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(isFirstLogin);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const totalSteps = tutorialSteps.length;
  const step = tutorialSteps[currentStep];
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const completeTutorial = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingCompleted', 'true');
    toast({
      title: 'Tutorial Completed!',
      description: 'You\'re all set to explore WizXConnect.',
    });
    onComplete();
  };
  
  const skipTutorial = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingCompleted', 'true');
    onComplete();
  };
  
  // Show tutorial based on localStorage on first render
  useEffect(() => {
    if (!isFirstLogin) {
      const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
      setIsVisible(!hasCompletedOnboarding);
    }
  }, [isFirstLogin]);
  
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  const avatarAnimation = getAvatarAnimation(step?.animation);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-card border rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="font-semibold text-lg">Onboarding Tutorial</h3>
          <Button variant="ghost" size="icon" onClick={skipTutorial}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step.id}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeIn}
              className="flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <motion.div
                initial={avatarAnimation.initial}
                animate={avatarAnimation.animate}
                className="mb-4"
              >
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <img 
                    src={getAvatarImage(step.avatar, user?.userType)} 
                    alt={step.avatar === 'farmer' ? 'Farmer Avatar' : 'Trader Avatar'} 
                    className="h-full w-full object-cover"
                  />
                </Avatar>
              </motion.div>
              
              {/* Content */}
              <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
              <p className="text-muted-foreground mb-4">{step.content}</p>
              
              {/* Step image if provided */}
              {step.image && (
                <div className="mb-4 rounded-md overflow-hidden border">
                  <img src={step.image} alt={step.title} className="w-full" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer with navigation */}
        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button variant="default" size="sm" onClick={nextStep}>
              {currentStep < totalSteps - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Finish'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingTutorial;