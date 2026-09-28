import { useMemo } from 'react';

type Environment = 'preview' | 'live';

interface EnvironmentInfo {
  environment: Environment;
  label: string;
  isPreview: boolean;
}

/**
 * Detects whether the app is running in Preview or Live mode
 * based on the hostname.
 */
export function useEnvironment(): EnvironmentInfo {
  return useMemo(() => {
    const hostname = window.location.hostname;
    
    // Check for preview indicators in hostname
    const isPreview = 
      hostname.includes('preview') ||
      hostname.includes('lovableproject.com') ||
      hostname.includes('localhost') ||
      hostname.includes('127.0.0.1');
    
    return {
      environment: isPreview ? 'preview' : 'live',
      label: isPreview ? 'Preview' : 'Live',
      isPreview,
    };
  }, []);
}
