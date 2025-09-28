import axiosInstance from '../axios';

export const fetchExpenses = async () => {
  const { data } = await axiosInstance.get('/api/expenses');
  return data;
};

export const fetchExpenseById = async (id) => {
  const { data } = await axiosInstance.get(`/api/expenses/${id}`);
  return data;
};

export const createExpense = async (orderData) => {
  const { data } = await axiosInstance.post('/api/expenses', orderData);
  return data;
};

export const updateExpense = async ({ id, updates }) => {
  const { data } = await axiosInstance.put(`/api/expenses/${id}`, updates);
  return data;
};

export const DeleteExpense= async (id) => {
  const { data } = await axiosInstance.delete(`/api/expenses/${id}`);
  return data;
};
export const ApproveExpense= async (id) => {
  const { data } = await axiosInstance.patch(`/api/expenses/${id}/approve`);
  return data;
};
export const RejectExpense= async (id) => {
  const { data } = await axiosInstance.patch(`/api/expenses/${id}/reject`);
  return data;
};