import { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, Percent, User, FileText, Hash, Upload, ImageIcon, Coffee, Wifi, Snowflake, Plug, Tv, ShieldCheck, Armchair, Luggage, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { transportCompaniesService } from '../../services/entitiesService';
import { AppConfig } from '../../config/app.config';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function CreateCompanyModal({ isOpen, onClose, onSubmit, loading = false }: CreateCompanyModalProps) {
  const AMENITY_OPTIONS = [
    { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { value: 'coffee', label: 'Café', icon: Coffee },
    { value: 'ac', label: 'Climatisation', icon: Snowflake },
    { value: 'usb', label: 'Prises USB', icon: Plug },
    { value: 'toilet', label: 'Toilettes', icon: Armchair },
    { value: 'tv', label: 'Télévision', icon: Tv },
    { value: 'luggage', label: 'Bagages inclus', icon: Luggage }
  ];

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    email: '',
    phone: '',
    address: '',
    registrationNumber: '',
    taxId: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    managerPassword: '',
    managerPin: '',
    commission: 5,
    logo: '',
    amenities: [] as string[],
    luggagePrice: 0
  });

  const [showPassword, setShowPassword] = useState(false);

  // 🔥 Nouveau: Gestion du téléchargement de fichier
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (PNG, JPG, etc.)');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      legalName: '',
      email: '',
      phone: '',
      address: '',
      registrationNumber: '',
      taxId: '',
      contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      managerPassword: '',
      managerPin: '',
      commission: 5,
      logo: '',
      amenities: [],
      luggagePrice: 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div 
          className="p-6 text-white sticky top-0 z-10"
          style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 size={24} />
              <h2 className="text-2xl">Nouvelle Société de Transport</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Nom de la société *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Transport Express BF"
              />
            </div>
          </div>

          {/* Legal Name */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Nom juridique *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Transport et Services Routiers SA"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="contact@societe.bf"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Téléphone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+226 XX XX XX XX"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Adresse
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Adresse complète du siège..."
              />
            </div>
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Numéro d'enregistrement *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 123456789"
              />
            </div>
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              ID fiscal *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 123456789"
              />
            </div>
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Nom du contact *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Jean Dupont"
              />
            </div>
          </div>

          {/* Contact Person Phone */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Téléphone du contact *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.contactPersonPhone}
                onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="+226 XX XX XX XX"
              />
            </div>
          </div>

          {/* Contact Person Email */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Email du contact *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.contactPersonEmail}
                onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="contact@societe.bf"
              />
            </div>
          </div>

          {/* Manager Password */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe du gestionnaire *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.managerPassword}
                onChange={(e) => setFormData({ ...formData, managerPassword: e.target.value })}
                className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Minimum 8 caractères"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Mot de passe initial pour la connexion du responsable de la société
            </p>
          </div>

          {/* Manager PIN */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Code PIN à 6 chiffres *
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={formData.managerPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData({ ...formData, managerPin: val });
                }}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white tracking-[0.3em] font-mono"
                placeholder="000000"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PIN de sécurité à 6 chiffres pour les opérations sensibles (validation de billets, etc.)
            </p>
          </div>

          {/* Commission */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Commission plateforme (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="5"
                max="50"
                step="0.5"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: Math.max(5, parseFloat(e.target.value) || 5) })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Commission prélevée via Split PayDunya (par défaut : 5% — minimum : 5%)
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
              Si vous négociez un meilleur taux avec la société, augmentez ici. Jamais en dessous de 5%.
            </p>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Logo de la société
            </label>
            
            {/* Input file caché */}
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            {/* Bouton personnalisé */}
            {!formData.logo ? (
              <label
                htmlFor="logo-upload"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-red-500 dark:hover:border-red-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Cliquez pour télécharger le logo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG ou GIF (max. 2MB)
                  </p>
                </div>
              </label>
            ) : (
              <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                {/* Aperçu de l'image */}
                <div className="flex items-center gap-4">
                  <img
                    src={formData.logo}
                    alt="Aperçu du logo"
                    className="w-20 h-20 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Logo téléchargé avec succès
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cliquez sur "Changer" pour modifier
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <label
                      htmlFor="logo-upload"
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      Changer
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Le logo sera converti en base64 et stocké avec la société
            </p>
          </div>

          {/* Amenities / Services supplémentaires */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Services supplémentaires proposés
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Sélectionnez les services que cette société propose à bord
            </p>
            <div className="flex flex-wrap gap-3">
              {AMENITY_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    formData.amenities.includes(option.value) ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={formData.amenities.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, amenities: [...formData.amenities, option.value] });
                      } else {
                        const newAmenities = formData.amenities.filter(item => item !== option.value);
                        setFormData({ 
                          ...formData, 
                          amenities: newAmenities,
                          ...(option.value === 'luggage' ? { luggagePrice: 0 } : {})
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <option.icon className="w-5 h-5" />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Prix bagages - affiché uniquement si "luggage" est sélectionné */}
            {formData.amenities.includes('luggage') && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Prix des bagages (FCFA) *
                </label>
                <div className="relative">
                  <Luggage className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={formData.luggagePrice}
                    onChange={(e) => setFormData({ ...formData, luggagePrice: parseInt(e.target.value) || 0 })}
                    className="w-full pl-11 pr-4 py-3 border border-amber-300 dark:border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: 1500"
                  />
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Prix facturé par bagage supplémentaire
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
              style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer la société'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}