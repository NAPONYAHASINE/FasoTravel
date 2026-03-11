import { useCallback } from 'react';
import { useNotifications } from './useNotifications';

/**
 * TYPE DEFINITIONS
 */
export type ExportFormat = 'csv' | 'json' | 'excel';

export interface ExportOptions {
  filename?: string;
  format?: ExportFormat;
  headers?: string[];
  transform?: (data: any) => any;
}

/**
 * HOOK useExport
 * Gestion de l'export de données pour Admin et Société
 * Support CSV, JSON et Excel
 */
export function useExport() {
  const notify = useNotifications();

  /**
   * Convertir des données en CSV
   */
  const toCSV = useCallback((data: any[], headers?: string[]): string => {
    if (data.length === 0) return '';

    // Obtenir les headers depuis le premier objet si non fournis
    const csvHeaders = headers || Object.keys(data[0]);

    // Créer les lignes CSV
    const headerLine = csvHeaders.join(',');
    const dataLines = data.map((row) => {
      return csvHeaders
        .map((header) => {
          const value = row[header];
          // Échapper les guillemets et entourer de guillemets si nécessaire
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',');
    });

    return [headerLine, ...dataLines].join('\n');
  }, []);

  /**
   * Télécharger un fichier
   */
  const downloadFile = useCallback((content: string | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Exporter en CSV
   */
  const exportToCSV = useCallback(
    (data: any[], options: ExportOptions = {}) => {
      try {
        const transformedData = options.transform ? data.map(options.transform) : data;
        const csv = toCSV(transformedData, options.headers);
        const filename = options.filename || `export-${Date.now()}.csv`;
        
        downloadFile(csv, filename, 'text/csv;charset=utf-8;');
        notify.success('Export réussi', {
          description: `Le fichier ${filename} a été téléchargé`,
        });
      } catch (error) {
        console.error('Error exporting to CSV:', error);
        notify.error('Erreur lors de l\'export CSV');
      }
    },
    [toCSV, downloadFile, notify]
  );

  /**
   * Exporter en JSON
   */
  const exportToJSON = useCallback(
    (data: any[], options: ExportOptions = {}) => {
      try {
        const transformedData = options.transform ? data.map(options.transform) : data;
        const json = JSON.stringify(transformedData, null, 2);
        const filename = options.filename || `export-${Date.now()}.json`;
        
        downloadFile(json, filename, 'application/json;charset=utf-8;');
        notify.success('Export réussi', {
          description: `Le fichier ${filename} a été téléchargé`,
        });
      } catch (error) {
        console.error('Error exporting to JSON:', error);
        notify.error('Erreur lors de l\'export JSON');
      }
    },
    [downloadFile, notify]
  );

  /**
   * Exporter en Excel (format CSV compatible Excel)
   */
  const exportToExcel = useCallback(
    (data: any[], options: ExportOptions = {}) => {
      try {
        const transformedData = options.transform ? data.map(options.transform) : data;
        // Excel préfère le séparateur point-virgule et l'encodage UTF-8 BOM
        const csv = toCSV(transformedData, options.headers).replace(/,/g, ';');
        const bom = '\uFEFF'; // UTF-8 BOM pour Excel
        const filename = options.filename || `export-${Date.now()}.csv`;
        
        downloadFile(bom + csv, filename, 'text/csv;charset=utf-8;');
        notify.success('Export réussi', {
          description: `Le fichier ${filename} a été téléchargé`,
        });
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        notify.error('Erreur lors de l\'export Excel');
      }
    },
    [toCSV, downloadFile, notify]
  );

  /**
   * Export générique qui détecte le format
   */
  const exportData = useCallback(
    (data: any[], options: ExportOptions = {}) => {
      const format = options.format || 'csv';

      switch (format) {
        case 'csv':
          return exportToCSV(data, options);
        case 'json':
          return exportToJSON(data, options);
        case 'excel':
          return exportToExcel(data, options);
        default:
          notify.error(`Format d'export non supporté: ${format}`);
      }
    },
    [exportToCSV, exportToJSON, exportToExcel, notify]
  );

  /**
   * Importer des données depuis un fichier
   */
  const importFromFile = useCallback(
    (file: File, format: ExportFormat = 'csv'): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;

            if (format === 'json') {
              const data = JSON.parse(content);
              resolve(Array.isArray(data) ? data : [data]);
            } else if (format === 'csv') {
              // Parser CSV simple
              const lines = content.split('\n').filter((line) => line.trim());
              const headers = lines[0].split(',').map((h) => h.trim());
              const data = lines.slice(1).map((line) => {
                const values = line.split(',').map((v) => v.trim());
                const row: any = {};
                headers.forEach((header, index) => {
                  row[header] = values[index];
                });
                return row;
              });
              resolve(data);
            } else {
              reject(new Error(`Format non supporté: ${format}`));
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsText(file);
      });
    },
    []
  );

  return {
    exportData,
    exportToCSV,
    exportToJSON,
    exportToExcel,
    importFromFile,
  };
}

/**
 * EXAMPLES D'UTILISATION
 * 
 * // Dans un composant
 * const { exportData, exportToCSV } = useExport();
 * 
 * // Export simple
 * const handleExport = () => {
 *   exportToCSV(vehicles, {
 *     filename: 'vehicules.csv',
 *   });
 * };
 * 
 * // Export avec transformation
 * const handleExport = () => {
 *   exportData(vehicles, {
 *     format: 'excel',
 *     filename: 'vehicules.csv',
 *     headers: ['Immatriculation', 'Marque', 'Modèle', 'Statut'],
 *     transform: (vehicle) => ({
 *       Immatriculation: vehicle.registration,
 *       Marque: vehicle.brand,
 *       Modèle: vehicle.model,
 *       Statut: vehicle.status,
 *     }),
 *   });
 * };
 */
