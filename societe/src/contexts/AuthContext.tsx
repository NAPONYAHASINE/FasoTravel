import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLogger } from '../utils/logger';

// Logger pour l'authentification
const logger = createLogger('AuthContext', 'auth');

interface User {
  id: string;
  name: string;
  email: string;
  role: 'responsable' | 'manager' | 'caissier';
  societyId: string;
  societyName: string;
  gareId?: string;
  gareName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, otp?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté (localStorage)
    const storedUser = localStorage.getItem('transportbf_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, otp?: string) => {
    setLoading(true);
    logger.info('Tentative de connexion', { email });
    
    try {
      // TODO: Remplacer par un vrai appel API
      // Simulation pour le développement
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user based on email
      let mockUser: User;
      
      if (email.includes('responsable')) {
        mockUser = {
          id: '1',
          name: 'Jean Ouédraogo',
          email: email,
          role: 'responsable',
          societyId: 'soc_1',
          societyName: 'TSR - Transport Sayouba Rasmané'
        };
      } else if (email.includes('manager')) {
        mockUser = {
          id: '2',
          name: 'Marie Kaboré',
          email: email,
          role: 'manager',
          societyId: 'soc_1',
          societyName: 'TSR - Transport Sayouba Rasmané',
          gareId: 'gare_1',
          gareName: 'Gare Routière de Ouagadougou'
        };
      } else {
        mockUser = {
          id: 'cash_1', // ✅ CORRIGÉ: doit correspondre aux IDs des transactions mockées
          name: 'Ibrahim Sawadogo',
          email: email,
          role: 'caissier',
          societyId: 'soc_1',
          societyName: 'TSR - Transport Sayouba Rasmané',
          gareId: 'gare_1',
          gareName: 'Gare Routière de Ouagadougou'
        };
      }

      setUser(mockUser);
      localStorage.setItem('transportbf_user', JSON.stringify(mockUser));
      
      logger.info('✅ Connexion réussie', { 
        userId: mockUser.id, 
        role: mockUser.role,
        gareId: mockUser.gareId 
      });
    } catch (error) {
      logger.error('❌ Erreur lors de la connexion', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logger.info('Déconnexion', { userId: user?.id, role: user?.role });
    setUser(null);
    localStorage.removeItem('transportbf_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}