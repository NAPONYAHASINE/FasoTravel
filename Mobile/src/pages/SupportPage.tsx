/**
 * SupportPage - Page de support et aide
 * 
 * DEV NOTES:
 * - Endpoint: POST /support/contact
 * - Event: support_message_sent
 * - FAQ statique pour réduire les contacts
 */

import { useState } from 'react';
import { Headphones, Mail, Phone, MessageCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface SupportPageProps {
  onBack?: () => void;
  user?: { name?: string; email?: string; phone?: string } | null;
  onNavigate?: (page: any, data?: any) => void;
}

export function SupportPage({ onBack, user, onNavigate }: SupportPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Comment puis-je annuler mon billet ?",
      answer: "Vous pouvez annuler votre billet jusqu'à 1 heure avant le départ depuis la page de détails du billet. Le remboursement sera effectué selon les conditions de la société de transport."
    },
    {
      question: "Comment transférer mon billet à quelqu'un d'autre ?",
      answer: "Accédez à votre billet, cliquez sur 'Transférer', puis entrez le numéro de téléphone du destinataire. Il recevra un code de transfert sécurisé."
    },
    {
      question: "Quels moyens de paiement sont acceptés ?",
      answer: "Nous acceptons Orange Money, Moov Money, et les cartes bancaires (Visa, Mastercard). Le paiement est sécurisé et crypté."
    },
    {
      question: "Que faire si je perds mon billet ?",
      answer: "Votre billet est sauvegardé dans votre compte. Vous pouvez le consulter à tout moment dans l'onglet 'Billets'. Le code alphanumérique peut être utilisé comme preuve."
    },
    {
      question: "Comment suivre mon véhicule en temps réel ?",
      answer: "Pour les trajets avec suivi GPS, vous verrez un bouton 'Suivre' sur la page du billet. Cela vous montrera la position en temps réel du véhicule."
    },
    {
      question: "Puis-je réserver plusieurs places ?",
      answer: "Oui, lors de la sélection des sièges, vous pouvez choisir plusieurs places pour différents passagers. Chaque place aura son propre billet."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-8">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 text-white px-4 sm:px-6 py-8 sm:py-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="flex items-center gap-3 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl">Centre d'aide</h1>
              <p className="text-sm opacity-90 mt-1">Nous sommes là pour vous aider</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Contact rapide */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <a 
            href="tel:+22670000000" 
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 border border-gray-100 dark:border-gray-700"
            onClick={() => feedback.tap()}
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Appelez-nous</p>
              <p className="text-sm text-gray-900 dark:text-white">+226 70 00 00 00</p>
            </div>
          </a>

          <a 
            href="mailto:support@transportbf.com" 
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 border border-gray-100 dark:border-gray-700"
            onClick={() => feedback.tap()}
          >
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm text-gray-900 dark:text-white">support@transportbf.com</p>
            </div>
          </a>

          <a 
            href="#chat" 
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 border border-gray-100 dark:border-gray-700 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              feedback.tap();
              onNavigate?.('chat');
            }}
          >
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chat</p>
              <p className="text-sm text-gray-900 dark:text-white">Chat en direct</p>
            </div>
          </a>
        </motion.div>

        {/* FAQ */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg text-gray-900 dark:text-white">Questions fréquentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <button
                  onClick={() => {
                    feedback.tap();
                    setExpandedFaq(expandedFaq === index ? null : index);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-sm text-gray-900 dark:text-white pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <motion.div 
                    className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Horaires */}
        <motion.div 
          className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-green-900 dark:text-green-300">
            <strong>Horaires du support:</strong> Lundi - Vendredi: 8h - 18h | Samedi: 9h - 14h
          </p>
        </motion.div>
      </div>
    </div>
  );
}