import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import type { Project } from './types/project';
import ProjectForm from './projects-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Fetch project by ID
const fetchProject = async (id: string): Promise<Project> => {
  const { data } = await axiosInstance.get(`/api/projects/${id}`);
  return data;
};

// Update project mutation
const updateProject = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}): Promise<Project> => {
  const response = await axiosInstance.put(`/api/projects/${id}`, data);
  return response.data;
};

function EditProjectPage() {
  const navigate = useNavigate();
  const { projectId: id } = useParams({ from: '/_authenticated/projects/$projectId/edit/' });
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

  // Update mutation
  const mutation = useMutation({
    mutationFn: updateProject,
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', id], updatedProject);
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      toast.success('Project updated successfully!');

      navigate({
        to: '/projects/$projectId',
        params: { projectId: id },
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error updating project');
    },
  });

  const handleSubmit = (formData: any) => {
    mutation.mutate({ id, data: formData });
  };

  /* ------------------------- Loading State ------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-blue-700 mt-3">Loading project...</p>
        </div>
      </div>
    );
  }

  /* -------------------------- Error State -------------------------- */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-red-500 text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Project</h2>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Project not found.</p>
      </div>
    );
  }

  /* --------------------------- Page UI ---------------------------- */
  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="space-y-1">

              {/* Back Button */}
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-700"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    navigate({ to: "/projects" });
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <h1 className="text-3xl font-bold text-gray-800">Edit Project</h1>
              <p className="text-blue-600 text-sm">Project Number: {project.projectNumber}</p>
            </div>

            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-medium shadow-sm">
              {project.name}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow p-8">
          <ProjectForm
            project={project}
            onSubmit={handleSubmit}
            isLoading={mutation.isPending}
            isEdit={true}
          />
        </div>

      </div>
    </div>
  );
}

export default EditProjectPage;
