interface EmptyStateProps {
  message: string;
  icon?: string;
}

export default function EmptyState({ message, icon = "⚽" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-7xl mb-6 opacity-30">
        {icon}
      </div>
      <p className="text-zoro-grey text-lg font-medium">
        {message}
      </p>
    </div>
  );
}
