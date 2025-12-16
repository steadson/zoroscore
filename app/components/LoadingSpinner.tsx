export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-4 border-zoro-border" />
        <div className="w-10 h-10 rounded-full border-4 border-t-zoro-yellow border-r-zoro-green border-b-transparent border-l-transparent animate-spin absolute top-0 left-0" />
      </div>
    </div>
  );
}
