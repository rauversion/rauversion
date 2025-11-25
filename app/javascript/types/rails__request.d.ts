declare module '@rails/request.js' {
  interface RequestOptions {
    body?: string
    headers?: Record<string, string>
    query?: Record<string, string>
    responseKind?: 'json' | 'html' | 'turbo-stream'
    contentType?: string | false
  }

  interface Response {
    json: any
    html?: string
    response: globalThis.Response
    success: boolean
    ok: boolean
  }

  export function get(path: string, options?: RequestOptions): Promise<Response>
  export function post(path: string, options?: RequestOptions): Promise<Response>
  export function put(path: string, options?: RequestOptions): Promise<Response>
  export function patch(path: string, options?: RequestOptions): Promise<Response>
  export function destroy(path: string, options?: RequestOptions): Promise<Response>
}
