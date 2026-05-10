import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'processing' | 'delivered' | 'cancelled' | 'default';
}

const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-surface-container text-on-surface-variant',
    pending: 'bg-pending/10 text-secondary-container border border-pending/20',
    processing: 'bg-blue-100 text-blue-700 border border-blue-200',
    delivered: 'bg-success/10 text-success border border-success/20',
    cancelled: 'bg-error/10 text-error border border-error/20',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export default Badge;
