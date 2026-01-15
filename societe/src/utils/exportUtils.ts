/**
 * Utilitaires pour l'export de données
 * Centralise les fonctions d'export CSV, Excel, PDF
 */

/**
 * Exporte des données au format CSV
 * @param data - Tableau de données (objets ou tableaux)
 * @param headers - En-têtes des colonnes
 * @param filename - Nom du fichier (sans extension)
 */
export const exportToCSV = (
  data: any[],
  headers: string[],
  filename: string
): void => {
  // Convertir les données en lignes CSV
  const csvRows = data.map(row => {
    const values = Array.isArray(row) ? row : Object.values(row);
    // Échapper les guillemets et les virgules
    return values.map(value => {
      const stringValue = String(value ?? '');
      // Si la valeur contient une virgule ou des guillemets, l'entourer de guillemets
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Créer le contenu CSV
  const csv = `${headers.join(',')}\n${csvRows.join('\n')}`;
  
  // Créer le blob et télécharger
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM pour Excel
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exporte un tableau d'objets en CSV
 * @param data - Tableau d'objets
 * @param filename - Nom du fichier
 */
export const exportObjectsToCSV = (
  data: Record<string, any>[],
  filename: string
): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => Object.values(obj));
  
  exportToCSV(rows, headers, filename);
};

/**
 * Exporte un rapport analytics complet au format CSV (compatible Excel)
 * @param data - Données du rapport analytics
 * @param filename - Nom du fichier
 */
export const exportAnalyticsToExcel = (data: {
  kpis: {
    totalRevenue: number;
    netProfit: number;
    profitMargin: string;
    totalPassengers: number;
    occupancyRate: number;
    onlineRevenue: number;
    counterRevenue: number;
    onlineCommission: number;
    onlineTicketsCount: number;
    counterTicketsCount: number;
    growthRate: string;
  };
  revenueData: Array<{ name: string; revenus: number; depenses?: number }>;
  stationsPerformance: Array<{ station: string; ventes: number; taux: number }>;
  period: 'week' | 'month' | 'year';
}, filename: string = 'rapport-analytics'): void => {
  const rows: string[] = [];
  
  // En-tête du rapport
  rows.push('RAPPORT ANALYTICS TRANSPORTBF');
  rows.push(`Période: ${data.period === 'week' ? 'Cette semaine' : data.period === 'month' ? 'Ce mois' : 'Cette année'}`);
  rows.push(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`);
  rows.push('');
  
  // Section KPIs
  rows.push('=== INDICATEURS CLÉS ===');
  rows.push(`Chiffre d'affaires,${data.kpis.totalRevenue} FCFA`);
  rows.push(`Revenu net,${data.kpis.netProfit} FCFA`);
  rows.push(`Marge bénéficiaire,${data.kpis.profitMargin}%`);
  rows.push(`Total passagers,${data.kpis.totalPassengers}`);
  rows.push(`Taux d'occupation,${data.kpis.occupancyRate}%`);
  rows.push(`Taux de croissance,${data.kpis.growthRate}%`);
  rows.push('');
  
  // Section Canaux de vente
  rows.push('=== RÉPARTITION PAR CANAL ===');
  rows.push(`Ventes App Mobile,${data.kpis.onlineRevenue} FCFA,${data.kpis.onlineTicketsCount} billets,${data.kpis.onlineCommission} FCFA commission`);
  rows.push(`Ventes Guichet,${data.kpis.counterRevenue} FCFA,${data.kpis.counterTicketsCount} billets,0 FCFA commission`);
  rows.push('');
  
  // Section Évolution des revenus
  rows.push('=== ÉVOLUTION DES REVENUS ===');
  rows.push('Période,Revenus (FCFA),Dépenses (FCFA)');
  data.revenueData.forEach(item => {
    rows.push(`${item.name},${item.revenus},${item.depenses || 0}`);
  });
  rows.push('');
  
  // Section Performance des gares
  rows.push('=== PERFORMANCE PAR GARE ===');
  rows.push('Gare,Ventes (FCFA),Taux d\'occupation (%)');
  data.stationsPerformance.forEach(station => {
    rows.push(`${station.station},${station.ventes},${station.taux}`);
  });
  
  // Créer le CSV
  const csv = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exporte un rapport analytics au format PDF (via impression)
 * @param data - Données du rapport
 * @param filename - Nom du fichier
 */
export const exportAnalyticsToPDF = (data: {
  kpis: {
    totalRevenue: number;
    netProfit: number;
    profitMargin: string;
    totalPassengers: number;
    occupancyRate: number;
    onlineRevenue: number;
    counterRevenue: number;
    onlineCommission: number;
    onlineTicketsCount: number;
    counterTicketsCount: number;
    growthRate: string;
    isPositiveGrowth: boolean;
  };
  revenueData: Array<{ name: string; revenus: number; depenses?: number }>;
  stationsPerformance: Array<{ station: string; ventes: number; taux: number }>;
  period: 'week' | 'month' | 'year';
}, filename: string = 'rapport-analytics'): void => {
  // Créer une fenêtre d'impression avec HTML structuré
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour exporter en PDF');
    return;
  }
  
  const formatCurrency = (value: number) => value.toLocaleString('fr-FR');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        @page { margin: 1cm; }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #dc2626;
          border-bottom: 3px solid #f59e0b;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h2 {
          color: #16a34a;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .header-info {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .kpi-card {
          border: 1px solid #e5e7eb;
          padding: 15px;
          border-radius: 8px;
          background: #fff;
        }
        .kpi-label {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .kpi-value {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          border-bottom: 2px solid #d1d5db;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <h1>📊 Rapport Analytics TransportBF</h1>
      
      <div class="header-info">
        <strong>Période:</strong> ${data.period === 'week' ? 'Cette semaine' : data.period === 'month' ? 'Ce mois' : 'Cette année'}<br>
        <strong>Date d'export:</strong> ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      
      <h2>📈 Indicateurs Clés de Performance</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Chiffre d'affaires</div>
          <div class="kpi-value">${formatCurrency(data.kpis.totalRevenue)} FCFA</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Revenu net</div>
          <div class="kpi-value">${formatCurrency(data.kpis.netProfit)} FCFA</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Marge bénéficiaire</div>
          <div class="kpi-value">${data.kpis.profitMargin}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total passagers</div>
          <div class="kpi-value">${formatCurrency(data.kpis.totalPassengers)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Taux d'occupation</div>
          <div class="kpi-value">${data.kpis.occupancyRate}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Taux de croissance</div>
          <div class="kpi-value ${data.kpis.isPositiveGrowth ? 'positive' : 'negative'}">
            ${data.kpis.isPositiveGrowth ? '+' : ''}${data.kpis.growthRate}%
          </div>
        </div>
      </div>
      
      <h2>📱 Répartition par Canal de Vente</h2>
      <table>
        <thead>
          <tr>
            <th>Canal</th>
            <th>Revenus</th>
            <th>Billets vendus</th>
            <th>Commission</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>📱 App Mobile</td>
            <td><strong>${formatCurrency(data.kpis.onlineRevenue)} FCFA</strong></td>
            <td>${data.kpis.onlineTicketsCount}</td>
            <td>${formatCurrency(data.kpis.onlineCommission)} FCFA</td>
          </tr>
          <tr>
            <td>🏪 Guichet</td>
            <td><strong>${formatCurrency(data.kpis.counterRevenue)} FCFA</strong></td>
            <td>${data.kpis.counterTicketsCount}</td>
            <td>0 FCFA</td>
          </tr>
        </tbody>
      </table>
      
      <h2>💰 Évolution des Revenus</h2>
      <table>
        <thead>
          <tr>
            <th>Période</th>
            <th>Revenus</th>
            ${data.revenueData[0]?.depenses !== undefined ? '<th>Dépenses</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${data.revenueData.map(item => `
            <tr>
              <td>${item.name}</td>
              <td><strong>${formatCurrency(item.revenus)} FCFA</strong></td>
              ${item.depenses !== undefined ? `<td>${formatCurrency(item.depenses)} FCFA</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>🚏 Performance par Gare</h2>
      <table>
        <thead>
          <tr>
            <th>Gare</th>
            <th>Ventes</th>
            <th>Taux d'occupation</th>
          </tr>
        </thead>
        <tbody>
          ${data.stationsPerformance.map(station => `
            <tr>
              <td>${station.station}</td>
              <td><strong>${formatCurrency(station.ventes)} FCFA</strong></td>
              <td>${station.taux}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <strong>TransportBF Dashboard</strong> • Rapport généré automatiquement<br>
        © ${new Date().getFullYear()} - Tous droits réservés
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          // Fermer après impression (optionnel)
          // window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};