import React, { useEffect, useRef, ReactNode } from 'react';
import './AutoScrollComponent.css';

interface AutoScrollComponentProps {
  children: ReactNode;
  className?: string;
}

const AutoScrollComponent: React.FC<AutoScrollComponentProps> = ({ children, className = '' }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div className={`auto-scroll-container ${className}`}>
      <div className="fade-overlay"></div>
      <div ref={scrollAreaRef} className="scroll-content">
        {children}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default AutoScrollComponent;