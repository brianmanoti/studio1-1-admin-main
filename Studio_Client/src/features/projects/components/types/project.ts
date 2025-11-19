// types/project.ts
export interface Project {
  _id: string;
  name: string;
  client: string | null;
  location: string;
  status: string;
  estimatedBudget: number;
  actualSpent: number;
  value: number;
  balance: number;
  startDate: string;
  endDate: string;
  progress: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  projectNumber: string;
  __v: number;
}