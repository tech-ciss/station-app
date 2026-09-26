import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.yely.tech/api/v1";

export type ApiError = {
  message: string;
  status?: number;
};

type RefreshTokenHandler = () => Promise<string | null>;

let accessToken: string | null = null;
let refreshTokenHandler: RefreshTokenHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json"
  }
});

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setRefreshTokenHandler(handler: RefreshTokenHandler | null) {
  refreshTokenHandler = handler;
}

function isRetriableAuthError(error: AxiosError) {
  return error.response?.status === 401;
}

function isRefreshRequest(config?: InternalAxiosRequestConfig) {
  return config?.url?.includes("/auth/refresh") === true;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string | string[];
          error?: string | { message?: string; code?: string };
        }
      | undefined;
    const message = data?.message;
    const nestedError = data?.error;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }

    if (typeof nestedError === "string") {
      return nestedError;
    }

    if (typeof nestedError?.message === "string") {
      return nestedError.message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Requete API echouee";
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest(originalRequest) ||
      !isRetriableAuthError(error)
    ) {
      throw {
        message: getErrorMessage(error),
        status: error.response?.status
      } satisfies ApiError;
    }

    if (!refreshTokenHandler) {
      throw {
        message: getErrorMessage(error),
        status: error.response?.status
      } satisfies ApiError;
    }

    originalRequest._retry = true;

    refreshPromise = refreshPromise ?? refreshTokenHandler();
    const nextAccessToken = await refreshPromise.finally(() => {
      refreshPromise = null;
    });

    if (!nextAccessToken) {
      throw {
        message: "Session expiree",
        status: 401
      } satisfies ApiError;
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return apiClient(originalRequest);
  }
);

export function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "message" in error) {
    const apiError = error as ApiError;
    return {
      message: apiError.message,
      status: apiError.status
    };
  }

  return {
    message: getErrorMessage(error)
  };
}

export function resolveApiAssetUrl(uri?: string | null) {
  if (!uri || uri.startsWith("remote://")) {
    return "";
  }

  if (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("data:") ||
    uri.startsWith("http://") ||
    uri.startsWith("https://")
  ) {
    return uri;
  }

  const apiOrigin = API_BASE_URL.match(/^https?:\/\/[^/]+/)?.[0];

  if (!apiOrigin) {
    return uri;
  }

  const normalizedPath = uri.startsWith("/") ? uri : `/${uri}`;
  return `${apiOrigin}${normalizedPath}`;
}
