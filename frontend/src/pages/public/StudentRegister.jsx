import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, 
  Loader2, Printer, Download, Share2, AlertTriangle, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { api } from '../../lib/api';

const StudentRegister = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [activeSection, setActiveSection] = useState('personal'); // 'personal', 'academic', 'review'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
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

  // --- LOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({ 
          ...prev, 
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude } 
        })),
        (err) => console.log('Location denied')
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
    
    // Email Validation
    if (!formData.email) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Invalid Email Format";

    // Phone Validation
    if (!formData.studentPhone) newErrors.studentPhone = "Student Phone is required";
    else if (!validatePhone(formData.studentPhone)) newErrors.studentPhone = "Invalid Phone (Must be 11 digits, start with 0)";

    if (!formData.parentsPhone) newErrors.parentsPhone = "Parent Phone is required";
    else if (!validatePhone(formData.parentsPhone)) newErrors.parentsPhone = "Invalid Phone (Must be 11 digits, start with 0)";

    // Phone Duplication Check
    if (formData.studentPhone && formData.parentsPhone && formData.studentPhone === formData.parentsPhone) {
        newErrors.parentsPhone = "Parent phone cannot be the same as Student phone";
    }

    if (!formData.photoPreview) newErrors.photo = "Passport Photo is required";
    
    // Password Validation
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    // Basic Fields
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
    const isOLevel = formData.programme === 'O-Level';
    const isJAMB = formData.programme === 'JAMB';
    
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

  // --- SUBMISSION ---
  const handleSubmit = async () => {
    if (!formData.termsAccepted) return alert("Please accept terms and conditions");
    if (!formData.signature) return alert("Please provide your digital signature");
    
    if (!validatePersonal() || !validateAcademic()) {
        return alert("Please correct the errors in the form before submitting.");
    }

    setLoading(true);
    try {
      const payload = { ...formData, role: 'student' };
      const response = await api.post('/students/register', payload);
      alert(`Success! Student ID: ${response.studentId}`);
      navigate('/auth/student');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  // --- PRINT HANDLERS ---
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${formData.surname}_Registration_Form`,
    pageStyle: `@page { size: A4; margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }`
  });

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 850 });
      const link = document.createElement('a');
      link.download = `Registration_${formData.surname}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Download failed. Try using the Print option.');
    }
  };

  // --- ACCORDION COMPONENT ---
  const AccordionItem = ({ id, title, icon: Icon, children }) => {
    const isOpen = activeSection === id;
    return (
      <div className={`border-b border-slate-200 transition-all ${isOpen ? 'bg-white' : 'bg-slate-50'}`}>
        <button 
          onClick={() => {
              // Validate before switching? Optional. Here we allow free movement but block submit.
              if(id === 'academic' && !validatePersonal()) return alert("Please complete Personal Info first.");
              if(id === 'review' && (!validatePersonal() || !validateAcademic())) return alert("Please complete previous sections.");
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
        {isOpen && <div className="p-6 pt-0 animate-fadeIn">{children}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 px-8 py-8 text-white text-center">
          <img src="/meritlogo.jpg" alt="MCAS" className="w-20 h-20 rounded-full bg-white p-1 shadow-lg mx-auto mb-4" />
          <h1 className="text-3xl font-black tracking-tight">STUDENT REGISTRATION</h1>
          <p className="text-blue-200 text-sm font-medium mt-1">Merit College of Advanced Studies • 2025/2026</p>
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
                            <label className="label-text">Gender</label>
                            <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                <option value="">Select</option><option>Male</option><option>Female</option>
                            </select>
                            {errors.gender && <span className="text-red-500 text-xs">{errors.gender}</span>}
                        </div>

                        <InputField label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={v => setFormData({...formData, dateOfBirth: v})} error={errors.dateOfBirth} />
                        <InputField label="Email Address" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} error={errors.email} />
                        
                        <InputField label="Student Phone" type="tel" value={formData.studentPhone} onChange={v => setFormData({...formData, studentPhone: v})} error={errors.studentPhone} />
                        <InputField label="Parent Phone" type="tel" value={formData.parentsPhone} onChange={v => setFormData({...formData, parentsPhone: v})} error={errors.parentsPhone} />
                        
                        <InputField label="State of Origin" value={formData.stateOfOrigin} onChange={v => setFormData({...formData, stateOfOrigin: v})} error={errors.stateOfBirth} />
                        <InputField label="LGA" value={formData.lga} onChange={v => setFormData({...formData, lga: v})} error={errors.lga} />
                    </div>
                    
                    <div className="w-full">
                        <label className="label-text">Permanent Address</label>
                        <textarea className="input-field h-20 resize-none" value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} />
                        {errors.permanentAddress && <span className="text-red-500 text-xs">{errors.permanentAddress}</span>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div className="relative">
                            <label className="label-text">Password</label>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input-field pr-10" 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-slate-400">
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                            {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
                        </div>
                        <div>
                            <label className="label-text">Confirm Password</label>
                            <input 
                                type="password" 
                                className="input-field" 
                                value={formData.confirmPassword} 
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                            />
                            {errors.confirmPassword && <span className="text-red-500 text-xs">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <button 
                        onClick={() => { if(validatePersonal()) setActiveSection('academic'); }}
                        className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold mt-4 hover:bg-blue-800 transition shadow-lg"
                    >
                        Save & Continue <ChevronRight className="inline ml-1" size={18}/>
                    </button>
                </div>
            </AccordionItem>

            {/* 2. ACADEMIC DETAILS */}
            <AccordionItem id="academic" title="Academic Programme" icon={Book}>
                <div className="space-y-6 mt-4">
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="label-text">Programme</label>
                            <select className="input-field" value={formData.programme} onChange={e => setFormData({...formData, programme: e.target.value, subjects: []})}>
                                <option value="">Select Programme</option>
                                <option value="JAMB">JAMB (Max 4)</option>
                                <option value="O-Level">O-Level (Max 9)</option>
                                <option value="A-Level">A-Level (Max 3)</option>
                            </select>
                            {errors.programme && <span className="text-red-500 text-xs">{errors.programme}</span>}
                        </div>
                        <div>
                            <label className="label-text">Department</label>
                            <select className="input-field" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value, subjects: []})}>
                                <option value="">Select Department</option>
                                <option value="Science">Science</option>
                                <option value="Art">Arts</option>
                                <option value="Commercial">Commercial</option>
                            </select>
                            {errors.department && <span className="text-red-500 text-xs">{errors.department}</span>}
                        </div>
                    </div>

                    {formData.department && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-green-600"/> Select Subjects ({formData.subjects.length} selected)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {getSubjectsByDepartment().map(sub => {
                                    const isSel = formData.subjects.includes(sub);
                                    const isComp = (formData.programme === 'O-Level' || formData.programme === 'JAMB') && sub === 'English Language';
                                    return (
                                        <button 
                                            key={sub}
                                            onClick={() => handleSubjectToggle(sub)}
                                            disabled={!isSel && formData.subjects.length >= getMaxSubjects()}
                                            className={`p-2 text-xs font-bold rounded-lg border text-left transition ${
                                                isSel ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-600 hover:border-blue-400'
                                            } ${!isSel && formData.subjects.length >= getMaxSubjects() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {sub} {isComp && '(Req)'}
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
                        <button onClick={() => setActiveSection('personal')} className="flex-1 py-4 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Back</button>
                        <button onClick={() => { if(validateAcademic()) setActiveSection('review'); }} className="flex-1 bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 shadow-lg">Continue</button>
                    </div>
                </div>
            </AccordionItem>

            {/* 3. REVIEW & SUBMIT */}
            <AccordionItem id="review" title="Review & Submit" icon={FileText}>
                <div className="space-y-6 mt-4">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-yellow-600 shrink-0" size={20}/>
                            <div className="text-sm text-yellow-800">
                                <p className="font-bold">Attention:</p>
                                <p>You MUST download or print your form before submitting. It is required for physical verification.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-40 overflow-y-auto text-xs text-slate-600 leading-relaxed">
                        <p className="font-bold mb-2">TERMS & CONDITIONS</p>
                        <ol className="list-decimal ml-4 space-y-1">
                            <li>Fees are non-refundable.</li>
                            <li>Zero tolerance for malpractice.</li>
                            <li>75% attendance mandatory.</li>
                            <li>Proper dressing required.</li>
                            <li>Respect for authority is compulsory.</li>
                        </ol>
                    </div>

                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={formData.termsAccepted} onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} className="w-5 h-5 accent-blue-900"/>
                        <span className="text-sm font-bold text-slate-700">I Accept Terms & Conditions</span>
                    </label>

                    <div>
                        <label className="label-text">Digital Signature</label>
                        <input className="input-field font-script text-xl text-blue-900" placeholder="Type Full Name" value={formData.signature} onChange={e => setFormData({...formData, signature: e.target.value})} />
                    </div>

                    <button onClick={() => setShowPreview(true)} className="w-full py-4 border-2 border-slate-800 text-slate-800 rounded-xl font-bold flex justify-center gap-2 hover:bg-slate-800 hover:text-white transition">
                        <Eye size={20}/> Preview Form
                    </button>

                    <button onClick={handleSubmit} disabled={loading || !formData.termsAccepted} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed flex justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <CheckCircle/>} Submit Application
                    </button>
                </div>
            </AccordionItem>

        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-8 overflow-hidden">
            <div className="bg-slate-100 p-4 border-b flex justify-between items-center sticky top-0 z-10">
                <h3 className="font-bold text-slate-800">Form Preview</h3>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="btn-secondary text-xs py-2 px-4"><Printer size={14}/> Print</button>
                    <button onClick={handleDownloadImage} className="btn-secondary text-xs py-2 px-4"><Download size={14}/> Save</button>
                    <button onClick={() => setShowPreview(false)} className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"><X size={18}/></button>
                </div>
            </div>
            <div className="p-8 bg-slate-200 flex justify-center overflow-auto">
                <div ref={printRef} className="bg-white shadow-xl text-black" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
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
        <label className="label-text">{label}</label>
        <input 
            type={type} 
            className={`input-field ${error ? 'border-red-500 focus:ring-red-200' : ''}`} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
        />
        {error && <span className="text-red-500 text-xs font-bold mt-1 block">{error}</span>}
    </div>
);

const FormPreview = ({ formData }) => (
  <div className="font-serif text-sm leading-relaxed">
    <div className="flex items-center gap-4 border-b-2 border-black pb-4 mb-6">
       <img src="/meritlogo.jpg" alt="Logo" className="w-20 h-20 object-contain"/>
       <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
          <p className="text-xs font-bold tracking-widest mt-1">KNOWLEDGE FOR ADVANCEMENT</p>
          <p className="text-xs mt-2">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
       </div>
    </div>

    <h2 className="text-center font-bold text-lg underline mb-6">STUDENT REGISTRATION FORM</h2>

    <div className="mb-6 border border-slate-300 p-4 rounded-sm break-inside-avoid">
       <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">A. PERSONAL DETAILS</h3>
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

    <div className="mb-6 border border-slate-300 p-4 rounded-sm break-inside-avoid">
       <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">B. ACADEMIC PROGRAM</h3>
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

    <div className="border border-slate-300 p-4 rounded-sm break-inside-avoid">
       <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">C. DECLARATION</h3>
       <p className="text-justify mb-8">
          I, <strong>{formData.surname} {formData.middleName} {formData.lastName}</strong>, hereby declare that the information provided is true and correct. 
          I agree to abide by the rules and regulations of Merit College.
       </p>
       
       <div className="flex justify-between items-end mt-12">
          <div className="text-center">
             <div className="font-script text-2xl mb-1 text-blue-900 border-b border-black min-w-[200px] pb-1">{formData.signature}</div>
             <p className="text-xs font-bold">Applicant Signature</p>
          </div>
          <div className="text-center">
             <div className="border-b border-black min-w-[200px] mb-6"></div>
             <p className="text-xs font-bold">Registrar / Official Stamp</p>
          </div>
       </div>
    </div>
    
    <div className="text-center text-[10px] mt-8 text-slate-400">
       Generated on {new Date().toLocaleString()} | Merit College Portal
    </div>
  </div>
);

export default StudentRegister;
