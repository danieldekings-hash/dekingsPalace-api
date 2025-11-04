export type SuccessResponse<T> = {
  success: true;
  message?: string;
  data?: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data?: T, message?: string): SuccessResponse<T> {
  return { success: true, message, data };
}

export function fail(code: string, message: string, details?: unknown): ErrorResponse {
  return { success: false, error: { code, message, details } };
}


