// Contexts Barrel Export

export { ThemeProvider } from './ThemeContext'
export { useTheme } from './useTheme'
export { AuthProvider } from './AuthContext'
export { useAuth } from './useAuth'
export { USER_ROLES, ROLE_LABELS } from '@/utils/roles'
// Stale saves (D62): the shared "Someone else changed this" dialog and the page reload key
export { SaveConflictProvider } from './SaveConflictContext'
export { useSaveConflict } from './useSaveConflict'
// Unsaved-changes guard (D61): Save / Discard / Stay before leaving an edited page
export { UnsavedChangesProvider } from './UnsavedChangesContext'
export { useUnsavedChanges, useConfirmLeave } from './useUnsavedChanges'
