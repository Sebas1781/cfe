import apiClient from '../config/api';

export const reportService = {
  // Subir imágenes múltiples sin límite
  async uploadImages(formData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/uploads/images`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!response.ok) throw new Error('Error al subir imágenes');
      return await response.json();
    } catch (error) {
      throw new Error('Error al subir imágenes: ' + error.message);
    }
  },
  // Enviar formulario al servidor para generar PDF
  async submitForm(formData) {
    try {
      const response = await apiClient.post('/reports/generate', formData);
      return response;
    } catch (error) {
      throw new Error('Error al generar reporte: ' + error.message);
    }
  },
  
  // Obtener lista de reportes
  async getReports(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      return await apiClient.get(`/reports?${queryParams}`);
    } catch (error) {
      throw new Error('Error al obtener reportes: ' + error.message);
    }
  },
  
  // Descargar PDF
  async downloadReport(reportId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/${reportId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Error al descargar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw new Error('Error al descargar reporte: ' + error.message);
    }
  },
  async downloadXlsx(reportId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/${reportId}/export/xlsx`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Error al descargar XLSX');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw new Error('Error al descargar XLSX: ' + error.message);
    }
  },
};
