import { toast } from "sonner";

export function handleApiError(error: any) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong.";

  toast.error(message);
}
