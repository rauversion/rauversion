declare module '@rails/request.js' {
  interface RequestOptions {
    body?: BodyInit | Record<string, unknown> | null
    contentType?: string
    headers?: HeadersInit
    query?: Record<string, string> | URLSearchParams | FormData
    redirect?: RequestRedirect
    responseKind?: 'json' | 'html' | 'turbo-stream'
    signal?: AbortSignal
  }

  interface Response {
    headers: Headers
    html: Promise<string>
    json: Promise<any>
    ok: boolean
    redirected: boolean
    response: globalThis.Response
    success: boolean
    text: Promise<string>
  }

  export function get(path: string, options?: RequestOptions): Promise<Response>
  export function post(path: string, options?: RequestOptions): Promise<Response>
  export function put(path: string, options?: RequestOptions): Promise<Response>
  export function patch(path: string, options?: RequestOptions): Promise<Response>
  export function destroy(path: string, options?: RequestOptions): Promise<Response>
}
