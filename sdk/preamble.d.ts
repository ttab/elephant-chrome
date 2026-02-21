/**
 * Manual SDK declarations for globals that cannot be auto-generated
 * from the barrel file. These are prepended to the generated index.d.ts.
 */

/** Register a plugin with the host. Called synchronously when the plugin IIFE executes. */
export declare function registerPlugin(plugin: PluginInstance): void;

/** The application's base URL path (e.g. '/elephant'). Available immediately on script load. */
export declare const BASE_URL: string;
