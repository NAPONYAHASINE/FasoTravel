import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardHome from './DashboardHome';
import LocalMapPage from './LocalMapPage';
import CashiersPage from './CashiersPage';
import SalesSupervisionPage from './SalesSupervisionPage';
import DeparturesPage from './DeparturesPage';
import IncidentsPage from './IncidentsPage';
import SupportPage from './SupportPage';

export default function ManagerDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <DashboardLayout role="manager" title="Dashboard Manager">
          <DashboardHome />
        </DashboardLayout>
      } />
      
      <Route path="/carte" element={
        <DashboardLayout role="manager" title="Carte Locale">
          <LocalMapPage />
        </DashboardLayout>
      } />

      <Route path="/caissiers" element={
        <DashboardLayout role="manager" title="Gestion Caissiers">
          <CashiersPage />
        </DashboardLayout>
      } />

      <Route path="/ventes" element={
        <DashboardLayout role="manager" title="Supervision Ventes">
          <SalesSupervisionPage />
        </DashboardLayout>
      } />

      <Route path="/departs" element={
        <DashboardLayout role="manager" title="Départs du Jour">
          <DeparturesPage />
        </DashboardLayout>
      } />

      <Route path="/incidents" element={
        <DashboardLayout role="manager" title="Gestion Incidents">
          <IncidentsPage />
        </DashboardLayout>
      } />

      <Route path="/support" element={
        <DashboardLayout role="manager" title="Support Admin">
          <SupportPage />
        </DashboardLayout>
      } />
    </Routes>
  );
}