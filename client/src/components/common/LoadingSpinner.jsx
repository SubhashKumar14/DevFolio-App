export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-4', lg: 'h-16 w-16 border-4' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin`} />
    </div>
  );
}
