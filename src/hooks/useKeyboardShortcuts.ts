import { useEffect } from 'react';

interface KeyboardShortcuts {
    [key: string]: () => void;
}

/**
 * Custom hook for managing keyboard shortcuts
 * @param shortcuts - Object mapping key codes to callback functions
 * @param enabled - Whether keyboard shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (
    shortcuts: KeyboardShortcuts,
    enabled: boolean = true
) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input field
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const handler = shortcuts[event.code];
            if (handler) {
                event.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
};
