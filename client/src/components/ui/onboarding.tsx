
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './sheet';
import { Button } from './button';
import { useRouter } from 'react-router-dom';

const steps = [
  {
    title: "Welcome to WizXConnect",
    content: "Your one-stop platform for agricultural commodity trading. Let's take a quick tour!",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1c5a1ec21"
  },
  {
    title: "Market Dashboard",
    content: "View real-time commodity prices, trending items, and market analysis all in one place.",
    target: "[data-tour='market-dashboard']",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3"
  },
  {
    title: "Trading Made Easy",
    content: "Create buy/sell listings, negotiate prices, and complete trades securely.",
    target: "[data-tour='trading']",
    image: "https://images.unsplash.com/photo-1459257868276-5e65389e2722"
  },
  {
    title: "Connect with Others",
    content: "Build your network with verified traders, brokers, and processors.",
    target: "[data-tour='connections']",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216"
  }
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsOpen(false);
      localStorage.setItem('ftueCompleted', 'true');
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('ftueCompleted', 'true');
  };

  useEffect(() => {
    const ftueCompleted = localStorage.getItem('ftueCompleted');
    if (ftueCompleted) {
      setIsOpen(false);
    }
  }, []);

  return (
    <Sheet open={isOpen}>
      <SheetContent className="w-[90%] sm:w-[540px] h-[80vh]">
        <SheetHeader>
          <SheetTitle>{steps[currentStep].title}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <img 
            src={steps[currentStep].image} 
            alt={steps[currentStep].title}
            className="w-full h-48 object-cover rounded-lg"
          />
          
          <p className="text-lg">{steps[currentStep].content}</p>

          <div className="flex justify-between items-center mt-8">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
