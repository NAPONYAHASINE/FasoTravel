import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLogger } from '../utils/logger';
import { authService } from '../services/api/auth.service';
import { storageService } from '../services/storage/localStorage.service';
import { isDevelopment } from '../shared/config/deployment';
import { STORAGE_CURRENT_USER, STORAGE_MANAGERS, STORAGE_CASHIERS } from '../shared/constants/storage';

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

/** Map auth.service role ('cashier'/'manager'/'responsable') → AuthContext role */
function mapRole(role: string): User['role'] {
  if (role === 'cashier') return 'caissier';
  if (role === 'manager') return 'manager';
  return 'responsable';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from storage
    const storedUser = storageService.get(STORAGE_CURRENT_USER) as User | null;
    if (storedUser && (storedUser as any).societyId) {
      setUser(storedUser);
    } else if (storedUser) {
      const raw = storedUser as any;
      setUser({
        id: raw.id,
        name: raw.name || raw.email,
        email: raw.email,
        role: mapRole(raw.role),
        societyId: raw.companyId || 'soc_1',
        societyName: raw.companyName || 'TSR - Transport Sayouba Rasmané',
        gareId: raw.gareId,
        gareName: raw.gareName,
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, _otp?: string) => {
    setLoading(true);
    logger.info('Tentative de connexion', { email });
    
    try {
      let authUser: User;

      if (isDevelopment()) {
        // En dev, auth.service cherche dans managers/cashiers du localStorage.
        // Pour le responsable, on vérifie si l'email contient 'responsable'
        // ou données mockées de base.
        const managers: any[] = storageService.get(STORAGE_MANAGERS) || [];
        const cashiers: any[] = storageService.get(STORAGE_CASHIERS) || [];
        const manager = managers.find((m: any) => m.email === email);
        const cashier = cashiers.find((c: any) => c.email === email);

        if (manager || cashier) {
          // Utiliser auth.service qui vérifie aussi le password
          const response = await authService.login({ email, password });
          const u = response.user as any;
          authUser = {
            id: u.id,
            name: u.name || email,
            email: u.email,
            role: mapRole(u.role),
            societyId: u.companyId || 'soc_1',
            societyName: u.companyName || 'TSR - Transport Sayouba Rasmané',
            gareId: u.gareId,
            gareName: u.gareName,
          };
        } else {
          // Inférer le rôle depuis l'email pour les comptes démo
          let inferredRole: User['role'] = 'responsable';
          if (email.includes('manager')) inferredRole = 'manager';
          else if (email.includes('caissier') || email.includes('cashier')) inferredRole = 'caissier';

          authUser = {
            id: inferredRole === 'manager' ? 'mgr_dev_1' : inferredRole === 'caissier' ? 'cash_dev_1' : 'resp_1',
            name: inferredRole === 'manager' ? 'Manager Dev' : inferredRole === 'caissier' ? 'Caissier Dev' : 'Jean Ouédraogo',
            email,
            role: inferredRole,
            societyId: 'soc_1',
            societyName: 'TSR - Transport Sayouba Rasmané',
            ...(inferredRole !== 'responsable' ? { gareId: 'gare_1', gareName: 'Gare Ouaga Centre' } : {}),
          };
        }
      } else {
        // Production: utiliser auth.service
        const response = await authService.login({ email, password });
        const u = response.user as any;
        authUser = {
          id: u.id,
          name: u.name || email,
          email: u.email,
          role: mapRole(u.role),
          societyId: u.companyId || '',
          societyName: u.companyName || '',
          gareId: u.gareId,
          gareName: u.gareName,
        };
      }

      setUser(authUser);
      storageService.set(STORAGE_CURRENT_USER, authUser);
      
      logger.info('✅ Connexion réussie', { 
        userId: authUser.id, 
        role: authUser.role,
        gareId: authUser.gareId 
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
    authService.logout();
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

