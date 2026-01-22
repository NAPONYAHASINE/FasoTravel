import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardHome from './DashboardHome';
import TrafficPage from './TrafficPage';
import RoutesPage from './RoutesPage';
import SchedulesPage from './SchedulesPage';
import PricingPage from './PricingPage';
import StationsPage from './StationsPage';
import ManagersPage from './ManagersPage';
import StoriesPage from './StoriesPage';
import ReviewsPage from './ReviewsPage';
import IncidentsPage from './IncidentsPage';
import AnalyticsPage from './AnalyticsPage';
import PoliciesPage from './PoliciesPage';
import SupportPage from './SupportPage';

export default function ResponsableDashboard() {
  return (
    <Routes>
      <Route path="/" element={
        <DashboardLayout role="responsable" title="Dashboard">
          <DashboardHome />
        </DashboardLayout>
      } />
      
      <Route path="/trafic" element={
        <DashboardLayout role="responsable" title="Carte & Trafic">
          <TrafficPage />
        </DashboardLayout>
      } />

      <Route path="/lignes" element={
        <DashboardLayout role="responsable" title="Lignes & Trajets">
          <RoutesPage />
        </DashboardLayout>
      } />

      <Route path="/horaires" element={
        <DashboardLayout role="responsable" title="Horaires Récurrents">
          <SchedulesPage />
        </DashboardLayout>
      } />

      <Route path="/tarification" element={
        <DashboardLayout role="responsable" title="Tarification">
          <PricingPage />
        </DashboardLayout>
      } />

      <Route path="/gares" element={
        <DashboardLayout role="responsable" title="Gares">
          <StationsPage />
        </DashboardLayout>
      } />

      <Route path="/managers" element={
        <DashboardLayout role="responsable" title="Managers">
          <ManagersPage />
        </DashboardLayout>
      } />

      <Route path="/stories" element={
        <DashboardLayout role="responsable" title="Stories & Marketing">
          <StoriesPage />
        </DashboardLayout>
      } />

      <Route path="/avis" element={
        <DashboardLayout role="responsable" title="Avis Clients">
          <ReviewsPage />
        </DashboardLayout>
      } />

      <Route path="/incidents" element={
        <DashboardLayout role="responsable" title="Incidents">
          <IncidentsPage />
        </DashboardLayout>
      } />

      <Route path="/analytics" element={
        <DashboardLayout role="responsable" title="Analytics">
          <AnalyticsPage />
        </DashboardLayout>
      } />

      <Route path="/politiques" element={
        <DashboardLayout role="responsable" title="Politiques Société">
          <PoliciesPage />
        </DashboardLayout>
      } />

      <Route path="/support" element={
        <DashboardLayout role="responsable" title="Support">
          <SupportPage />
        </DashboardLayout>
      } />
    </Routes>
  );
}



