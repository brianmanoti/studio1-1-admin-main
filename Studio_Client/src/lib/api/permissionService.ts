import axiosInstance from "../axios";

export interface Permission {
  permission: string;
  resource: string;
  action: string;
  label: string;
}

export interface UserPermissionsResponse {
  success: boolean;
  data: {
    user: {
      userId: string;
      name: string;
      email: string;
      role: string;
    };
    permissions: string[];
    defaultPermissions: string[];
    customPermissions: string[];
  };
}

export interface AvailablePermissionsResponse {
  success: boolean;
  data: {
    byResource: Array<{
      resource: string;
      label: string;
      actions: string[];
      permissions: Permission[];
    }>;
    permissionsList: Permission[];
    roleDefaults: {
      [key: string]: string[];
    };
  };
}

export const permissionService = {
  getUserPermissions: async (userId: string): Promise<UserPermissionsResponse> => {
    const { data } = await axiosInstance.get(`/api/permissions/user/${userId}`);
    return data;
  },

  getAvailablePermissions: async (): Promise<AvailablePermissionsResponse> => {
    const { data } = await axiosInstance.get('/api/permissions/available');
    return data;
  },

  updateUserPermissions: async (userId: string, permissions: string[]): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.put(`/api/permissions/user/${userId}`, { permissions });
    return data;
  },

  addPermissions: async (userId: string, permissions: string[]): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.post(`/api/permissions/user/${userId}/add`, { permissions });
    return data;
  },

  removePermissions: async (userId: string, permissions: string[]): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.post(`/api/permissions/user/${userId}/remove`, { permissions });
    return data;
  },

  resetPermissions: async (userId: string): Promise<{ success: boolean }> => {
    const { data } = await axiosInstance.post(`/api/permissions/user/${userId}/reset`);
    return data;
  },
};