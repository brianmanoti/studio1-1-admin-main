// Utility functions to generate URLs for project-related routes
export const getProjectUrl = (projectId: string, subPath?: string) =>
  `/projects/${projectId}${subPath ? `/${subPath}` : ''}`;