import { useContext } from 'react';
import { OrgContext } from '../context/orgContextObject';

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg debe usarse dentro de un OrgProvider');
  }
  return context;
};
