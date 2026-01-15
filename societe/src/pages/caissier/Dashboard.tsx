import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardHome from './DashboardHome';
import TicketSalePage from './TicketSalePage';
import CashManagementPage from './CashManagementPage';
import PassengerListsPage from './PassengerListsPage';
import RefundPage from './RefundPage';
import HistoryPage from './HistoryPage';
import ReportPage from './ReportPage';
import DiagnosticDataPage from './DiagnosticDataPage';

export default function CaissierDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <DashboardLayout role="caissier" title="Dashboard Caissier">
          <DashboardHome />
        </DashboardLayout>
      } />
      
      <Route path="/vente" element={
        <DashboardLayout role="caissier" title="Vente de Billets">
          <TicketSalePage />
        </DashboardLayout>
      } />

      <Route path="/caisse" element={
        <DashboardLayout role="caissier" title="Gestion de Caisse">
          <CashManagementPage />
        </DashboardLayout>
      } />

      <Route path="/listes" element={
        <DashboardLayout role="caissier" title="Listes Passagers">
          <PassengerListsPage />
        </DashboardLayout>
      } />

      <Route path="/annulation" element={
        <DashboardLayout role="caissier" title="Annulation Billets">
          <RefundPage />
        </DashboardLayout>
      } />

      <Route path="/historique" element={
        <DashboardLayout role="caissier" title="Mon Historique">
          <HistoryPage />
        </DashboardLayout>
      } />

      <Route path="/signalement" element={
        <DashboardLayout role="caissier" title="Signaler un Problème">
          <ReportPage />
        </DashboardLayout>
      } />

      <Route path="/diagnostic" element={
        <DashboardLayout role="caissier" title="🔍 Diagnostic Données">
          <DiagnosticDataPage />
        </DashboardLayout>
      } />
    </Routes>
  );
}