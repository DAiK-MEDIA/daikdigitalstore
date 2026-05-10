import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline';
  hover?: boolean;
}

const Card = ({ className, variant = 'default', hover = false, ...props }: CardProps) => {
  const variants = {
    default: 'bg-white border-surface-highest shadow-premium',
    glass: 'glass',
    outline: 'bg-white border-surface-highest',
  };

  return (
    <div
      className={cn(
        'card-premium p-6 border',
        variants[variant],
        hover && 'hover:-translate-y-1 hover:shadow-xl',
        className
      )}
      {...props}
    />
  );
};

export default Card;
