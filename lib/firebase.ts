// Firebase removed: provide stubs to avoid breaking imports elsewhere.
// This file intentionally no longer initializes Firebase SDKs.

// Export minimal placeholders so imports like `import { auth } from '@/lib/firebase'`
// do not break existing code. They are not functional and should be
// replaced with a proper PostgreSQL-backed auth implementation later.

export const auth = null as any
export const db = null as any
export const storage = null as any
export const analytics = null as any

export default null
