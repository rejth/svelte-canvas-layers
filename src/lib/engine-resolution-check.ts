// Phase 1 (workspace-packaging) type-resolution probe.
// Proves that `@canvas/engine` resolves from app source under svelte-check.
// This file is a temporary resolvability artifact and will be removed or
// replaced during Phase 3 (App Migration), when real engine wiring lands.
import { ENGINE_PACKAGE_NAME } from '@canvas/engine'

export const engineResolutionCheck: string = ENGINE_PACKAGE_NAME
