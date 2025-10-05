import { useNavigate } from "react-router-dom";
import React from "react";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-br from-[#9360E3] via-[#7a4dc4] to-[#9360E3] text-white py-24 md:py-32 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E5D5FD] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#E2D3FA] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Diagonal Lines Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, 
                             transparent, 
                             transparent 10px, 
                             rgba(255,255,255,0.3) 10px, 
                             rgba(255,255,255,0.3) 11px)`
          }}></div>
        </div>

        {/* Floating Circles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-white/10 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 border-4 border-white/10 rounded-full animate-spin-reverse"></div>
        
        {/* Dots Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-20 text-6xl opacity-20 animate-float drop-shadow-lg">🎓</div>
      <div className="absolute bottom-20 left-16 text-5xl opacity-20 animate-float animation-delay-2000 drop-shadow-lg">📚</div>
      <div className="absolute top-1/2 right-40 text-4xl opacity-20 animate-float animation-delay-4000 drop-shadow-lg">✨</div>
      <div className="absolute top-1/3 left-1/4 text-3xl opacity-15 animate-float animation-delay-1000 drop-shadow-lg">🌟</div>
      <div className="absolute bottom-1/3 right-1/3 text-4xl opacity-15 animate-float animation-delay-3000 drop-shadow-lg">💡</div>
      <div className="absolute top-2/3 left-1/3 text-3xl opacity-15 animate-float animation-delay-5000 drop-shadow-lg">🚀</div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">Trusted by 10,000+ Students</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-heading font-bold text-5xl md:text-7xl mb-6 leading-tight">
            Your Future,
            <span className="block bg-gradient-to-r from-[#E5D5FD] to-white bg-clip-text text-transparent">
              Our Support
            </span>
          </h1>

          {/* Subheading */}
          <p className="font-body text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Discover scholarships tailored to your dreams. Connect your wallet, apply seamlessly, and track your journey to success—all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              onClick={() => navigate('/list')}
              className="group relative bg-white text-[#9360E3] px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <span>Explore Scholarships</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>
            
            <button 
              onClick={() => navigate('/apply')}
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/20 border-2 border-white/30 hover:border-white/50 transition-all duration-300"
            >
              Apply Now
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-sm text-white/80">Scholarships</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">$2M+</div>
              <div className="text-sm text-white/80">Awarded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">10K+</div>
              <div className="text-sm text-white/80">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">95%</div>
              <div className="text-sm text-white/80">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-5000 {
          animation-delay: 5s;
        }
      `}</style>
    </section>
  );
}