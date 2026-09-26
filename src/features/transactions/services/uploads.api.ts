import { apiClient } from "@/services/api/client";
import { unwrapApiData } from "@/services/api/response";

type UploadResponse = {
  url?: string;
  fileUrl?: string;
  path?: string;
  data?: {
    url?: string;
    fileUrl?: string;
    path?: string;
  };
};

function getFileName(uri: string) {
  return uri.split("/").pop() || `pump-${Date.now()}.jpg`;
}

function getMimeType(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".png")) {
    return "image/png";
  }

  if (lower.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function extractUploadUrl(payload: UploadResponse) {
  return payload.url ?? payload.fileUrl ?? payload.path ?? payload.data?.url ?? payload.data?.fileUrl ?? payload.data?.path;
}

export async function uploadPumpPhoto(uri: string) {
  const fileName = getFileName(uri);
  const formData = new FormData();

  formData.append("file", {
    uri,
    name: fileName,
    type: getMimeType(fileName)
  } as unknown as Blob);

  const { data } = await apiClient.post("/uploads/pump-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  const uploadUrl = extractUploadUrl(unwrapApiData<UploadResponse>(data));

  if (!uploadUrl) {
    throw new Error("Upload photo invalide");
  }

  return uploadUrl;
}
