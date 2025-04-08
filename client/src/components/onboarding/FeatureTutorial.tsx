import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FeatureStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

interface FeatureTutorialProps {
  featureId: string;
  steps: FeatureStep[];
  onComplete: () => void;
}

export const FeatureTutorial: React.FC<FeatureTutorialProps> = ({
  featureId,
  steps,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { toast } = useToast();
  
  const currentStep = steps[currentStepIndex];
  
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeFeatureTutorial();
    }
  };
  
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const completeFeatureTutorial = () => {
    setIsVisible(false);
    
    // Save that this feature tutorial was completed
    const completedTutorials = JSON.parse(localStorage.getItem('completedFeatureTutorials') || '{}');
    completedTutorials[featureId] = true;
    localStorage.setItem('completedFeatureTutorials', JSON.stringify(completedTutorials));
    
    toast({
      title: 'Feature Tour Completed',
      description: 'You now know how to use this feature!',
    });
    
    onComplete();
  };
  
  const skipTutorial = () => {
    setIsVisible(false);
    
    // Save that this feature tutorial was skipped
    const completedTutorials = JSON.parse(localStorage.getItem('completedFeatureTutorials') || '{}');
    completedTutorials[featureId] = true;
    localStorage.setItem('completedFeatureTutorials', JSON.stringify(completedTutorials));
    
    onComplete();
  };
  
  // Calculate position of tooltip based on target element
  useEffect(() => {
    if (!currentStep.targetSelector) return;
    
    const calculatePosition = () => {
      const targetElement = document.querySelector(currentStep.targetSelector || '');
      
      if (!targetElement) return;
      
      const rect = targetElement.getBoundingClientRect();
      const placement = currentStep.placement || 'bottom';
      
      // Set position based on placement
      if (placement === 'top') {
        setPosition({
          top: rect.top - 10,
          left: rect.left + rect.width / 2
        });
      } else if (placement === 'right') {
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + 10
        });
      } else if (placement === 'bottom') {
        setPosition({
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2
        });
      } else if (placement === 'left') {
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.left - 10
        });
      }
      
      // Highlight the target element
      targetElement.classList.add('tutorial-highlight');
    };
    
    calculatePosition();
    
    // Add resize listener to recalculate position
    window.addEventListener('resize', calculatePosition);
    
    return () => {
      // Clean up
      window.removeEventListener('resize', calculatePosition);
      
      // Remove highlight from target element
      if (currentStep.targetSelector) {
        const targetElement = document.querySelector(currentStep.targetSelector || '');
        targetElement?.classList.remove('tutorial-highlight');
      }
    };
  }, [currentStep]);
  
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="bg-card border rounded-lg shadow-lg max-w-xs w-full p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">{currentStep.title}</h4>
            <Button variant="ghost" size="icon" onClick={skipTutorial} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {currentStepIndex + 1} of {steps.length}
            </div>
            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={prevStep} className="h-8 text-xs px-2">
                  Back
                </Button>
              )}
              <Button variant="default" size="sm" onClick={nextStep} className="h-8 text-xs px-2">
                {currentStepIndex < steps.length - 1 ? 'Next' : 'Finish'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeatureTutorial;