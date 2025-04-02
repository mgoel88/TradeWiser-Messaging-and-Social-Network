
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'wouter';

const steps = [
  {
    title: "Welcome to WizXConnect",
    content: "Your one-stop platform for agricultural commodity trading. Let's explore the key features!",
    image: "/onboarding/welcome.jpg"
  },
  {
    title: "Real-time Market Dashboard",
    content: "View live commodity prices, trends, and market analysis. Get instant notifications for price changes and market updates.",
    target: "[data-tour='market-dashboard']"
  },
  {
    title: "Smart Trading Tools",
    content: "Create buy/sell listings, negotiate prices, and manage contracts securely. Use templates for quick trade messages.",
    target: "[data-tour='trading']"
  },
  {
    title: "Connect & Network",
    content: "Build your network with verified traders, brokers, and processors. Join regional circles for better opportunities.",
    target: "[data-tour='connections']"
  },
  {
    title: "Secure Messaging",
    content: "Communicate directly with trading partners. Use pre-built templates for common trading scenarios.",
    target: "[data-tour='messaging']"
  },
  {
    title: "Contract Management",
    content: "Create, sign, and manage digital contracts. Share them easily with trading partners.",
    target: "[data-tour='contracts']"
  }
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const completed = localStorage.getItem('ftueCompleted');
    if (completed) {
      setIsOpen(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Navigate to relevant section based on step
      const step = steps[currentStep + 1];
      if (step.target) {
        const element = document.querySelector(step.target);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setIsOpen(false);
      localStorage.setItem('ftueCompleted', 'true');
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('ftueCompleted', 'true');
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <Card className="p-6">
          <div className="space-y-4">
            {currentStepData.image && (
              <div className="relative h-48 overflow-hidden rounded-lg">
                <img 
                  src={currentStepData.image} 
                  alt={currentStepData.title}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-muted-foreground">{currentStepData.content}</p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i === currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
