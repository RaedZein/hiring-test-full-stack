export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse">
      <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    </div>
  );
}
