import api from './api';

export const fetchTrainingReport = async (filters = {}) => {
  const response = await api.get('/dashboard/training-stats', { params: filters });
  return response.data;
};

export const fetchParticipantReport = async (filters = {}) => {
  const response = await api.get('/dashboard/participant-stats', { params: filters });
  return response.data;
};

export const fetchSummaryReport = async (filters = {}) => {
  const response = await api.get('/dashboard/complete', { params: filters });
  return response.data;
};

export const fetchLocationReport = async (filters = {}) => {
  const params = {
    district_cd: filters.district_cd,
    block_cd: filters.block_cd,
    from_date: filters.from_date || filters.start_date,
    to_date: filters.to_date || filters.end_date,
  };
  const response = await api.get('/reports/dashboard', { params });
  return response.data;
};
