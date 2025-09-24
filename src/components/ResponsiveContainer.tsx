import React, { useState, useEffect, useCallback } from 'react';
import { generateTouchTargetCSS, getOptimalSpacing, createTouchOptimizedClasses, preventIOSZoom } from '../lib/touchOptimization';
import './ResponsiveContainer.css';

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  enableViewportDetection?: boolean;
  onViewportChange?: (viewport: ViewportInfo) => void;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

const getViewportInfo = (): ViewportInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.mobile,
    isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.tablet,
    orientation: width > height ? 'landscape' : 'portrait',
    devicePixelRatio: window.devicePixelRatio || 1,
  };
};

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  enableViewportDetection = true,
  onViewportChange,
}) => {
  const [viewport, setViewport] = useState<ViewportInfo>(getViewportInfo);

  const handleResize = useCallback(() => {
    const newViewport = getViewportInfo();
    setViewport(newViewport);
    onViewportChange?.(newViewport);
  }, [onViewportChange]);

  useEffect(() => {
    if (!enableViewportDetection) return;

    // Always use window resize events for better compatibility
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize, enableViewportDetection]);

  // Apply iOS zoom prevention
  useEffect(() => {
    const containerElement = document.querySelector('.responsive-container');
    if (containerElement) {
      preventIOSZoom(containerElement as HTMLElement);
    }
  }, []);

  // Determine device type for touch optimization
  const deviceType = viewport.isMobile ? 'mobile' : viewport.isTablet ? 'tablet' : 'desktop';
  const spacing = getOptimalSpacing(deviceType, viewport.orientation);
  const touchTargetCSS = generateTouchTargetCSS(deviceType);
  const touchOptimizedClasses = createTouchOptimizedClasses(deviceType);

  const containerClasses = [
    'responsive-container',
    viewport.isMobile && 'mobile',
    viewport.isTablet && 'tablet',
    viewport.isDesktop && 'desktop',
    viewport.orientation,
    touchOptimizedClasses,
    className,
  ].filter(Boolean).join(' ');

  const containerStyle = {
    ...touchTargetCSS,
    '--optimal-gap': `${spacing.gap}px`,
    '--optimal-padding': `${spacing.padding}px`,
    '--optimal-margin': `${spacing.margin}px`,
  } as React.CSSProperties;

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
      data-viewport-width={viewport.width}
      data-viewport-height={viewport.height}
      data-orientation={viewport.orientation}
      data-device-type={deviceType}
    >
      {children}
    </div>
  );
};

// Hook for accessing viewport information
export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportInfo>(getViewportInfo);

  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportInfo());
    };

    // Always use window resize events for better compatibility
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
};

export default ResponsiveContainer;