import { useEffect } from 'react';

/**
 * Warns the user before leaving the page if there are unsaved changes.
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 */
export function useBeforeUnload(hasUnsavedChanges) {
  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);
}
