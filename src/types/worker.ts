/**
 * Worker entrypoint interface returned by getEntrypoint()
 * Based on Cloudflare Workers WorkerLoader API
 */
export interface WorkerEntrypoint {
  fetch(request: Request): Promise<Response>
}

/**
 * Options for getEntrypoint() method
 * Based on Cloudflare Workers WorkerLoader API
 */
export interface GetEntrypointOptions {
  props?: unknown
}

/**
 * Worker code configuration for dynamic Worker creation
 * Based on Cloudflare Workers WorkerLoader API
 * Reference: https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/
 */
export interface WorkerCode {
  compatibilityDate: string
  compatibilityFlags?: string[]
  experimental?: boolean
  mainModule: string
  modules: Record<string, string | ModuleContent>
  /**
   * Environment bindings for the Worker
   * Can include KV namespaces, Durable Objects, Service Bindings, etc.
   */
  env?: Record<string, unknown>
  /**
   * Global outbound configuration for network isolation
   * - "allow": Allow all outbound requests (default)
   * - "deny": Deny all outbound requests
   * - null: No outbound requests allowed (true network isolation)
   */
  globalOutbound?: 'allow' | 'deny' | null
}

export type ModuleContent =
  | { js: string }
  | { cjs: string }
  | { py: string }
  | { text: string }
  | { data: ArrayBuffer }
  | { json: object }

/**
 * Worker stub returned by WorkerLoader.get()
 * Based on Cloudflare Workers WorkerLoader API
 */
export interface WorkerStub {
  /**
   * Get the entrypoint for the Worker
   * @param name - Optional entrypoint name (defaults to main entrypoint)
   * @param options - Optional configuration including props for WorkerEntrypoint
   * @returns Worker entrypoint with fetch method
   */
  getEntrypoint(name?: string, options?: GetEntrypointOptions): WorkerEntrypoint
}

/**
 * Worker Loader binding interface
 * Based on Cloudflare Workers WorkerLoader API
 * Reference: https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/
 */
export interface WorkerLoader {
  /**
   * Get or create a Worker instance
   * @param id - Unique identifier for the Worker instance
   * @param getCodeCallback - Callback that returns the Worker code configuration
   * @returns Worker stub for accessing the Worker entrypoint
   */
  get(id: string, getCodeCallback: () => Promise<WorkerCode>): WorkerStub
}
