import { useCallback } from 'react';

export default function CodePanel({ language, value, onChange, placeholder }) {
  // Handle Tab key — insert 2 spaces instead of leaving the textarea
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      onChange(newValue);
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        e.target.selectionStart = selectionStart + 2;
        e.target.selectionEnd = selectionStart + 2;
      });
    }
  }, [value, onChange]);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || `Write your ${language} here...`}
        className="flex-1 w-full h-full bg-background text-foreground font-mono text-sm p-4 resize-none focus:outline-none border-none leading-relaxed"
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
}
