import axiosInstance from "@/lib/axios";
import axios from "axios";

export const getClients = async () => {
  const res = await axiosInstance.get(`/api/clients`);
  return res.data.data;
};

export const getClientById = async (id) => {
  const res = await axios.get(`/api/clients/${id}`);
  return res.data.data;
};

export const addClient = async (payload) => {
  const res = await axios.post(`/api/clients`, payload);
  return res.data.data;
};

export const updateClient = async (id, payload) => {
  const res = await axios.put(`/api/clients/${id}`, payload);
  return res.data.data;
};
