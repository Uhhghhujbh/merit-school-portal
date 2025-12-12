import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Award, Users, ArrowRight, ShieldCheck, 
  Library, Monitor, Trees, GraduationCap, MapPin, Phone, Mail
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const [currentBg, setCurrentBg] = useState(0);
  const backgrounds = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1577896334614-501d41da71d0?q=80&w=2070&auto=format&fit=crop"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/meritlogo.jpg" alt="Merit Logo" className="w-12 h-12 object-contain" />
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">MERIT COLLEGE</h1>
                <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Of Advanced Studies</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/auth')} 
                className="hidden md:block text-slate-700 hover:text-slate-900 font-semibold text-sm px-4 py-2"
              >
                Portal Login
              </button>
              <button 
                onClick={() => navigate('/register/student')} 
                className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all text-sm flex items-center gap-2"
              >
                Apply Now <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-slate-900 text-white overflow-hidden min-h-[600px] flex items-center">
        {backgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBg ? 'opacity-20' : 'opacity-0'}`}
          >
            <img src={bg} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/80"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 text-blue-200 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              2025/2026 Academic Session
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Knowledge For <br/>
              <span className="text-blue-400">Advancement</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
              A citadel of learning committed to academic excellence and moral uprightness. We prepare students for global success through rigorous O-Level, A-Level, and JAMB programs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/register/student')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Start Application <ShieldCheck size={20}/>
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 border border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                Access Portal <ArrowRight size={18}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="98%" label="Success Rate" />
            <StatItem number="15+" label="Expert Staff" />
            <StatItem number="Modern" label="Facilities" />
            <StatItem number="Top" label="Performance" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose Merit College</h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GraduationCap size={24} />} 
              title="Expert Faculty" 
              desc="Our tutors are seasoned professionals dedicated to student success."
            />
            <FeatureCard 
              icon={<Library size={24} />} 
              title="Digital Library" 
              desc="Comprehensive collection of e-books and past questions for all exams."
            />
            <FeatureCard 
              icon={<Monitor size={24} />} 
              title="Parent Portal" 
              desc="Real-time access for parents to monitor attendance and results."
            />
            <FeatureCard 
              icon={<Trees size={24} />} 
              title="Serene Environment" 
              desc="A quiet, secure, and conducive atmosphere for focused learning."
            />
            <FeatureCard 
              icon={<Award size={24} />} 
              title="Proven Excellence" 
              desc="A track record of producing top scorers in national examinations."
            />
            <FeatureCard 
              icon={<Users size={24} />} 
              title="Mentorship" 
              desc="Guidance counseling and career mentorship for every student."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join hundreds of successful students who chose excellence. Start your application today.
          </p>
          <button 
            onClick={() => navigate('/register/student')}
            className="bg-white text-blue-900 px-10 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-3"
          >
            Apply for Admission
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/meritlogo.jpg" className="w-10 h-10 object-contain" alt="Logo" />
                <span className="text-lg font-bold text-white">MERIT COLLEGE</span>
              </div>
              <p className="text-sm leading-relaxed">
                Empowering minds, building character, and shaping the future of education in Nigeria.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-slate-500 shrink-0 mt-0.5"/> 
                  32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-slate-500 shrink-0"/> 
                  +234 816 698 5866
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-slate-500 shrink-0"/> 
                  olayayemi@gmail.com
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={()=>navigate('/auth/student')} className="hover:text-white transition">Student Portal</button></li>
                <li><button onClick={()=>navigate('/auth/staff')} className="hover:text-white transition">Staff Portal</button></li>
                <li><button onClick={()=>navigate('/auth/admin')} className="hover:text-white transition">Administration</button></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-sm">&copy; {currentYear} Merit College of Advanced Studies. All Rights Reserved.</p>
            <div className="text-xs opacity-60 mt-2">
              Powered by <span className="font-semibold text-white">LearnovaTech</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StatItem = ({ number, label }) => (
  <div>
    <div className="text-4xl font-bold text-white mb-2">{number}</div>
    <div className="text-sm text-slate-400 uppercase tracking-wide">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 rounded-lg bg-white border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all">
    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6 text-slate-700">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
  </div>
);

export default LandingPage;
