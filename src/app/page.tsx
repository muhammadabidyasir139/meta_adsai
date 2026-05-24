import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-premium relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>

      <div className="z-10 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8 border-white/5 bg-white/5">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-blue-300 tracking-wide uppercase">AI-Powered Monitoring for Indonesian UMKM</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
          Aman Gak? <br />
          <span className="text-blue-500 italic">Dashboard.</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Stop worrying about your ad budget. Let our AI monitor your customer sentiment and marketplace trends while you focus on scaling.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/dashboard" className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg transition-all hover-scale shadow-2xl shadow-blue-600/30">
            Open Dashboard
          </Link>
          <button className="px-10 py-5 glass hover:bg-white/5 rounded-2xl font-bold text-lg transition-all border-white/5">
            Learn More
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon="🧠" title="Predictive AI" desc="Forecast demand before it happens." />
          <FeatureCard icon="🛡️" title="Safety First" desc="Ensuring every rupiah is 'Aman'." />
          <FeatureCard icon="⚡" title="Real-time" desc="Syncing with Meta Ads instantly." />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="glass p-8 text-left hover-scale group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
