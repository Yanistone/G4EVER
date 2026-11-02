const API_URL = "/api"

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}
