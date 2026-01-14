import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type NavigationContextType = {
  currentPage: string;
  navigate: (page: string) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

type NavigationProviderProps = {
  children: ReactNode;
};

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState(window.location.pathname);

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.history.pushState({}, '', page);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentPage, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;