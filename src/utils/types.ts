export type ToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; hint: string };

export function success<T>(data: T): ToolResult<T> {
  return { success: true, data };
}

export function failure<T = any>(error: string, hint: string): ToolResult<T> {
  return { success: false, error, hint };
}
