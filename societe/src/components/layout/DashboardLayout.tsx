import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'responsable' | 'manager' | 'caissier';
  title: string;
  showSearch?: boolean;
}

export default function DashboardLayout({ children, role, title, showSearch }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Sidebar role={role} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header title={title} showSearch={showSearch} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

