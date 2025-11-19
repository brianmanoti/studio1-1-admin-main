
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import type { Project } from './types/project';
import ProjectForm from './projects-form';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

// Fetch project by ID
const fetchProject = async (id: string): Promise<Project> => {
  const { data } = await axiosInstance.get(`/api/projects/${id}`);
  return data;
};

// Update project mutation
const updateProject = async ({ id, data }: { id: string; data: any }): Promise<Project> => {
  const response = await axiosInstance.put(`/api/projects/${id}`, data);
  return response.data;
};

function EditProjectPage() {
    const navigate = useNavigate();

    const { projectId: id } = useParams({
    from: '/_authenticated/projects/$projectId/edit/',
  });


  const queryClient = useQueryClient();

  // Fetch project data
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
  });

  // Update project mutation
  const mutation = useMutation({
    mutationFn: updateProject,
    onSuccess: (updatedProject) => {
      // Update the cache
      queryClient.setQueryData(['project', id], updatedProject);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Show success message
      toast.success('Project updated successfully!');

    navigate({
      to: '/projects/$projectId',
      params: { projectId: id },
    });
    },
    onError: (error: any) => {
      console.error('Error updating project:', error);
      toast.error(error?.message || '❌ Error updating project');
    },
  });

  const handleSubmit = (formData: any) => {
    mutation.mutate({ id, data: formData });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-blue-700 mt-4">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Project</h2>
            <p className="text-gray-600 mb-4">Unable to load project details. Please try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <p className="text-center text-gray-600">Project not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Edit Project</h1>
                <p className="text-blue-600 mt-2">Project Number: {project.projectNumber}</p>
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <span className="font-semibold">ID:</span> {project._id}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <ProjectForm 
              project={project}
              onSubmit={handleSubmit}
              isLoading={mutation.isPending}
              isEdit={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProjectPage;