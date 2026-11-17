
import api from '../services/api';

export const dashboardService = {

  getDistricts: async () => {
    try {
      const response = await api.get('/reports/districts');
      return response.data;
    } catch (error) {
      console.error("District Fetch Error:", error);
      throw error;
    }
  },

  getBlocksByDistrict: async (district_cd) => {
    if (!district_cd) return [];
    const res = await api.get('/reports/blocks', {
      params: { district_cd }
    });
    return res.data;
  },


  getDashboardData: async (filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => value != null && value !== '')
          .map(([key, value]) => [
            key,
            key === 'district_cd' || key === 'block_cd' ? Number(value) : value
          ])
      );

      const response = await api.get('/dashboard/summary', {
        params: cleanFilters
      });

      return response.data;
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      throw error;
    }
  },

  getDashboardViewData: async (filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries({
          district_cd: filters.district_cd,
          block_cd: filters.block_cd,
          village: filters.village,
          subject: filters.subject,
          training_type: filters.training_type,
          status: filters.status,
          start_date_from: filters.start_date,
          start_date_to: filters.end_date,
          page: 1,
          limit: 1000,
        }).filter(([, value]) => value != null && value !== '')
      );

      const response = await api.get('/trainings', { params: cleanFilters });
      return { data: Array.isArray(response.data) ? response.data : response.data?.data || [] };
    } catch (error) {
      console.error("Dashboard View Fetch Error:", error);
      throw error;
    }
  },



};
