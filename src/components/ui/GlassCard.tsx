import React, { ReactNode, HTMLAttributes, FC } from 'react';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const GlassCard: FC<GlassCardProps> = ({ children, className = '', title, ...props }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-sm md:backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-2xl p-3 md:p-6 ${className}`} {...props}>
      {title && <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
