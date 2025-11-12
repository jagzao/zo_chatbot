export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold">🤖 ZO Chatbot</h1>
        <p className="max-w-2xl text-lg text-gray-600">
          Plataforma multicanal de chatbot para WhatsApp, Facebook, Instagram y TikTok
        </p>
        <div className="mt-8 flex gap-4">
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="mb-2 font-semibold">Multi-Canal</h3>
            <p className="text-sm text-gray-600">
              Gestiona conversaciones de múltiples plataformas
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="mb-2 font-semibold">Multi-Tenant</h3>
            <p className="text-sm text-gray-600">
              Arquitectura para múltiples organizaciones
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="mb-2 font-semibold">IA Integrada</h3>
            <p className="text-sm text-gray-600">
              Respuestas inteligentes con LLaMA 3
            </p>
          </div>
        </div>
        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          🚧 Proyecto en desarrollo - Fase 1: Configuración inicial completada
        </div>
      </main>
    </div>
  );
}
