import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      setTransitionStage('exit');
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
        prevLocation.current = location;
      }, 150);
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [children, location]);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        transitionStage === 'enter' 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-1'
      }`}
    >
      {displayChildren}
    </div>
  );
}
