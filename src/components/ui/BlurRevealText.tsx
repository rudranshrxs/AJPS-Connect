import React from 'react';

interface BlurRevealTextProps {
  text: string;
  initialDelay?: number;
  className?: string;
}

export function BlurRevealText({ text, initialDelay = 0, className = '' }: BlurRevealTextProps) {
  const words = text.split(' ');

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          style={{ 
            animation: 'blurToClear 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards', 
            animationDelay: `${initialDelay + (index * 0.15)}s`, 
            opacity: 0, 
            display: 'inline-block', 
            marginRight: '0.25em' 
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
