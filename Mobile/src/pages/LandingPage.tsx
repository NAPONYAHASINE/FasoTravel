import type { Page } from '../App';
/**
 * LandingPage - Page d'accueil publique (non authentifiée)
 * 
 * Présente l'application TransportBF et invite à se connecter/créer un compte
 * Nouvelle palette : Vert (primaire), Or/Jaune (accent)
 */

import { Bus, MapPin, CreditCard, Shield, Clock, Users, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import brandLogo from '../assets/brand/logo.png';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 dark:from-green-700 dark:via-green-800 dark:to-green-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Logo & Nav */}
            <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src={brandLogo} 
                    alt="FasoTravel"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl">FasoTravel</h1>
                  <p className="text-xs text-green-100">Voyagez en toute sérénité</p>
                </div>
              </div>
              
              <Button
                onClick={() => onNavigate('auth')}
                variant="outline"
                className="bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/20 text-white hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm"
              >
                Se connecter
              </Button>
            </div>

            {/* Hero Content */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <div className="inline-block bg-yellow-400/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <span className="text-yellow-300 text-sm">🇧🇫 Transport interurbain au Burkina Faso</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl mb-6 leading-tight">
                  Réservez vos trajets en quelques clics
                </h2>
                
                <p className="text-xl text-green-100 mb-8 leading-relaxed">
                  La première plateforme digitale de réservation de transport interurbain au Burkina Faso. 
                  Simple, rapide et sécurisé.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => onNavigate('auth')}
                    size="lg"
                    className="bg-yellow-400 text-green-900 hover:bg-yellow-500 text-lg px-8"
                  >
                    Créer un compte
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/20 text-white hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm text-lg"
                  >
                    Comment ça marche ?
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/20">
                  <div>
                    <p className="text-3xl mb-1">15+</p>
                    <p className="text-sm text-green-200">Compagnies partenaires</p>
                  </div>
                  <div>
                    <p className="text-3xl mb-1">50+</p>
                    <p className="text-sm text-green-200">Villes desservies</p>
                  </div>
                  <div>
                    <p className="text-3xl mb-1">10k+</p>
                    <p className="text-sm text-green-200">Réservations</p>
                  </div>
                </div>
              </div>

              {/* Hero Image/Mockup */}
              <div className="relative hidden md:block">
                <div className="relative z-10">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 transform rotate-2">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-600 dark:bg-green-500 rounded-xl flex items-center justify-center">
                          <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Trajet</p>
                          <p className="text-gray-900 dark:text-white">Ouagadougou → Bobo</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Départ</span>
                          <span className="text-green-600 dark:text-green-400">08:00</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Places disponibles</span>
                          <span className="text-gray-900 dark:text-white">12</span>
                        </div>
                      </div>
                      <div className="bg-green-600 dark:bg-green-500 text-white rounded-xl p-3 text-center">
                        5,000 FCFA
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 blur-2xl"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-green-400 rounded-full opacity-20 blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-6 py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 dark:text-white mb-4">
              Pourquoi choisir FasoTravel ?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Une expérience de réservation moderne, pensée pour les voyageurs burkinabè
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">Réservation rapide</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Réservez votre place en moins de 3 minutes. Recherchez, sélectionnez, payez. C'est simple !
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">Paiement sécurisé</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Orange Money, Moov Money, cartes bancaires. Vos paiements sont 100% sécurisés.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">Billets digitaux</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Plus besoin d'imprimer ! Vos billets sont accessibles directement depuis votre téléphone.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">Gares à proximité</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Trouvez facilement les gares proches de vous et consultez les prochains départs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">Réservation groupe</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Voyagez en famille ou entre amis ! Réservez plusieurs places en une seule fois.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">Annulation flexible</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Changement de plans ? Annulez jusqu'à 1h avant le départ et récupérez votre argent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-gray-900 dark:text-white mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              4 étapes simples pour réserver votre voyage
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', icon: '🔍', title: 'Recherchez', desc: 'Entrez votre ville de départ et d\'arrivée' },
              { step: '2', icon: '🎫', title: 'Sélectionnez', desc: 'Choisissez votre horaire et vos sièges' },
              { step: '3', icon: '💳', title: 'Payez', desc: 'Réglez en toute sécurité avec votre moyen préféré' },
              { step: '4', icon: '✅', title: 'Voyagez', desc: 'Présentez votre billet digital et bon voyage !' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-full flex items-center justify-center mx-auto text-4xl">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-20 bg-gradient-to-br from-green-600 to-green-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl mb-6">
            Prêt à voyager autrement ?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers de voyageurs qui utilisent déjà TransportBF pour leurs déplacements
          </p>
          <Button
            onClick={() => onNavigate('auth')}
            size="lg"
            className="bg-yellow-400 text-green-900 hover:bg-yellow-500 text-lg px-12"
          >
            Créer mon compte gratuitement
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-12 bg-gray-900 dark:bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-400 dark:bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Bus className="w-5 h-5 text-green-800 dark:text-green-900" />
                </div>
                <span className="text-lg">FasoTravel</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                La solution digitale pour vos voyages au Burkina Faso
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 text-white">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li className="hover:text-gray-300 cursor-pointer">Fonctionnalités</li>
                <li className="hover:text-gray-300 cursor-pointer">Tarifs</li>
                <li className="hover:text-gray-300 cursor-pointer">Compagnies</li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li className="hover:text-gray-300 cursor-pointer">Centre d'aide</li>
                <li className="hover:text-gray-300 cursor-pointer">Contact</li>
                <li className="hover:text-gray-300 cursor-pointer">FAQ</li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 text-white">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
                <li className="hover:text-gray-300 transition-colors">
                  <button
                    onClick={() => onNavigate('terms-conditions')}
                    className="text-inherit hover:underline mr-2"
                  >
                    Conditions d'utilisation
                  </button>
                  <span className="mx-1 text-gray-400">|</span>
                  <button
                    onClick={() => onNavigate('terms-conditions')}
                    className="text-inherit hover:underline ml-2"
                  >
                    Confidentialité
                  </button>
                </li>
                <li className="hover:text-gray-300 cursor-pointer transition-colors">
                  Mentions légales
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 dark:border-gray-900 text-center text-sm text-gray-400 dark:text-gray-500">
            © 2025 FasoTravel. Tous droits réservés.
          </div>
        </div>
      </div>
    </div>
  );
}
