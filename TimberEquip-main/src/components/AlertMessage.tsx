import React from 'react';

interface AlertMessageProps {
  severity: 'error' | 'warning' | 'info' | 'success';
  children: React.ReactNode;
  className?: string;
}

const severityStyles = {
  error: 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300',
  warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  success: 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-800 dark:text-green-300',
};

export const AlertMessage: React.FC<AlertMessageProps> = ({ severity, children, className = '' }) => (
  <div role="alert" className={`border rounded-sm px-4 py-3 text-sm font-medium ${severityStyles[severity]} ${className}`}>
    {children}
  </div>
);
