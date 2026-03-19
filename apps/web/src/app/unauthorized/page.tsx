export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">401</h1>
        <p className="text-white/60 text-sm">غير مصرح بالوصول</p>
      </div>
    </div>
  );
}
