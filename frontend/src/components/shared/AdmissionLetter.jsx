import React from 'react';

const AdmissionLetter = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  return (
    <div ref={ref} className="bg-white p-12 font-serif" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header with Logo */}
      <div className="flex items-start justify-between mb-8 border-b-4 border-blue-900 pb-6">
        <img src="/meritlogo.jpg" alt="Merit College" className="w-24 h-24 object-contain" />
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-blue-900 tracking-wide">MERIT COLLEGE OF ADVANCED STUDIES</h1>
          <p className="text-sm text-slate-600 mt-2 font-semibold">KNOWLEDGE FOR ADVANCEMENT</p>
          <p className="text-xs text-slate-500 mt-3">Office: 32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State</p>
          <p className="text-xs text-slate-500">Tel: +2348166985866 | Email: olayayemi@gmail.com</p>
        </div>
      </div>

      {/* Letter Reference */}
      <div className="text-right mb-8">
        <p className="text-sm font-bold">Ref: MCAS/ADM/{new Date().getFullYear()}/{student.student_id_text?.split('/')[2] || '001'}</p>
        <p className="text-sm text-slate-600">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Addressee */}
      <div className="mb-8">
        <p className="font-bold text-lg">{student.surname} {student.first_name} {student.middle_name || ''}</p>
        <p className="text-sm text-slate-600">{student.permanent_address || 'N/A'}</p>
      </div>

      {/* Salutation */}
      <p className="mb-6 font-bold">Dear {student.surname},</p>

      {/* Letter Title */}
      <h2 className="text-center text-xl font-bold underline mb-8 text-blue-900">
        PROVISIONAL ADMISSION LETTER - {new Date().getFullYear()}/{new Date().getFullYear() + 1} ACADEMIC SESSION
      </h2>

      {/* Letter Body */}
      <div className="space-y-4 text-justify leading-relaxed">
        <p>
          Following your application for admission into Merit College of Advanced Studies, I am pleased to inform you that you have been 
          offered <strong>PROVISIONAL ADMISSION</strong> to study <strong>{student.program_type || 'N/A'}</strong> in the 
          <strong> {student.department || 'N/A'} Department</strong> for the {new Date().getFullYear()}/{new Date().getFullYear() + 1} academic session.
        </p>

        <p>
          Your <strong>Student ID Number</strong> is: <span className="font-bold text-blue-900">{student.student_id_text}</span>
        </p>

        <p>
          This admission is provisional and will be confirmed upon:</p>
        <ol className="list-decimal ml-8 space-y-2">
          <li>Full payment of acceptance and tuition fees</li>
          <li>Submission of all required original documents</li>
          <li>Verification of credentials by the Academic Board</li>
          <li>Compliance with the College's admission requirements</li>
        </ol>

        <div className="my-6 bg-slate-50 p-4 border-l-4 border-blue-900">
          <p className="font-bold mb-2">ADMISSION DETAILS:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Programme:</strong> {student.program_type}</div>
            <div><strong>Department:</strong> {student.department}</div>
            <div><strong>Session:</strong> {new Date().getFullYear()}/{new Date().getFullYear() + 1}</div>
            <div><strong>Admission Status:</strong> <span className="text-orange-600 font-bold">PROVISIONAL</span></div>
          </div>
        </div>

        <p className="font-bold mt-6">ACCEPTANCE PROCEDURE:</p>
        <ol className="list-decimal ml-8 space-y-2">
          <li>Log into your student portal using your Student ID and password</li>
          <li>Complete the online payment of acceptance fees</li>
          <li>Print your admission letter and payment receipt</li>
          <li>Report to the College on the resumption date with all required documents</li>
        </ol>

        <p className="mt-6">
          <strong>Resumption Date:</strong> To be communicated via the student portal and official notice board.
        </p>

        <p className="mt-6">
          We congratulate you on this achievement and look forward to welcoming you to the Merit College family. Should you have any 
          questions, please do not hesitate to contact the Admissions Office.
        </p>
      </div>

      {/* Signature Section */}
      <div className="mt-16 flex justify-between items-end">
        <div className="text-center">
          <div className="border-t-2 border-slate-800 pt-2 w-48">
            <p className="font-bold">Dr. Olaya Opeyemi</p>
            <p className="text-sm text-slate-600">Admin (sch. management)</p>
          </div>
        </div>
        
        <div className="text-center">
          <img src="/stamp.png" alt="Official Stamp" className="w-24 h-24 mx-auto" onError={(e) => e.target.style.display = 'none'} />
          <p className="text-xs text-slate-500">Official Stamp</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-slate-300 text-center">
        <p className="text-xs text-slate-500">
          This is a computer-generated letter and does not require a signature. 
          For verification, visit https://meritcollege.vercel.app or contact our admissions office.
        </p>
      </div>
    </div>
  );
});

AdmissionLetter.displayName = 'AdmissionLetter';

export default AdmissionLetter;
