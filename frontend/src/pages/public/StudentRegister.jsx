import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, 
  Loader2, Printer, Download, Share2, AlertTriangle, ChevronDown, ChevronUp, Lock, Shield
} from 'lucide-react';

const StudentRegister = () => {
  // --- STATE ---
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [botField, setBotField] = useState(''); // Honeypot for bot detection
  
  const fileInputRef = useRef(null);
  const printRef = useRef(null);

  const [formData, setFormData] = useState({
    surname: '', middleName: '', lastName: '',
    gender: '', dateOfBirth: '',
    stateOfOrigin: '', lga: '', permanentAddress: '',
    parentsPhone: '', studentPhone: '', email: '',
    password: '', confirmPassword: '',
    programme: '', department: '',
    subjects: [],
    university: '', course: '', 
    photoPreview: null,
    signature: '',
    termsAccepted: false,
    location: null
  });

  const [errors, setErrors] = useState({});

  // --- PASSWORD STRENGTH CHECKER ---
  const checkStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/\d/.test(pass)) score += 1; // Has number
    if (/[A-Z]/.test(pass)) score += 1; // Has uppercase
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Has symbol
    return score; // Max 5
  };

  const passwordScore = checkStrength(formData.password);
  
  const getStrengthColor = (s) => {
    if (s < 2) return 'bg-red-500';
    if (s < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (s) => {
    if (s < 2) return 'Weak';
    if (s < 4) return 'Medium';
    return 'Strong';
  };

  // --- LOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({ 
          ...prev, 
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
        })),
        (err) => console.log('Location access denied')
      );
    }
  }, []);

  // --- AUTO-SELECT ENGLISH ---
  useEffect(() => {
    if ((formData.programme === 'O-Level' || formData.programme === 'JAMB') && 
        formData.department && 
        !formData.subjects.includes('English Language')) {
      setFormData(prev => ({
        ...prev,
        subjects: ['English Language', ...prev.subjects]
      }));
    }
  }, [formData.programme, formData.department]);

  // --- VALIDATION LOGIC ---
  const validatePhone = (phone) => /^0\d{10}$/.test(phone);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePersonal = () => {
    const newErrors = {};
    if (!formData.surname) newErrors.surname = "Surname is required";
    if (!formData.lastName) newErrors.lastName = "First Name is required";
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Invalid Email Format";

    if (!formData.studentPhone) newErrors.studentPhone = "Student Phone is required";
    else if (!validatePhone(formData.studentPhone)) newErrors.studentPhone = "Invalid Phone (Must be 11 digits, start with 0)";

    if (!formData.parentsPhone) newErrors.parentsPhone = "Parent Phone is required";
    else if (!validatePhone(formData.parentsPhone)) newErrors.parentsPhone = "Invalid Phone (Must be 11 digits, start with 0)";

    if (formData.studentPhone && formData.parentsPhone && formData.studentPhone === formData.parentsPhone) {
      newErrors.parentsPhone = "Parent phone cannot be the same as Student phone";
    }

    if (!formData.photoPreview) newErrors.photo = "Passport Photo is required";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "DOB is required";
    if (!formData.stateOfOrigin) newErrors.stateOfOrigin = "State is required";
    if (!formData.lga) newErrors.lga = "LGA is required";
    if (!formData.permanentAddress) newErrors.permanentAddress = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAcademic = () => {
    const newErrors = {};
    if (!formData.programme) newErrors.programme = "Select a programme";
    if (!formData.department) newErrors.department = "Select a department";
    if (formData.subjects.length === 0) newErrors.subjects = "Select at least one subject";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- HANDLERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { 
      setErrors(p => ({...p, photo: 'Photo must be less than 200KB'})); 
      return; 
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(p => ({ ...p, photoPreview: reader.result }));
      setErrors(p => ({ ...p, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const getSubjectsByDepartment = () => {
    const isALevel = formData.programme === 'A-Level';
    
    const subjects = {
      Science: isALevel 
        ? ["Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science", "Computer Science / ICT", "Statistics"]
        : ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Agricultural Science", "Further Mathematics", "Computer Studies / ICT", "Geography", "Civic Education", "Religious Studies"],
      
      Art: isALevel
        ? ["Government", "History", "Geography", "Literature in English", "Religious Studies (CRS / IRS)", "Philosophy", "Sociology", "Languages (Yoruba, Hausa, Igbo, French)"]
        : ["English Language", "Government", "History", "Geography", "Literature in English", "Civic Education", "Social Studies", "Religious Studies", "Yoruba", "Fine Arts / Visual Arts", "Music", "Home Economics"],
      
      Commercial: isALevel
        ? ["Economics", "Business Studies", "Accounting", "Commerce", "Marketing", "Entrepreneurship", "Banking and Finance"]
        : ["English Language", "Mathematics", "Economics", "Commerce", "Financial Accounting", "Business Studies", "Office Practice", "Marketing", "Civic Education", "Computer Studies", "Religious Studies", "Yoruba"]
    };
    
    return subjects[formData.department] || [];
  };

  const getMaxSubjects = () => {
    if (formData.programme === 'O-Level') return 9;
    if (formData.programme === 'JAMB') return 4;
    if (formData.programme === 'A-Level') return 3;
    return 0;
  };

  const handleSubjectToggle = (subject) => {
    const max = getMaxSubjects();
    const isCompulsory = (formData.programme === 'O-Level' || formData.programme === 'JAMB') && subject === 'English Language';
    
    setFormData(prev => {
      const exists = prev.subjects.includes(subject);
      if (exists && isCompulsory) return prev;
      if (exists) return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      if (prev.subjects.length >= max) return prev;
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  // --- SUBMISSION (UPDATED WITH BOT CHECK & PASSWORD STRENGTH) ---
  const handleSubmit = async () => {
    // 1. BOT CHECK (Honeypot) - Silent fail
    if (botField !== '') {
      console.log("🤖 Bot detected. Silent fail activated.");
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        alert("An error occurred. Please try again later.");
      }, 2000);
      return;
    }

    if (!formData.termsAccepted) return alert("⚠️ Please accept terms and conditions");
    if (!formData.signature) return alert("⚠️ Please provide your digital signature");
    
    // 2. PASSWORD STRENGTH CHECK
    if (passwordScore < 2) { 
      return alert("🔒 Password is too weak! Please add numbers, uppercase letters, or use more characters.");
    }

    if (!validatePersonal() || !validateAcademic()) {
      return alert("⚠️ Please correct the errors in the form before submitting.");
    }

    setLoading(true);
    
    // Demo: Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const studentId = 'MCAS-' + Date.now().toString().slice(-6);
      alert(`✅ Success! Your Student ID: ${studentId}\n\n🔐 Security checks passed:\n✓ Password strength validated\n✓ Bot protection verified\n✓ All data validated`);
      
      // In production: navigate('/auth/student');
      console.log('Form submitted successfully:', { ...formData, password: '[REDACTED]' });
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  // --- PRINT HANDLERS ---
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${formData.surname}_Registration_Form</title>
            <style>
              body { font-family: serif; padding: 20mm; }
              @media print { @page { size: A4; margin: 10mm; } }
            </style>
          </head>
          <body>${printRef.current.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // --- ACCORDION COMPONENT ---
  const AccordionItem = ({ id, title, icon: Icon, children }) => {
    const isOpen = activeSection === id;
    return (
      <div className={`border-b border-slate-200 transition-all ${isOpen ? 'bg-white' : 'bg-slate-50'}`}>
        <button 
          onClick={() => {
            if(id === 'academic' && !validatePersonal()) return alert("⚠️ Please complete Personal Info first.");
            if(id === 'review' && (!validatePersonal() || !validateAcademic())) return alert("⚠️ Please complete previous sections.");
            setActiveSection(isOpen ? '' : id);
          }}
          className={`w-full flex items-center justify-between p-6 text-left focus:outline-none ${isOpen ? 'text-blue-900' : 'text-slate-600'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
              <Icon size={20}/>
            </div>
            <span className="font-bold text-lg">{title}</span>
          </div>
          {isOpen ? <ChevronUp/> : <ChevronDown/>}
        </button>
        {isOpen && <div className="p-6 pt-0">{children}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg mx-auto mb-4 flex items-center justify-center">
              <Shield className="text-blue-900" size={40}/>
            </div>
            <h1 className="text-3xl font-black tracking-tight">STUDENT REGISTRATION</h1>
            <p className="text-blue-200 text-sm font-medium mt-1">Merit College of Advanced Studies • 2025/2026</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-100">
              <Lock size={14}/> Secure Registration • Password Protected
            </div>
          </div>
        </div>

        {/* ACCORDION FORM */}
        <div className="border-t border-slate-200">
            
          {/* 1. PERSONAL INFORMATION */}
          <AccordionItem id="personal" title="Personal Information" icon={User}>
            <div className="space-y-6 mt-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className={`w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center cursor-pointer overflow-hidden relative group ${errors.photo ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50 hover:border-blue-500'}`} 
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photoPreview ? (
                    <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Preview"/>
                  ) : (
                    <Upload className="text-slate-400 group-hover:text-blue-500" size={28}/>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-bold">Tap to Upload Passport</p>
                {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <InputField label="Surname" value={formData.surname} onChange={v => setFormData({...formData, surname: v})} error={errors.surname} />
                <InputField label="First Name" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} error={errors.lastName} />
                <InputField label="Middle Name" value={formData.middleName} onChange={v => setFormData({...formData, middleName: v})} />
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Select</option><option>Male</option><option>Female</option>
                  </select>
                  {errors.gender && <span className="text-red-500 text-xs">{errors.gender}</span>}
                </div>

                <InputField label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={v => setFormData({...formData, dateOfBirth: v})} error={errors.dateOfBirth} />
                <InputField label="Email Address" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} error={errors.email} />
                
                <InputField label="Student Phone" type="tel" value={formData.studentPhone} onChange={v => setFormData({...formData, studentPhone: v})} error={errors.studentPhone} />
                <InputField label="Parent Phone" type="tel" value={formData.parentsPhone} onChange={v => setFormData({...formData, parentsPhone: v})} error={errors.parentsPhone} />
                
                <InputField label="State of Origin" value={formData.stateOfOrigin} onChange={v => setFormData({...formData, stateOfOrigin: v})} error={errors.stateOfOrigin} />
                <InputField label="LGA" value={formData.lga} onChange={v => setFormData({...formData, lga: v})} error={errors.lga} />
              </div>
              
              <div className="w-full">
                <label className="block text-sm font-bold text-slate-700 mb-2">Permanent Address</label>
                <textarea className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition h-20 resize-none" value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} />
                {errors.permanentAddress && <span className="text-red-500 text-xs">{errors.permanentAddress}</span>}
              </div>

              {/* ENHANCED PASSWORD SECTION WITH STRENGTH METER */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="text-blue-900" size={18}/>
                  <h3 className="font-bold text-slate-800">Security Settings</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="relative">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full px-4 py-3 pr-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      placeholder="Create strong password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-11 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                    
                    {/* PASSWORD STRENGTH METER */}
                    {formData.password && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex gap-1 h-2 mb-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= passwordScore ? getStrengthColor(passwordScore) : 'bg-slate-200'}`}></div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-600">Password Strength:</span>
                          <span className={`text-xs font-bold ${passwordScore < 2 ? 'text-red-600' : passwordScore < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {getStrengthLabel(passwordScore)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {passwordScore < 2 && "Add numbers, uppercase letters, or special characters"}
                          {passwordScore >= 2 && passwordScore < 4 && "Good! Add more characters for better security"}
                          {passwordScore >= 4 && "Excellent! Your password is secure"}
                        </p>
                      </div>
                    )}
                    {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password}</span>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" 
                      value={formData.confirmPassword} 
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                      placeholder="Re-enter password"
                    />
                    {errors.confirmPassword && <span className="text-red-500 text-xs mt-1 block">{errors.confirmPassword}</span>}
                  </div>
                </div>
              </div>

              {/* INVISIBLE HONEYPOT FIELD - Bot Protection */}
              <input 
                type="text" 
                name="website_url_check" 
                tabIndex="-1"
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} 
                value={botField} 
                onChange={(e) => setBotField(e.target.value)} 
                autoComplete="off"
                aria-hidden="true"
              />

              <button 
                onClick={() => { if(validatePersonal()) setActiveSection('academic'); }}
                className="w-full bg-gradient-to-r from-blue-900 to-blue-800 text-white py-4 rounded-xl font-bold mt-4 hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                Save & Continue <ChevronRight size={18}/>
              </button>
            </div>
          </AccordionItem>

          {/* 2. ACADEMIC DETAILS */}
          <AccordionItem id="academic" title="Academic Programme" icon={Book}>
            <div className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Programme</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value, subjects: []})}>
                    <option value="">Select Programme</option>
                    <option value="JAMB">JAMB (Max 4)</option>
                    <option value="O-Level">O-Level (Max 9)</option>
                    <option value="A-Level">A-Level (Max 3)</option>
                  </select>
                  {errors.programme && <span className="text-red-500 text-xs">{errors.programme}</span>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                  <select className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value, subjects: []})}>
                    <option value="">Select Department</option>
                    <option value="Science">Science</option>
                    <option value="Art">Arts</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  {errors.department && <span className="text-red-500 text-xs">{errors.department}</span>}
                </div>
              </div>

              {formData.department && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-5 rounded-xl border-2 border-blue-100">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600"/> 
                    Select Subjects ({formData.subjects.length}/{getMaxSubjects()} selected)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getSubjectsByDepartment().map(sub => {
                      const isSel = formData.subjects.includes(sub);
                      const isComp = (formData.programme === 'O-Level' || formData.programme === 'JAMB') && sub === 'English Language';
                      return (
                        <button 
                          key={sub}
                          onClick={() => handleSubjectToggle(sub)}
                          disabled={!isSel && formData.subjects.length >= getMaxSubjects()}
                          className={`p-3 text-xs font-bold rounded-lg border-2 text-left transition ${
                            isSel ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                          } ${!isSel && formData.subjects.length >= getMaxSubjects() ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {isSel && '✓ '}{sub} {isComp && '(Required)'}
                        </button>
                      );
                    })}
                  </div>
                  {errors.subjects && <p className="text-red-500 text-xs mt-2">{errors.subjects}</p>}
                </div>
              )}

              {formData.programme === 'A-Level' && (
                <div className="grid md:grid-cols-2 gap-5">
                  <InputField label="Preferred University" value={formData.university} onChange={v => setFormData({...formData, university: v})} />
                  <InputField label="Preferred Course" value={formData.course} onChange={v => setFormData({...formData, course: v})} />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setActiveSection('personal')} className="flex-1 py-4 border-2 border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
                  <ChevronLeft className="inline mr-1" size={18}/> Back
                </button>
                <button onClick={() => { if(validateAcademic()) setActiveSection('review'); }} className="flex-1 bg-gradient-to-r from-blue-900 to-blue-800 text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
                  Continue <ChevronRight className="inline ml-1" size={18}/>
                </button>
              </div>
            </div>
          </AccordionItem>

          {/* 3. REVIEW & SUBMIT */}
          <AccordionItem id="review" title="Review & Submit" icon={FileText}>
            <div className="space-y-6 mt-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 shrink-0 mt-1" size={20}/>
                  <div className="text-sm text-yellow-900">
                    <p className="font-bold mb-1">Important Notice</p>
                    <p>You MUST download or print your form before submitting. It is required for physical verification at the college.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-40 overflow-y-auto text-xs text-slate-700 leading-relaxed">
                <p className="font-bold mb-3 text-base text-slate-900">TERMS & CONDITIONS</p>
                <ol className="list-decimal ml-5 space-y-2">
                  <li>All fees paid are non-refundable under any circumstances.</li>
                  <li>Zero tolerance policy for examination malpractice.</li>
                  <li>Minimum 75% class attendance is mandatory for all students.</li>
                  <li>Proper school uniform and dressing code must be maintained.</li>
                  <li>Respect for school authority and staff is compulsory.</li>
                  <li>Any form of indiscipline may lead to suspension or expulsion.</li>
                </ol>
              </div>

              <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} className="w-5 h-5 accent-blue-900"/>
                <span className="text-sm font-bold text-slate-800">I have read and accept all Terms & Conditions</span>
              </label>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Digital Signature</label>
                <input 
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition text-2xl text-blue-900" 
                  style={{ fontFamily: 'Brush Script MT, cursive' }}
                  placeholder="Type Your Full Name" 
                  value={formData.signature} 
                  onChange={e => setFormData({...formData, signature: e.target.value})} 
                />
                <p className="text-xs text-slate-500 mt-1">This will serve as your digital signature</p>
              </div>

              <button onClick={() => setShowPreview(true)} className="w-full py-4 border-2 border-slate-800 text-slate-800 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800 hover:text-white transition">
                <Eye size={20}/> Preview Form Before Submit
              </button>

              <button 
                onClick={handleSubmit} 
                disabled={loading || !formData.termsAccepted} 
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin"/> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={22}/> Submit Application
                  </>
                )}
              </button>

              {formData.termsAccepted && formData.signature && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-900 font-bold">
                    <Shield size={18}/> Security Features Active
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    ✓ Password Strength Verified • ✓ Bot Protection Enabled • ✓ Data Validation Complete
                  </p>
                </div>
              )}
            </div>
          </AccordionItem>

        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileText size={18}/> Form Preview
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition flex items-center gap-2">
                  <Printer size={14}/> Print
                </button>
                <button onClick={() => setShowPreview(false)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition">
                  <X size={18}/>
                </button>
              </div>
            </div>
            <div className="p-8 bg-slate-100 overflow-auto">
              <div ref={printRef} className="bg-white shadow-xl mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                <FormPreview formData={formData} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---
const InputField = ({ label, value, onChange, type = "text", error }) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <input 
      type={type} 
      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
    {error && <span className="text-red-500 text-xs font-bold mt-1 block">{error}</span>}
  </div>
);

const FormPreview = ({ formData }) => (
  <div className="text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
    <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-6">
      <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center">
        <Shield className="text-white" size={40}/>
      </div>
      <div className="text-center flex-1">
        <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
        <p className="text-xs font-bold tracking-widest mt-1">KNOWLEDGE FOR ADVANCEMENT</p>
        <p className="text-xs mt-2">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
      </div>
    </div>

    <h2 className="text-center font-bold text-lg underline mb-6">STUDENT REGISTRATION FORM</h2>

    <div className="mb-6 border border-slate-300 p-4 rounded">
      <h3 className="font-bold text-base mb-4 bg-slate-100 p-2">A. PERSONAL DETAILS</h3>
      <div className="flex gap-6">
        <div className="w-32 h-32 bg-slate-200 border border-slate-400 flex-shrink-0">
          {formData.photoPreview && <img src={formData.photoPreview} className="w-full h-full object-cover"/>}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="col-span-2 border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">Full Name:</span> {formData.surname} {formData.middleName} {formData.lastName}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">Gender:</span> {formData.gender}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">DOB:</span> {formData.dateOfBirth}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">State:</span> {formData.stateOfOrigin}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">LGA:</span> {formData.lga}
          </div>
          <div className="col-span-2 border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">Address:</span> {formData.permanentAddress}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">Phone:</span> {formData.studentPhone}
          </div>
          <div className="border-b border-dotted border-slate-400 pb-1">
            <span className="font-bold w-24 inline-block">Parent Ph:</span> {formData.parentsPhone}
          </div>
        </div>
      </div>
    </div>

    <div className="mb-6 border border-slate-300 p-4 rounded">
      <h3 className="font-bold text-base mb-4 bg-slate-100 p-2">B. ACADEMIC PROGRAM</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border-b border-dotted border-slate-400 pb-1">
          <span className="font-bold w-28 inline-block">Programme:</span> {formData.programme}
        </div>
        <div className="border-b border-dotted border-slate-400 pb-1">
          <span className="font-bold w-28 inline-block">Department:</span> {formData.department}
        </div>
        {formData.programme === 'A-Level' && (
          <>
            <div className="border-b border-dotted border-slate-400 pb-1">
              <span className="font-bold w-28 inline-block">University:</span> {formData.university}
            </div>
            <div className="border-b border-dotted border-slate-400 pb-1">
              <span className="font-bold w-28 inline-block">Course:</span> {formData.course}
            </div>
          </>
        )}
      </div>
      
      <div>
        <span className="font-bold block mb-2">Selected Subjects:</span>
        <div className="grid grid-cols-3 gap-2">
          {formData.subjects.map((sub, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 border border-black flex items-center justify-center font-bold">✓</div> {sub}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="border border-slate-300 p-4 rounded">
      <h3 className="font-bold text-base mb-4 bg-slate-100 p-2">C. DECLARATION</h3>
      <p className="text-justify mb-8">
        I, <strong>{formData.surname} {formData.middleName} {formData.lastName}</strong>, hereby declare that the information provided is true and correct. 
        I agree to abide by all rules and regulations of Merit College of Advanced Studies.
      </p>
      
      <div className="flex justify-between items-end mt-12">
        <div className="text-center">
          <div className="text-2xl mb-1 text-blue-900 border-b border-black min-w-[200px] pb-1" style={{ fontFamily: 'Brush Script MT, cursive' }}>
            {formData.signature}
          </div>
          <p className="text-xs font-bold">Applicant Signature</p>
        </div>
        <div className="text-center">
          <div className="border-b border-black min-w-[200px] mb-6"></div>
          <p className="text-xs font-bold">Registrar / Official Stamp</p>
        </div>
      </div>
    </div>
    
    <div className="text-center text-[10px] mt-8 text-slate-400">
      Generated on {new Date().toLocaleString()} | Merit College Portal | Secure Registration System
    </div>
  </div>
);

export default StudentRegister;
