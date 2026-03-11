/**
 * @file ReportsPage.tsx
 * @description Analytics reports page
 */

import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function ReportsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/analytics')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Rapports & Exports</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Page en cours de développement...</p>
        <p className="text-sm text-gray-500 mt-2">Export tools: CSV, Excel, PDF</p>
      </div>
    </div>
  );
}
