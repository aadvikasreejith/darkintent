import { useContext } from 'react';
import { OpportunitiesContext } from './OpportunitiesContextDef';

export function useOpportunities() {
  const context = useContext(OpportunitiesContext);
  if (!context) {
    throw new Error('useOpportunities must be used within an OpportunitiesProvider');
  }
  return context;
}
