import axiosInstance from '../axios';

export const fetchWages = async () => {
  const { data } = await axiosInstance.get('/api/wages');
  return data;
};

export const fetchWageById = async (id) => {
  const { data } = await axiosInstance.get(`/api/wages/${id}`);
  return data;
};

export const createWage = async (orderData) => {
  const { data } = await axiosInstance.post('/api/wages', orderData);
  return data;
};

export const updateWage = async ({ id, updates }) => {
  const { data } = await axiosInstance.put(`/api/wages/${id}`, updates);
  return data;
};

export const deleteWage= async (id) => {
  const { data } = await axiosInstance.delete(`/api/wages/${id}`);
  return data;
};

export const ApproveWage= async (id) => {
  const { data } = await axiosInstance.patch(`/api/wages/${id}/approve`);
  return data;
};
export const RejectWage= async (id) => {
  const { data } = await axiosInstance.patch(`/api/wages${id}/reject`);
  return data;
};