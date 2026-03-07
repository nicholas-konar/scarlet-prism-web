/* Base fetch wrapper with authorization header */

interface RequestInit extends globalThis.RequestInit {
    body?: BodyInit | null
}

type BodyInit = string | FormData | URLSearchParams | ReadableStream<Uint8Array>

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message)
        this.name = "ApiError"
    }
}

function getAuthToken(): string | null {
    return localStorage.getItem("token")
}

export async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken()
    const headers = new Headers(options.headers || {})

    if (token) {
        headers.set("Authorization", `Bearer ${token}`)
    }

    const response = await fetch(`/api${url}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const text = await response.text()
        throw new ApiError(response.status, text || response.statusText)
    }

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
        return response.json()
    }

    return response.text() as Promise<T>
}

export async function apiStream(
    url: string,
    options: RequestInit = {},
    onChunk: (chunk: string) => void,
): Promise<void> {
    const token = getAuthToken()
    const headers = new Headers(options.headers || {})

    if (token) {
        headers.set("Authorization", `Bearer ${token}`)
    }

    const response = await fetch(`/api${url}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const text = await response.text()
        throw new ApiError(response.status, text || response.statusText)
    }

    if (!response.body) {
        throw new Error("Response body is empty")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")

            // Keep the last incomplete line in the buffer
            buffer = lines[lines.length - 1]

            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim()

                if (line.startsWith("data:")) {
                    const jsonStr = line.slice(5).trim()
                    if (jsonStr) {
                        onChunk(jsonStr)
                    }
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim().startsWith("data:")) {
            const jsonStr = buffer.slice(5).trim()
            if (jsonStr) {
                onChunk(jsonStr)
            }
        }
    } finally {
        reader.releaseLock()
    }
}
