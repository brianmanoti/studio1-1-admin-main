import axiosInstance from '../axios';

// ====== Fetch All Purchase Orders ======
export const fetchPOs = async () => {
  const { data } = await axiosInstance.get('/api/purchase-orders');
  return data;
};

// ====== Fetch Purchase Order by ID ======
export const fetchPOById = async (id) => {
  const { data } = await axiosInstance.get(`/api/purchase-orders/${id}`);
  return data;
};

// ====== Create Purchase Order ======
export const createPO = async (Pdata) => {
  const { data } = await axiosInstance.post('/api/purchase-orders', Pdata);
  return data;
};

// Approve PO
export const approvePO = async (id) => {
  const { data } = await axiosInstance.patch(`/api/purchase-orders/${id}/approve`);
  return data;
};

// Reject PO
export const rejectPO = async (id) => {
  const { data } = await axiosInstance.patch(`/api/purchase-orders/${id}/reject`);
  return data;
};

// ====== Update Purchase Order ======
export const updatePO = async ({ id, updates }) => {
  const { data } = await axiosInstance.put(`/api/purchase-orders/${id}`, updates);
  return data;
};

// ====== Soft Delete Purchase Order ======
export const softDeletePO = async (id) => {
  try {
    const { data } = await axiosInstance.patch(`/api/purchase-orders/${id}`);
    return { success: true, message: data.message };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Soft delete failed' 
    };
  }
};

// ====== Permanent Delete Purchase Order ======
export const permanentDeletePO = async (id) => {
  try {
    const { data } = await axiosInstance.delete(`/api/purchase-orders/${id}`);
    return { success: true, message: data.message };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Delete failed' 
    };
  }
};