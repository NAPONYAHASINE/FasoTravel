/**
 * @file ReconciliationPage.tsx
 * @description Payment reconciliation page
 */

import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function ReconciliationPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/payments')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Réconciliation des paiements</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Page en cours de développement...</p>
        <p className="text-sm text-gray-500 mt-2">Daily payment reconciliation tool</p>
      </div>
    </div>
  );
}
