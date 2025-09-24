import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false
}) => {
  const containerClass = fullScreen ? 'loading-container fullscreen' : 'loading-container';

  return (
    <div className={containerClass} data-testid="loading-spinner">
      <div className={`spinner ${size}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && (
        <div className="loading-message" data-testid="loading-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;