import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createLogger } from '../utils/logger';
import { authService } from '../services/api/auth.service';
import { storageService } from '../services/storage/localStorage.service';
import { isDevelopment } from '../shared/config/deployment';
import { STORAGE_CURRENT_USER } from '../shared/constants/storage';

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

  const login = async (email: string, password: string, otp?: string) => {
    logger.info('Tentative de connexion', { email });
    
    try {
      let authUser: User;

      if (isDevelopment()) {
        // Dev mode: 2 étapes identiques au mode prod
        if (otp) {
          // Étape 2: vérifier OTP — valide le code exact généré au login
          const response = await authService.verifyOtp(email, otp);
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
          // Étape 1: valider identifiants puis retourner sans authentifier (OTP requis)
          await authService.login({ email, password });
          // En dev, login() retourne l'user mais on NE l'authentifie PAS encore
          // Le caller (LoginPage) passera à l'étape OTP
          return;
        }
      } else {
        // Production: 2 étapes — login (OTP envoyé via WhatsApp) puis verifyOtp
        if (otp) {
          // Étape 2: vérifier OTP — le backend retourne user + tokens
          const response = await authService.verifyOtp(email, otp);
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
        } else {
          // Étape 1: login — le backend génère et envoie l'OTP via WhatsApp
          const response = await authService.login({ email, password });
          if (response.otpRequired) {
            // OTP demandé, on ne peut pas encore authentifier
            // Le caller (LoginPage) passera à l'étape OTP
            return;
          }
          // Fallback: si le backend retourne directement des tokens (ne devrait pas arriver pour societe)
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

