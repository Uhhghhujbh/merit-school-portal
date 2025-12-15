import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  User,
  BookOpen,
  MapPin,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Camera,
} from 'lucide-react';

const StudentRegister = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    surname: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    studentPhone: '',
    dateOfBirth: '',
    gender: 'Male',
    programme: 'JAMB',
    department: 'Science',
    subjects: [],
    university: '',
    course: '',
    parentsName: '',
    parentsPhone: '',
    parentsEmail: '',
    stateOfOrigin: '',
    lga: '',
    permanentAddress: '',
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{11}$/.test(phone);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo too large (Max 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleStepCompletion = (step) => {
    setError('');

    if (step === 1) {
      if (!formData.surname || !formData.lastName || !formData.email || !formData.studentPhone) {
        setError('Please fill all required fields (Name, Email, Phone).');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Invalid Email Address format.');
        return;
      }
      if (!validatePhone(formData.studentPhone)) {
        setError('Student Phone Number must be 11 digits.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    if (step === 2) {
      if (formData.subjects.length < 3) {
        setError('Please select at least 3 subjects.');
        return;
      }
      if (!formData.university || !formData.course) {
        setError('University and Course choices are required.');
        return;
      }
    }

    if (step === 3) {
      if (!formData.parentsName || !formData.parentsPhone || !formData.permanentAddress) {
        setError('Parent details and Address are required.');
        return;
      }
      if (!validatePhone(formData.parentsPhone)) {
        setError('Parent Phone Number must be 11 digits.');
        return;
      }
      if (formData.parentsPhone === formData.studentPhone) {
        setError('Parent Phone cannot be the same as Student Phone.');
        return;
      }
    }

    if (activeStep < 4) setActiveStep((p) => p + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { ...formData, photoPreview });
      alert('Registration Successful! Please Login.');
      navigate('/auth/student');
    } catch (err) {
      const msg = err?.message || 'Registration Failed';
      if (msg.includes('already') || msg.includes('duplicate')) {
        setError('This Email Address has already been used. Please login instead.');
        setActiveStep(1);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const StepHeader = ({ step, title }) => {
    const isActive = activeStep === step;
    const isCompleted = activeStep > step;

    return (
      <div
        onClick={() => isCompleted && setActiveStep(step)}
        className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
          isActive
            ? 'bg-blue-50 border-blue-500 shadow-md'
            : isCompleted
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-slate-200 opacity-60'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
            isActive
              ? 'bg-blue-600 text-white'
              : isCompleted
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {isCompleted ? <CheckCircle size={22} /> : step}
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>{title}</h3>
        </div>
        {isActive ? <ChevronDown /> : <ChevronRight />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Student Registration</h1>
        <p className="text-slate-500 mb-8">Join Merit College for the 2025/2026 Session</p>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3">
            <AlertCircle />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <StepHeader step={1} title="Personal Information" />
          {activeStep === 1 && (
            <div className="bg-white p-6 rounded-xl border space-y-6">
              <div className="flex justify-center">
                <div
                  className="relative w-32 h-32 rounded-full overflow-hidden border cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <User size={40} className="text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100">
                    <Camera />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Surname" name="surname" value={formData.surname} onChange={handleChange} />
                <Input label="First Name" name="middleName" value={formData.middleName} onChange={handleChange} />
                <Input label="Other Name" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Email" name="email" value={formData.email} onChange={handleChange} />
                <Input label="Phone" name="studentPhone" value={formData.studentPhone} onChange={handleChange} />
              </div>

              <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} />

              <div className="flex justify-end">
                <Button onClick={() => handleStepCompletion(1)}>Continue</Button>
              </div>
            </div>
          )}

          <StepHeader step={2} title="Academic Program" />
          {activeStep === 2 && (
            <div className="bg-white p-6 rounded-xl border space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Select label="Programme" name="programme" value={formData.programme} onChange={handleChange} options={['JAMB', 'A-Level', 'O-Level']} />
                <Select label="Department" name="department" value={formData.department} onChange={handleChange} options={['Science', 'Art', 'Commercial']} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics'].map((s) => (
                  <label key={s} className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(s)}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          subjects: e.target.checked ? [...p.subjects, s] : p.subjects.filter((x) => x !== s),
                        }))
                      }
                    />
                    {s}
                  </label>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input label="University" name="university" value={formData.university} onChange={handleChange} />
                <Input label="Course" name="course" value={formData.course} onChange={handleChange} />
              </div>

              <div className="flex justify-between">
                <BackButton onClick={() => setActiveStep(1)} />
                <Button onClick={() => handleStepCompletion(2)}>Continue</Button>
              </div>
            </div>
          )}

          <StepHeader step={3} title="Guardian & Contact" />
          {activeStep === 3 && (
            <div className="bg-white p-6 rounded-xl border space-y-6">
              <Input label="Parent Name" name="parentsName" value={formData.parentsName} onChange={handleChange} />
              <Input label="Parent Phone" name="parentsPhone" value={formData.parentsPhone} onChange={handleChange} />
              <textarea
                className="w-full p-4 border rounded"
                name="permanentAddress"
                placeholder="Permanent Address"
                value={formData.permanentAddress}
                onChange={handleChange}
              />
              <div className="flex justify-between">
                <BackButton onClick={() => setActiveStep(2)} />
                <Button onClick={() => handleStepCompletion(3)}>Review</Button>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="bg-slate-900 text-white p-6 rounded-xl">
              <button type="submit" disabled={loading} className="w-full bg-green-500 py-4 rounded-xl font-bold">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Submit Registration'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="block mb-1 font-bold">{label}</label>
    <input className="w-full p-3 border rounded" {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label className="block mb-1 font-bold">{label}</label>
    <select className="w-full p-3 border rounded" {...props}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const Button = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="bg-blue-900 text-white px-6 py-3 rounded">
    {children}
  </button>
);

const BackButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="px-6 py-3">
    Back
  </button>
);

export default StudentRegister;
