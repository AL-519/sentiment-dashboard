import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-6 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="z-10 max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Real-Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Telemetry</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Your central hub for monitoring live data streams, analyzing trends, and managing system performance.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          {/* Active Link to Dashboard */}
          <Link 
            href="/dashboard" 
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <span>Enter Dashboard</span>
            <span>🚀</span>
          </Link>

          {/* Disabled Login Placeholder */}
          <button 
            disabled
            className="px-8 py-4 bg-gray-900 text-gray-500 rounded-xl font-semibold cursor-not-allowed border border-gray-800 flex items-center justify-center gap-2"
          >
            <span>User Login (Soon)</span>
            <span>🔒</span>
          </button>
        </div>
      </div>
    </main>
  );
}