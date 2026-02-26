/**
 * Feature flags for the Wires view.
 * Toggle these to enable/disable experimental or staged functionality.
 */

/**
 * When enabled, wire streams without any filters will not load data.
 * Instead they show a placeholder prompting the user to add filters.
 * Saving is also blocked until all streams have at least one filter.
 */
export const REQUIRE_FILTERS = true
