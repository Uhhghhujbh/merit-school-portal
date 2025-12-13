import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, 
  Loader2, Printer, Download, Share2, AlertTriangle, Info
} from 'lucide-react';

const StudentRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
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
    programme: '', 
    department: '',
    subjects: [],
    university: '', course: '', 
    photoPreview: null,
    signature: '',
    termsAccepted: false,
    location: null
  });

  const [errors, setErrors] = useState({});

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

  // Reset subjects when programme changes
  useEffect(() => {
    if (formData.programme) {
      const hasEnglish = formData.subjects.includes('English Language');
      if ((formData.programme === 'O-Level' || formData.programme === 'JAMB') && !hasEnglish) {
        setFormData(prev => ({ ...prev, subjects: ['English Language'] }));
      }
    }
  }, [formData.programme]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${formData.surname}_Registration_Form`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none; }
      }
    `
  });

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 850
      });
      const link = document.createElement('a');
      link.download = `Registration_${formData.surname}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Download failed. Try using the Print option.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 200 * 1024) { 
      setErrors(p => ({...p, photo: 'Image must be 200KB or less'})); 
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
    const isJAMBOrOLevel = formData.programme === 'JAMB' || formData.programme === 'O-Level';
    
    const aLevelSubjects = {
      Science: [
        "Mathematics", "Further Mathematics", "Physics", "Chemistry", 
        "Biology", "Agricultural Science", "Geology", "Computer Science",
        "Statistics", "Environmental Science", "Health Science"
      ],
      Commercial: [
        "Economics", "Business Studies", "Accounting", "Commerce", 
        "Marketing", "Entrepreneurship", "Banking and Finance", "Insurance",
        "Office Practice", "Secretarial Studies", "Statistics"
      ],
      Art: [
        "Government", "History", "Geography", "Literature in English",
        "Religious Studies (CRS/IRS)", "Philosophy", "Sociology", "Psychology",
        "English Language", "Yoruba", "Hausa", "Igbo", "French", "Arabic",
        "Fine Arts", "Music"
      ]
    };

    const oLevelSubjects = {
      Science: [
        "English Language", "Mathematics", "Physics", "Chemistry", 
        "Biology", "Agricultural Science", "Further Mathematics", 
        "Computer Studies", "Health Science", "Geography", 
        "Civic Education", "Economics", "Religious Studies"
      ],
      Commercial: [
        "English Language", "Mathematics", "Economics", "Commerce", 
        "Financial Accounting", "Business Studies", "Office Practice",
        "Marketing", "Entrepreneurship", "Data Processing", "Book Keeping",
        "Civic Education", "Computer Studies", "Religious Studies"
      ],
      Art: [
        "English Language", "Government", "History", "Geography",
        "Literature in English", "Civic Education", "Social Studies",
        "Religious Studies (CRS/IRS)", "Yoruba", "Hausa", "Igbo", 
        "French", "Arabic", "Fine Arts", "Music", "Home Economics",
        "Economics", "Mathematics"
      ]
    };

    if (isALevel) {
      return aLevelSubjects[formData.department] || [];
    } else if (isJAMBOrOLevel) {
      return oLevelSubjects[formData.department] || [];
    }
    
    return [];
  };

  const getMaxSubjects = () => {
    if (formData.programme === 'O-Level') return 9;
    if (formData.programme === 'JAMB') return 4;
    if (formData.programme === 'A-Level') return 3;
    return 0;
  };

  const isEnglishCompulsory = () => {
    return formData.programme === 'O-Level' || formData.programme === 'JAMB';
  };

  const handleSubjectToggle = (subject) => {
    const max = getMaxSubjects();
    const isCompulsory = subject === 'English Language' && isEnglishCompulsory();
    
    setFormData(prev => {
      const exists = prev.subjects.includes(subject);
      
      // Prevent removing compulsory English
      if (exists && isCompulsory) {
        alert('English Language is compulsory for ' + formData.programme);
        return prev;
      }
      
      // Remove subject
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      }
      
      // Add subject if under limit
      if (prev.subjects.length >= max) {
        alert(`Maximum ${max} subjects allowed for ${formData.programme}`);
        return prev;
      }
      
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.surname) newErrors.surname = "Surname is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.studentPhone) newErrors.studentPhone = "Phone number is required";
      if (!formData.photoPreview) newErrors.photo = "Passport photo is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    }
    
    if (step === 2) {
      if (!formData.programme) newErrors.programme = "Select a programme";
      if (!formData.department) newErrors.department = "Select a department";
      if (formData.subjects.length === 0) newErrors.subjects = "Select at least one subject";
      
      const minSubjects = formData.programme === 'JAMB' ? 4 : formData.programme === 'A-Level' ? 3 : 5;
      if (formData.subjects.length < minSubjects) {
        newErrors.subjects = `Select at least ${minSubjects} subjects`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { 
    if (validateStep(currentStep)) setCurrentStep(p => p + 1); 
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      alert("Please accept the terms and conditions");
      return;
    }
    if (!formData.signature) {
      alert("Please provide your digital signature");
      return;
    }
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const studentId = 'MCAS' + Date.now().toString().slice(-6);
      alert(`Registration Successful! Your Student ID is: ${studentId}`);
      // In real implementation: navigate('/auth/student');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally { 
      setLoading(false); 
    }
  };

  const steps = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Academic Details', icon: Book },
    { num: 3, title: 'Review & Submit', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">MCAS Student Registration</h1>
              <p className="text-blue-200 text-sm mt-1">Merit College of Advanced Studies</p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs text-blue-200">Session 2024/2025</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-slate-50 px-8 py-6 border-b">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.num 
                      ? 'bg-blue-900 border-blue-900 text-white' 
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    <step.icon size={20} />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    currentStep >= step.num ? 'text-blue-900' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    currentStep > step.num ? 'bg-blue-900' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Personal Information</h2>
                <p className="text-slate-600 text-sm">Please fill in your details accurately</p>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col items-center mb-8">
                <div 
                  className="w-36 h-36 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all flex items-center justify-center cursor-pointer overflow-hidden group relative"
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photoPreview ? (
                    <>
                      <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="text-slate-400 mx-auto mb-2" size={32} />
                      <span className="text-xs text-slate-500">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload} 
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Info size={12} /> Maximum 200KB | JPG, PNG
                </p>
                {errors.photo && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.photo}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Surname *</label>
                  <input 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.surname ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Enter surname" 
                    value={formData.surname} 
                    onChange={e=>setFormData({...formData, surname:e.target.value})}
                  />
                  {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.lastName ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="Enter first name" 
                    value={formData.lastName} 
                    onChange={e=>setFormData({...formData, lastName:e.target.value})}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Middle Name</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter middle name" 
                    value={formData.middleName} 
                    onChange={e=>setFormData({...formData, middleName:e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                  <input 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={formData.email} 
                    onChange={e=>setFormData({...formData, email:e.target.value})}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.studentPhone ? 'border-red-500' : 'border-slate-300'}`}
                    placeholder="08012345678" 
                    value={formData.studentPhone} 
                    onChange={e=>setFormData({...formData, studentPhone:e.target.value})}
                  />
                  {errors.studentPhone && <p className="text-red-500 text-xs mt-1">{errors.studentPhone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Guardian Phone</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="08012345678" 
                    value={formData.parentsPhone} 
                    onChange={e=>setFormData({...formData, parentsPhone:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                  <input 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-300'}`}
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={e=>setFormData({...formData, dateOfBirth:e.target.value})}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.gender ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.gender} 
                    onChange={e=>setFormData({...formData, gender:e.target.value})}
                  >
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State of Origin</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="e.g., Lagos" 
                    value={formData.stateOfOrigin} 
                    onChange={e=>setFormData({...formData, stateOfOrigin:e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">LGA</label>
                  <input 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Local Government" 
                    value={formData.lga} 
                    onChange={e=>setFormData({...formData, lga:e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  rows="2"
                  placeholder="Enter your full address" 
                  value={formData.permanentAddress} 
                  onChange={e=>setFormData({...formData, permanentAddress:e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <input 
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10 ${errors.password ? 'border-red-500' : 'border-slate-300'}`}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password" 
                      value={formData.password} 
                      onChange={e=>setFormData({...formData, password:e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                  <input 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300'}`}
                    type="password"
                    placeholder="Re-enter password" 
                    value={formData.confirmPassword} 
                    onChange={e=>setFormData({...formData, confirmPassword:e.target.value})}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Academic Program</h2>
                <p className="text-slate-600 text-sm">Select your programme and subjects</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Programme *</label>
                  <select 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.programme ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.programme} 
                    onChange={e=>{
                      setFormData({...formData, programme:e.target.value, subjects: [], department: ''});
                    }}
                  >
                    <option value="">Select programme</option>
                    <option value="JAMB">JAMB (Max 4 subjects)</option>
                    <option value="O-Level">O-Level (Max 9 subjects)</option>
                    <option value="A-Level">A-Level (Max 3 subjects)</option>
                  </select>
                  {errors.programme && <p className="text-red-500 text-xs mt-1">{errors.programme}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <select 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.department ? 'border-red-500' : 'border-slate-300'}`}
                    value={formData.department} 
                    onChange={e=>{
                      setFormData({...formData, department:e.target.value, subjects: []});
                      // Re-add English if needed
                      if ((formData.programme === 'O-Level' || formData.programme === 'JAMB')) {
                        setTimeout(() => {
                          setFormData(prev => ({...prev, subjects: ['English Language']}));
                        }, 0);
                      }
                    }}
                  >
                    <option value="">Select department</option>
                    <option value="Science">Science</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Art">Arts/Humanities</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>
              </div>

              {/* Subject Selection Info */}
              {formData.programme && formData.department && (
                <>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-900 mb-1">Subject Selection Guidelines:</p>
                        <ul className="text-blue-800 space-y-1">
                          <li>• Maximum subjects: <strong>{getMaxSubjects()}</strong></li>
                          {isEnglishCompulsory() && (
                            <li className="text-blue-900 font-medium">• English Language is COMPULSORY</li>
                          )}
                          <li>• Selected: <strong>{formData.subjects.length}/{getMaxSubjects()}</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Subject Grid */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Select Subjects {errors.subjects && <span className="text-red-500">({errors.subjects})</span>}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getSubjectsByDepartment().map(subject => {
                        const isSelected = formData.subjects.includes(subject);
                        const isCompulsory = subject === 'English Language' && isEnglishCompulsory();
                        const isDisabled = !isSelected && formData.subjects.length >= getMaxSubjects();

                        return (
                          <button
                            key={subject}
                            type="button"
                            onClick={() => handleSubjectToggle(subject)}
                            disabled={isDisabled && !isCompulsory}
                            className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                                : isDisabled
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500 hover:shadow-sm'
                            } ${isCompulsory && isSelected ? 'ring-2 ring-yellow-400' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex-1">{subject}</span>
                              {isSelected && (
                                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                            {isCompulsory && isSelected && (
                              <span className="text-xs text-yellow-300 mt-1 block">Required</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* A-Level Additional Fields */}
              {formData.programme === 'A-Level' && formData.department && (
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">University Choice</label>
                    <input 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="e.g., University of Ilorin" 
                      value={formData.university} 
                      onChange={e=>setFormData({...formData, university:e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Course Choice</label>
                    <input 
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="e.g., Computer Science" 
                      value={formData.course} 
                      onChange={e=>setFormData({...formData, course:e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Review & Submit</h2>
                <p className="text-slate-600 text-sm">Please review your information carefully</p>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <div className="flex gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">IMPORTANT NOTICE:</p>
                    <p>You MUST download or print this registration form before submitting. This form serves as your official admission document.</p>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Terms & Conditions</label>
                <div className="h-64 overflow-y-auto bg-slate-50 p-6 border border-slate-300 rounded-lg text-sm leading-relaxed">
                  <h4 className="font-bold text-base mb-4 text-slate-800">MERIT COLLEGE RULES AND REGULATIONS</h4>
                  <ol className="list-decimal ml-5 space-y-3 text-slate-700">
                    <li>All fees paid are non-refundable under any circumstances.</li>
                    <li>The college maintains zero tolerance for examination malpractice and misconduct.</li>
                    <li>Students must maintain a minimum of 75% attendance to qualify for examinations.</li>
                    <li>Decent dressing is mandatory at all times within the college premises.</li>
                    <li>Student ID cards must be worn visibly at all times.</li>
                    <li>Cultism, violence, and any form of intimidation are strictly prohibited.</li>
                    <li>Students are liable for any damage to college property.</li>
                    <li>Forgery of documents or impersonation leads to immediate expulsion.</li>
                    <li>Students must observe all resumption and examination dates.</li>
                    <li>All students must respect college authority and follow staff instructions.</li>
                    <li>Smoking, alcohol, and substance abuse are prohibited on campus.</li>
                    <li>Students must maintain academic integrity in all assignments and tests.</li>
                  </ol>
                </div>
              </div>

              {/* Acceptance Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-100 transition">
                <input 
                  type="checkbox" 
                  checked={formData.termsAccepted} 
                  onChange={e=>setFormData({...formData, termsAccepted:e.target.checked})}
                  className="mt-1 w-5 h-5 text-blue-900 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  I have read and agree to abide by all the terms, conditions, rules and regulations of Merit College of Advanced Studies. I understand that violation of any rule may lead to disciplinary action including expulsion.
                </span>
              </label>

              {/* Digital Signature */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Digital Signature *</label>
                <input 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-script text-xl text-blue-900"
                  placeholder="Type your full name as signature" 
                  value={formData.signature} 
                  onChange={e=>setFormData({...formData, signature:e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">This will serve as your legal signature on the form</p>
              </div>

              {/* Preview Button */}
              <button 
                onClick={() => setShowPreview(true)} 
                className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
              >
                <Eye size={20}/> 
                <span>Preview Registration Form</span>
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t">
            {currentStep > 1 && (
              <button 
                onClick={()=>setCurrentStep(p=>p-1)} 
                className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button 
                onClick={handleNext} 
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium ml-auto transition-all flex items-center gap-2 shadow-lg"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={loading || !formData.termsAccepted}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg font-bold ml-auto transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 border-b p-4 flex justify-between items-center z-10 rounded-t-xl">
              <h2 className="font-bold text-lg text-white">Registration Form Preview</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint} 
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2"
                >
                  <Printer size={18}/> Print
                </button>
                <button 
                  onClick={handleDownloadImage} 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-500 transition flex items-center gap-2"
                >
                  <Download size={18}/> Save PDF
                </button>
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-lg transition"
                >
                  <X size={18}/>
                </button>
              </div>
            </div>
            
            <div className="overflow-auto bg-slate-100 p-4 md:p-8 flex justify-center">
              <div ref={printRef} className="bg-white shadow-lg text-slate-900" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                <FormPreview formData={formData} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Preview Component (unchanged as requested)
const FormPreview = ({ formData }) => (
  <div className="font-serif text-sm leading-relaxed">
    <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6">
      <div className="w-20 h-20 bg-slate-200 border-2 border-slate-400 flex items-center justify-center text-xs text-slate-500">
        LOGO
      </div>
      <div className="text-center flex-1">
        <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
        <p className="text-xs font-bold tracking-widest mt-1">KNOWLEDGE FOR ADVANCEMENT</p>
        <p className="text-xs mt-2">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
        <p className="text-xs">Tel: +234 816 698 5866 | Email: olayayemi@gmail.com</p>
      </div>
    </div>

    <h2 className="text-center font-bold text-lg underline mb-6">STUDENT REGISTRATION FORM</h2>

    <div className="mb-6 border border-slate-300 p-4 rounded-sm break-inside-avoid">
      <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">A. PERSONAL DETAILS</h3>
      <div className="flex gap-6">
        <div className="w-32 h-32 bg-slate-200 border border-slate-400 flex-shrink-0">
          {formData.photoPreview && <img src={formData.photoPreview} className="w-full h-full object-cover" alt="Student"/>}
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
              <div className="w-4 h-4 border border-slate-800 flex items-center justify-center">✓</div> {sub}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="border border-slate-300 p-4 rounded-sm break-inside-avoid">
      <h3 className="font-bold text-base mb-4 bg-slate-100 p-1">C. DECLARATION</h3>
      <p className="text-justify mb-8">
        I, <strong>{formData.surname} {formData.middleName} {formData.lastName}</strong>, hereby declare that the information provided is true and correct. 
        I agree to abide by the rules and regulations of Merit College. I understand that any false information may lead to disqualification.
      </p>
      
      <div className="flex justify-between items-end mt-12">
        <div className="text-center">
          <div className="font-script text-2xl mb-1 text-blue-900 border-b border-slate-800 min-w-[200px] pb-1">{formData.signature}</div>
          <p className="text-xs font-bold">Applicant Signature</p>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-800 min-w-[200px] mb-6"></div>
          <p className="text-xs font-bold">Registrar / Official Stamp</p>
        </div>
      </div>
    </div>
    
    <div className="text-center text-[10px] mt-8 text-slate-400">
      Printed on {new Date().toLocaleString()} | Merit College Portal
    </div>
  </div>
);

export default StudentRegister;
