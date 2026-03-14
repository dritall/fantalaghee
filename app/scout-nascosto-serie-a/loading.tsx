export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-300 flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-600 border-t-white rounded-full animate-spin"></div>
        <p className="text-lg font-medium">Caricamento scout Serie A...</p>
      </div>
    </div>
  );
}
