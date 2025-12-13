import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { 
  Upload, X, AlertCircle, CheckCircle, MapPin, 
  User, Book, FileText, Save, Eye, EyeOff, ChevronRight, ChevronLeft, 
  Loader2, Printer, Download, Share2, AlertTriangle
} from 'lucide-react';
import { api } from '../../lib/api';

const StudentRegister = () => {
  const navigate = useNavigate();
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
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 850 // Force desktop width render
      });
      const link = document.createElement('a');
      link.download = `Registration_${formData.surname}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Download failed. Try using the Print option.');
    }
  };

  // ... (Keep handleImageUpload, getSubjectsByDepartment, handleSubjectToggle, validateStep logic exactly as before) ...
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { setErrors(p => ({...p, photo: 'Max 200KB'})); return; }
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
        ? ["Mathematics", "Physics", "Chemistry", "Biology", "Further Mathematics", "Computing", "Environmental Science"]
        : ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Maths", "Agric Science", "Geography", "Civic Education"],
      Art: isALevel
        ? ["Literature in English", "History", "Government", "Economics", "Geography", "Sociology", "Law"]
        : ["English Language", "Literature", "Government", "CRS", "IRS", "History", "Geography", "Civic Education", "Fine Arts"],
      Commercial: isALevel
        ? ["Accounting", "Business Management", "Economics", "Marketing", "Commerce", "Business Studies", "Law"]
        : ["English Language", "Mathematics", "Economics", "Accounting", "Commerce", "Marketing", "Business Studies", "Civic Education", "Commerce"]
    };
    return subjects[formData.department] || [];
  };

  const handleSubjectToggle = (subject) => {
    const max = formData.programme === 'O-Level' ? 9 : formData.programme === 'JAMB' ? 4 : 3;
    setFormData(prev => {
      const exists = prev.subjects.includes(subject);
      if (exists) return { ...prev, subjects: prev.subjects.filter(s => s !== subject) };
      if (prev.subjects.length >= max) return prev; 
      return { ...prev, subjects: [...prev.subjects, subject] };
    });
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.surname) newErrors.surname = "Required";
      if (!formData.lastName) newErrors.lastName = "Required";
      if (!formData.email) newErrors.email = "Required";
      if (!formData.studentPhone) newErrors.studentPhone = "Required";
      if (!formData.photoPreview) newErrors.photo = "Photo Required";
      if (!formData.password) newErrors.password = "Required";
    }
    // ... add other validations as needed ...
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) return alert("Accept terms");
    setLoading(true);
    try {
      const payload = { ...formData, role: 'student' };
      const response = await api.post('/students/register', payload);
      alert(`Success! Student ID: ${response.studentId}`);
      navigate('/auth/student');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally { setLoading(false); }
  };

  // ... (Render Form Inputs - Keep existing code for steps 1, 2, 3) ...
  // JUST REPLACING THE RETURN STATEMENT FOR THE PREVIEW LOGIC BELOW

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-soft overflow-hidden">
        {/* ... (Header and Steps) ... */}
        <div className="bg-primary-900 px-8 py-6 text-white flex justify-between items-center">
           <h1 className="text-2xl font-bold">Student Registration</h1>
        </div>

        <div className="p-8">
           {/* ... (Insert your existing Step 1, 2, 3 JSX here) ... */}
           {currentStep === 1 && (
             <div className="space-y-4">
                {/* Image Upload */}
                <div className="flex justify-center mb-6">
                   <div className="w-32 h-32 bg-slate-100 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => fileInputRef.current.click()}>
                      {formData.photoPreview ? <img src={formData.photoPreview} className="w-full h-full object-cover"/> : <Upload className="text-slate-400"/>}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                </div>
                {/* Inputs */}
                <div className="grid md:grid-cols-2 gap-4">
                   <input className="input-field" placeholder="Surname" value={formData.surname} onChange={e=>setFormData({...formData, surname:e.target.value})}/>
                   <input className="input-field" placeholder="Last Name" value={formData.lastName} onChange={e=>setFormData({...formData, lastName:e.target.value})}/>
                   <input className="input-field" placeholder="First Name" value={formData.middleName} onChange={e=>setFormData({...formData, middleName:e.target.value})}/>
                   <input className="input-field" type="email" placeholder="Email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}/>
                   <input className="input-field" placeholder="Phone" value={formData.studentPhone} onChange={e=>setFormData({...formData, studentPhone:e.target.value})}/>
                   <input className="input-field" placeholder="Parents Phone" value={formData.parentsPhone} onChange={e=>setFormData({...formData, parentsPhone:e.target.value})}/>
                   <input className="input-field" type="date" value={formData.dateOfBirth} onChange={e=>setFormData({...formData, dateOfBirth:e.target.value})}/>
                   <select className="input-field" value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}>
                      <option value="">Gender</option><option>Male</option><option>Female</option>
                   </select>
                   <input className="input-field" placeholder="State" value={formData.stateOfOrigin} onChange={e=>setFormData({...formData, stateOfOrigin:e.target.value})}/>
                   <input className="input-field" placeholder="LGA" value={formData.lga} onChange={e=>setFormData({...formData, lga:e.target.value})}/>
                </div>
                <input className="input-field w-full" placeholder="Address" value={formData.permanentAddress} onChange={e=>setFormData({...formData, permanentAddress:e.target.value})}/>
                <div className="grid md:grid-cols-2 gap-4">
                   <input className="input-field" type="password" placeholder="Password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}/>
                   <input className="input-field" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={e=>setFormData({...formData, confirmPassword:e.target.value})}/>
                </div>
             </div>
           )}

           {currentStep === 2 && (
             <div className="space-y-4">
                <select className="input-field w-full" value={formData.programme} onChange={e=>setFormData({...formData, programme:e.target.value})}>
                   <option value="">Select Programme</option><option>JAMB</option><option>O-Level</option><option>A-Level</option>
                </select>
                <select className="input-field w-full" value={formData.department} onChange={e=>setFormData({...formData, department:e.target.value})}>
                   <option value="">Select Department</option><option value="Science">Science</option><option value="Art">Art</option><option value="Commercial">Commercial</option>
                </select>
                {formData.department && (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                      {getSubjectsByDepartment().map(sub => (
                         <div key={sub} onClick={() => handleSubjectToggle(sub)} className={`p-2 border rounded cursor-pointer text-xs ${formData.subjects.includes(sub) ? 'bg-blue-900 text-white' : 'bg-slate-50'}`}>
                            {sub}
                         </div>
                      ))}
                   </div>
                )}
                {formData.programme === 'A-Level' && (
                   <div className="grid md:grid-cols-2 gap-4">
                      <input className="input-field" placeholder="University Choice" value={formData.university} onChange={e=>setFormData({...formData, university:e.target.value})}/>
                      <input className="input-field" placeholder="Course Choice" value={formData.course} onChange={e=>setFormData({...formData, course:e.target.value})}/>
                   </div>
                )}
             </div>
           )}

           {currentStep === 3 && (
             <div className="space-y-4">
               <div className="bg-yellow-50 p-4 border-l-4 border-yellow-500 text-yellow-800 text-sm">
                  <strong>IMPORTANT:</strong> You MUST download or print this form before submitting.
               </div>
               <div className="h-40 overflow-y-auto bg-slate-50 p-4 text-xs border rounded">
                  <h4 className="font-bold mb-2">Terms & Conditions</h4>
                  <ol className="list-decimal ml-4 space-y-1">
                     <li>Fees are non-refundable.</li>
                     <li>Zero tolerance for malpractice.</li>
                     <li>75% attendance required.</li>
                     <li>Decent dressing is mandatory.</li>
                     <li>ID cards must be worn.</li>
                     <li>No cultism or violence.</li>
                     <li>Students liable for damages.</li>
                     <li>Forgery leads to expulsion.</li>
                     <li>Observe resumption dates.</li>
                     <li>Respect school authority.</li>
                  </ol>
               </div>
               <label className="flex gap-2 text-sm items-center">
                  <input type="checkbox" checked={formData.termsAccepted} onChange={e=>setFormData({...formData, termsAccepted:e.target.checked})} />
                  I accept the terms.
               </label>
               <input className="input-field w-full" placeholder="Digital Signature (Type Name)" value={formData.signature} onChange={e=>setFormData({...formData, signature:e.target.value})} />
               
               <button onClick={() => setShowPreview(true)} className="w-full bg-slate-800 text-white py-3 rounded flex items-center justify-center gap-2">
                  <Eye size={18}/> Preview & Print
               </button>
             </div>
           )}

           <div className="flex justify-between mt-8">
              {currentStep > 1 && <button onClick={()=>setCurrentStep(p=>p-1)} className="px-4 py-2 border rounded">Back</button>}
              {currentStep < 3 ? (
                 <button onClick={handleNext} className="px-4 py-2 bg-blue-900 text-white rounded ml-auto">Next</button>
              ) : (
                 <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded ml-auto">Submit Application</button>
              )}
           </div>
        </div>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl my-8">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10 rounded-t-xl">
               <h2 className="font-bold text-lg">Form Preview</h2>
               <div className="flex gap-2">
                  <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2"><Printer size={18}/> Print</button>
                  <button onClick={handleDownloadImage} className="bg-green-600 text-white px-4 py-2 rounded flex gap-2"><Download size={18}/> Save</button>
                  <button onClick={() => setShowPreview(false)} className="bg-slate-200 px-3 py-2 rounded"><X size={18}/></button>
               </div>
            </div>
            
            {/* SCROLL CONTAINER FOR MOBILE */}
            <div className="overflow-auto bg-slate-100 p-4 md:p-8 flex justify-center">
                {/* FIXED WIDTH CONTAINER - This fixes the mobile render issue */}
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

// --- PREVIEW COMPONENT (Fixed Layout for Print) ---
const FormPreview = ({ formData }) => (
  <div className="font-serif text-sm leading-relaxed">
    {/* Header */}
    <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-6">
       <img src="/meritlogo.jpg" alt="Logo" className="w-20 h-20 object-contain"/>
       <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-blue-900 uppercase">Merit College of Advanced Studies</h1>
          <p className="text-xs font-bold tracking-widest mt-1">KNOWLEDGE FOR ADVANCEMENT</p>
          <p className="text-xs mt-2">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin.</p>
          <p className="text-xs">Tel: +234 816 698 5866 | Email: olayayemi@gmail.com</p>
       </div>
    </div>

    <h2 className="text-center font-bold text-lg underline mb-6">STUDENT REGISTRATION FORM</h2>

    {/* Personal Details - FIXED GRID (No Responsive Classes) */}
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

    {/* Academic Details - FIXED GRID */}
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

    {/* Declaration - FIXED LAYOUT */}
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
