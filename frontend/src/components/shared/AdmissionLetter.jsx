import React from 'react';

const AdmissionLetter = React.forwardRef(({ student }, ref) => {
  if (!student) return null;

  return (
    <div ref={ref} className="bg-white font-serif text-black relative" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
      {/* Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
         <img src="/meritlogo.jpg" className="w-[500px] grayscale" />
      </div>

      <div className="relative z-10 border-4 border-double border-blue-900 h-full p-8">
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-blue-900 pb-6 mb-8">
          <img src="/meritlogo.jpg" alt="Merit College" className="w-24 h-24 object-contain" />
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-900 uppercase tracking-wider scale-y-110">Merit College</h1>
            <h2 className="text-xl font-bold text-slate-700 uppercase tracking-widest">Of Advanced Studies</h2>
            <p className="text-xs font-bold mt-2 text-slate-500">KNOWLEDGE FOR ADVANCEMENT</p>
            <p className="text-[10px] text-slate-500 mt-1">32, Ansarul Ogidi, beside Conoil Filling Station, Ilorin, Kwara State.</p>
          </div>
        </div>

        {/* Ref & Date */}
        <div className="flex justify-between items-end mb-10 font-bold text-sm">
          <div>
            <p>Ref: <span className="text-blue-900">MCAS/ADM/{new Date().getFullYear()}/{student.student_id_text?.split('/').pop() || '000'}</span></p>
          </div>
          <div>
            <p>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold underline decoration-blue-900 decoration-2 underline-offset-4">PROVISIONAL ADMISSION LETTER</h2>
          <p className="text-sm font-bold mt-2 text-slate-600">{new Date().getFullYear()}/{new Date().getFullYear() + 1} ACADEMIC SESSION</p>
        </div>

        {/* Content */}
        <div className="text-justify leading-loose text-sm space-y-6">
          <p>Dear <strong>{student.surname} {student.first_name}</strong>,</p>
          
          <p>
            Following your successful application, the Management of Merit College of Advanced Studies is pleased to offer you 
            <strong> Provisional Admission</strong> into the <strong>{student.department || 'N/A'} Department</strong> for the 
            <strong> {student.program_type || 'N/A'}</strong> programme.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-900 p-4 my-6">
             <p className="font-bold">Your Matriculation Number: <span className="text-xl ml-2 text-blue-900">{student.student_id_text}</span></p>
          </div>

          <p>This offer is subject to the ratification of your credentials and payment of all prescribed fees.</p>

          <div>
            <p className="font-bold underline mb-2">Conditions of Admission:</p>
            <ul className="list-disc ml-6 space-y-1">
               <li>Acceptance of this offer implies readiness to abide by the school rules.</li>
               <li>All fees paid are non-refundable.</li>
               <li>You must maintain 75% class attendance.</li>
            </ul>
          </div>

          <p className="mt-8">
            Congratulations on your admission. We look forward to your academic success.
          </p>
        </div>

        {/* Signatures - Uses break-inside-avoid to prevent splitting */}
        <div className="mt-20 flex justify-between items-end break-inside-avoid">
          <div className="text-center">
            <div className="border-b-2 border-slate-900 mb-2 w-48 mx-auto"></div>
            <p className="font-bold">Dr. Olaya Opeyemi</p>
            <p className="text-xs uppercase font-bold text-slate-500">Registrar</p>
          </div>
          
          <div className="text-center">
             <div className="w-24 h-24 border-4 border-double border-slate-300 rounded-full flex items-center justify-center mb-2 mx-auto rotate-[-12deg]">
                <span className="text-[10px] font-bold text-slate-300">OFFICIAL STAMP</span>
             </div>
             <p className="text-xs uppercase font-bold text-slate-500">Management</p>
          </div>
        </div>
      </div>
    </div>
  );
});

AdmissionLetter.displayName = 'AdmissionLetter';
export default AdmissionLetter;
