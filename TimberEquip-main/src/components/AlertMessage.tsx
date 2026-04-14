import React from 'react';

interface AlertMessageProps {
  severity: 'error' | 'warning' | 'info' | 'success';
  children: React.ReactNode;
  className?: string;
}

const severityStyles = {
  error: 'bg-red-500/10 border-red-500/20 text-red-600',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
  info: 'bg-data/10 border-data/20 text-data',
  success: 'bg-accent/10 border-accent/20 text-accent',
};

export const AlertMessage: React.FC<AlertMessageProps> = ({ severity, children, className = '' }) => (
  <div role="alert" className={`border rounded-sm px-4 py-3 text-sm font-medium ${severityStyles[severity]} ${className}`}>
    {children}
  </div>
);
