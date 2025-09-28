import axiosInstance from "../axios";

export const fetchEstimates = async () => {
  const { data } = await axiosInstance.get('/api/estimates');
  return data;
};

export const fetchEstimateById = async (id) => {
  const { data } = await axiosInstance.get(`/api/estimates/${id}`);
  return data;
};

export const createEstimate = async (orderData) => {
  const { data } = await axiosInstance.post('/api/estimates', orderData);
  return data;
};

export const updateEstimate = async ({ id, updates }) => {
  const { data } = await axiosInstance.put(`/api/estimates/${id}`, updates);
  return data;
};

export const deleteEstimate= async (id) => {
  const { data } = await axiosInstance.delete(`/api/estimates/${id}`);
  return data;
};