export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

export async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json() as { message?: unknown };
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (Array.isArray(body.message)) {
      const lines = body.message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (lines.length > 0) return lines.join('\n');
    }
  } catch {
    // The body was not JSON.
  }
  return fallback;
}

export function connectionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    return 'API 서버에 연결하지 못했습니다. API가 실행 중인지 확인하세요.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
