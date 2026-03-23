import { useState } from 'react';

export default function CodePanel({ language, value, onChange, placeholder }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2 bg-card-elevated border-b border-border">
        <span className="text-xs font-mono font-medium text-muted uppercase">{language}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Write your ${language} here...`}
        className="flex-1 w-full bg-background text-foreground font-mono text-sm p-4 resize-none focus:outline-none border-none"
        spellCheck="false"
      />
    </div>
  );
}
