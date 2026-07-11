import { useState, useCallback, useEffect } from 'react';
import { getCurrentOrg } from '../services/orgService';
import { getProjects } from '../services/projectService';
import { OrgContext } from './orgContextObject';

export const OrgProvider = ({ children }) => {
  const [org, setOrg] = useState(null);
  const [role, setRole] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrg = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orgData, projectsData] = await Promise.all([getCurrentOrg(), getProjects()]);
      setOrg(orgData.organizacion);
      setRole(orgData.role);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error al cargar la organización:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshOrg();
  }, [refreshOrg]);

  const value = { org, role, isAdmin: role === 'admin', projects, isLoading, refreshOrg };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};
