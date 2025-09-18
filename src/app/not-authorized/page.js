export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl mb-2">No autorizado</h2>
        <p>No tienes permisos para ver esta página.</p>
      </div>
    </div>
  );
}
