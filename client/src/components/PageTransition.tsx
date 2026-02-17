import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setIsVisible(true);
        prevLocation.current = location;
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [location]);

  return (
    <div
      className={`transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
