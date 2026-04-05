import Link from 'next/link';
import { ArrowRight, Brain, Sparkles, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden pt-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00f2fe]/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8a2be2]/20 rounded-full blur-[100px] -z-10" />
        
        <div className="container px-4 md:px-6 flex flex-col items-center text-center text-white space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm glass-card">
            <Sparkles className="mr-2 h-4 w-4 text-[#00f2fe]" />
            <span className="text-gray-300">IntelliTwin 2.0 is now live</span>
          </div>
          
          <h1 className="font-outfit text-5xl md:text-7xl font-bold tracking-tight max-w-4xl">
            Your Personal Digital Twin for <br/>
            <span className="text-gradient">Smart Learning</span>
          </h1>
          
          <p className="max-w-[700px] text-gray-400 md:text-xl leading-relaxed">
            An AI-powered system that learns from your notes, schedules, and study materials to generate personalized, dynamic study plans.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/signup" className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] px-8 font-medium text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,242,254,0.4)]">
              <span className="mr-2">Get Started for Free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-24 bg-black/50 relative border-t border-white/5">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <h2 className="font-outfit text-3xl md:text-5xl font-bold">Why Choose <span className="text-gradient">IntelliTwin?</span></h2>
            <p className="max-w-[800px] text-gray-400 md:text-lg">Experience a paradigm shift in how you acquire and retain knowledge.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 flex flex-col items-start text-left space-y-4">
              <div className="p-3 rounded-full bg-[#00f2fe]/10 text-[#00f2fe]">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">AI Study Planner</h3>
              <p className="text-gray-400 leading-relaxed">
                Upload your PDFs and let our AI generate a customized schedule optimized for your learning speed and exam dates.
              </p>
            </div>
            
            <div className="glass-card p-8 flex flex-col items-start text-left space-y-4">
              <div className="p-3 rounded-full bg-[#8a2be2]/10 text-[#8a2be2]">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Dynamic Adaptation</h3>
              <p className="text-gray-400 leading-relaxed">
                Your plan adjusts in real-time based on your daily performance, quiz results, and available time.
              </p>
            </div>

            <div className="glass-card p-8 flex flex-col items-start text-left space-y-4">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Progress Tracking</h3>
              <p className="text-gray-400 leading-relaxed">
                Visualize your mastery of subjects with detailed analytics and intuitive dashboards to keep you motivated.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
