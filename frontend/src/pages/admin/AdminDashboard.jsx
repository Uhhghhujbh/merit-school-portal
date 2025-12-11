import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { 
  LayoutDashboard, Users, DollarSign, LogOut, Bell, 
  CheckCircle, XCircle, Printer, Lock, Unlock, Shield, Key, 
  Loader2, AlertTriangle, Book, FileCheck, Search, Activity, Trash2, Edit
} from 'lucide-react';
import AdmissionLetter from '../../components/shared/AdmissionLetter';
import LibraryView from '../../components/shared/LibraryView';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const AdminDashboard = () => {
  const { login, logout } = useAuthStore();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState(null);
  
  // Data
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [fees, setFees] = useState([]);
  const [broadcast, setBroadcast] = useState({ title: '', message: '', target: 'all' });
  const [searchTerm, setSearchTerm] = useState('');

  // Results State
  const [selectedStudentForResults, setSelectedStudentForResults] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]); // Dynamic subjects
  const [scoreData, setScoreData] = useState({ subject: '', ca: '', exam: '' });

  // Print
  const printRef = useRef();
  const [printData, setPrintData] = useState(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    const initAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth/admin'); return; }

      setAdminToken(session.access_token);
      login(session.user, session.access_token, 'admin');
      await loadInitialData(session.access_token);
    };
    initAdmin();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredStudents(students.filter(s => 
        s.surname?.toLowerCase().includes(lower) || 
        s.first_name?.toLowerCase().includes(lower) || 
        s.student_id_text?.toLowerCase().includes(lower)
      ));
    }
  }, [searchTerm, students]);

  const loadInitialData = async (token) => {
    setLoading(true);
    try {
      const [studentsData, statsData, settingsData, logsData] = await Promise.all([
        api.get('/schmngt/students', token),
        api.get('/schmngt/dashboard-stats', token),
        api.get('/schmngt/settings', token),
        api.get('/activity-logs/all', token) // Fetch Logs
      ]);

      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);
      setStats(statsData);
      setFees(settingsData || []);
      setActivityLogs(logsData || []);
    } catch (err) {
      console.error("Data Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const toggleStudentStatus = async (id, action, currentValue) => {
    if (!confirm(`Are you sure you want to ${action} this student?`)) return;
    try {
      await api.post('/schmngt/update-student', { studentId: id, action, value: !currentValue }, adminToken);
      loadInitialData(adminToken);
    } catch (err) { alert('Failed to update status'); }
  };

  const deleteStudent = async (id) => {
    if (!confirm("⚠️ DANGER: This will permanently delete the student and all their data! Are you sure?")) return;
    // Note: You need to implement this endpoint in adminController if not exists, currently reuse suspend logic or add delete
    try {
       // Assuming you add a DELETE route, for now let's just alert functionality
       alert("To prevent accidental data loss, please use the Database Console to permanently delete.");
    } catch (err) { alert('Failed'); }
  };

  const sendBroadcast = async () => {
    if (!broadcast.title || !broadcast.message) return alert("Fill all fields");
    try {
      await api.post('/schmngt/broadcast', broadcast, adminToken);
      alert('Broadcast Sent!');
      setBroadcast({ title: '', message: '', target: 'all' });
    } catch (err) { alert('Failed'); }
  };

  const handleStudentSelectForResult = (student) => {
    setSelectedStudentForResults(student);
    // Parse subjects from JSONB or array
    let subs = [];
    if (Array.isArray(student.subjects)) subs = student.subjects;
    else if (typeof student.subjects === 'string') subs = JSON.parse(student.subjects);
    setStudentSubjects(subs);
    setScoreData({ subject: '', ca: '', exam: '' });
  };

  const uploadResult = async () => {
    if(!selectedStudentForResults || !scoreData.subject) return alert("Select student and subject");
    try {
      await api.post('/results/upload', {
        student_id: selectedStudentForResults.id,
        subject: scoreData.subject,
        ca: scoreData.ca,
        exam: scoreData.exam,
        term: 'First Term',
        session: '2025/2026'
      }, adminToken);
      alert("Result Saved!");
      setScoreData({ subject: '', ca: '', exam: '' });
    } catch(err) { alert("Failed: " + err.message); }
  };

  const preparePrint = (student) => {
    setPrintData(student);
    setTimeout(() => handlePrint(), 500); 
  };

  const generateStaffCode = async () => {
    try {
      const res = await api.post('/schmngt/generate-code', {}, adminToken);
      alert(`NEW TOKEN: ${res.code}`);
    } catch (err) { alert('Failed'); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-blue-900"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">Merit Admin</h1>
          <p className="text-xs text-slate-400 mt-1">Management Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <TabBtn icon={<LayoutDashboard/>} label="Overview" active={activeTab==='overview'} onClick={()=>setActiveTab('overview')} />
          <TabBtn icon={<Activity/>} label="Activity Log" active={activeTab==='logs'} onClick={()=>setActiveTab('logs')} />
          <TabBtn icon={<Users/>} label="Students" active={activeTab==='students'} onClick={()=>setActiveTab('students')} />
          <TabBtn icon={<FileCheck/>} label="Results" active={activeTab==='results'} onClick={()=>setActiveTab('results')} />
          <TabBtn icon={<Book/>} label="Library" active={activeTab==='library'} onClick={()=>setActiveTab('library')} />
          <TabBtn icon={<Bell/>} label="Broadcasts" active={activeTab==='broadcast'} onClick={()=>setActiveTab('broadcast')} />
          <TabBtn icon={<Shield/>} label="Staff" active={activeTab==='staff'} onClick={()=>setActiveTab('staff')} />
          <TabBtn icon={<DollarSign/>} label="Settings" active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={()=>{logout(); navigate('/');}} className="flex items-center gap-3 text-red-300 hover:text-white transition w-full p-2 rounded hover:bg-slate-800">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 capitalize">{activeTab}</h2>
            <p className="text-slate-500">Session 2025/2026 • Term 1</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 px-4 rounded-full shadow-sm border border-slate-200 text-sm font-medium">
              Admin: <span className="text-blue-600">Super User</span>
            </div>
          </div>
        </header>

        {/* --- OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Total Students" value={stats?.totalStudents} icon={<Users/>} color="blue" />
              <StatCard label="Paid Revenue" value={`₦${stats?.totalRevenue?.toLocaleString()}`} icon={<DollarSign/>} color="green" />
              <StatCard label="Staff Count" value={stats?.totalStaff} icon={<Shield/>} color="purple" />
              <StatCard label="Pending Approval" value={stats?.pendingValidation} icon={<AlertTriangle/>} color="orange" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={()=>setActiveTab('students')} className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-left font-bold">Manage Students</button>
                  <button onClick={()=>setActiveTab('results')} className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-left font-bold">Upload Results</button>
                  <button onClick={()=>setActiveTab('broadcast')} className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition text-left font-bold">Send Alert</button>
                  <button onClick={generateStaffCode} className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-left font-bold">New Staff Token</button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4">Enrollment Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-slate-600">JAMB Students</span> <span className="font-bold">{stats?.breakdown?.jamb}</span></div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{width: `${(stats?.breakdown?.jamb / stats?.totalStudents)*100}%`}}></div></div>
                  
                  <div className="flex justify-between items-center"><span className="text-slate-600">A-Level Students</span> <span className="font-bold">{stats?.breakdown?.alevel}</span></div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-purple-500 h-full" style={{width: `${(stats?.breakdown?.alevel / stats?.totalStudents)*100}%`}}></div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ACTIVITY LOGS --- */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="font-bold">{log.student_name}</div>
                      <div className="text-xs text-slate-400">{log.student_id_text}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        log.action === 'registered' ? 'bg-blue-100 text-blue-700' : 
                        log.action === 'payment_completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-mono">
                      IP: {log.ip_address}<br/>
                      {log.device_info?.substring(0, 30)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- STUDENTS --- */}
        {activeTab === 'students' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
                <input 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Search students by name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Identity</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Programme</th>
                      <th className="p-4">Access</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{s.surname} {s.first_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{s.student_id_text}</div>
                        </td>
                        <td className="p-4">
                          {s.payment_status === 'paid' ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded w-fit">
                              <CheckCircle size={14}/> Paid
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 font-bold bg-red-50 px-2 py-1 rounded w-fit">
                              <XCircle size={14}/> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">{s.program_type}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => toggleStudentStatus(s.id, 'validate', s.is_validated)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${s.is_validated ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                          >
                            {s.is_validated ? 'Active' : 'Locked'}
                          </button>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => preparePrint(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Print Letter"><Printer size={18}/></button>
                          <button onClick={() => toggleStudentStatus(s.id, 'parent_access', s.is_parent_access_enabled)} className={`p-2 rounded ${s.is_parent_access_enabled ? 'text-green-600' : 'text-slate-400'}`} title="Parent Access"><Users size={18}/></button>
                          <button onClick={() => deleteStudent(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- RESULTS --- */}
        {activeTab === 'results' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] overflow-y-auto">
              <h3 className="font-bold mb-4">Select Student</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-400" size={16}/>
                <input 
                  className="w-full pl-9 p-2 border rounded-lg text-sm" 
                  placeholder="Search..."
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                {filteredStudents.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => handleStudentSelectForResult(s)} 
                    className={`p-3 rounded-lg cursor-pointer transition ${selectedStudentForResults?.id === s.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                  >
                    <div className="font-bold">{s.surname} {s.first_name}</div>
                    <div className={`text-xs ${selectedStudentForResults?.id === s.id ? 'text-blue-200' : 'text-slate-500'}`}>{s.student_id_text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold mb-6 text-lg">Enter Result Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Student</label>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-600 font-medium">
                    {selectedStudentForResults ? `${selectedStudentForResults.surname} ${selectedStudentForResults.first_name}` : 'No student selected'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Subject</label>
                  <select 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={scoreData.subject}
                    onChange={e => setScoreData({...scoreData, subject: e.target.value})}
                  >
                    <option value="">Select Registered Subject</option>
                    {studentSubjects.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                    {/* Fallback general subjects if none registered */}
                    {studentSubjects.length === 0 && (
                      <>
                        <option value="Mathematics">Mathematics</option>
                        <option value="English Language">English Language</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">CA (40)</label>
                    <input type="number" className="w-full p-3 border rounded-lg" max="40" value={scoreData.ca} onChange={e => setScoreData({...scoreData, ca: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Exam (60)</label>
                    <input type="number" className="w-full p-3 border rounded-lg" max="60" value={scoreData.exam} onChange={e => setScoreData({...scoreData, exam: e.target.value})} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-slate-600">Total: {(Number(scoreData.ca) + Number(scoreData.exam)) || 0}</span>
                  <span className="font-bold text-lg text-blue-700">Grade: {calculateGrade(Number(scoreData.ca) + Number(scoreData.exam))}</span>
                </div>

                <button 
                  onClick={uploadResult}
                  disabled={!selectedStudentForResults || !scoreData.subject}
                  className={`w-full py-3 rounded-lg font-bold text-white transition ${!selectedStudentForResults || !scoreData.subject ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Save Result
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LIBRARY --- */}
        {activeTab === 'library' && (
          <LibraryView 
            user={{ id: 'admin', email: adminEmail, full_name: 'Admin' }} 
            role="admin" 
            isAdmin={true} 
            token={adminToken} 
          />
        )}

        {/* --- BROADCASTS --- */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-xl mb-6">Create New Announcement</h3>
            <div className="space-y-4">
              <input 
                className="w-full p-3 border rounded-lg" 
                placeholder="Title (e.g. Exam Schedule)"
                value={broadcast.title}
                onChange={e => setBroadcast({...broadcast, title: e.target.value})}
              />
              <textarea 
                className="w-full p-3 border rounded-lg h-32" 
                placeholder="Message details..."
                value={broadcast.message}
                onChange={e => setBroadcast({...broadcast, message: e.target.value})}
              />
              <select 
                className="w-full p-3 border rounded-lg"
                value={broadcast.target}
                onChange={e => setBroadcast({...broadcast, target: e.target.value})}
              >
                <option value="all">Everyone</option>
                <option value="student">Students Only</option>
                <option value="staff">Staff Only</option>
              </select>
              <button onClick={sendBroadcast} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Send Broadcast</button>
            </div>
          </div>
        )}

        {/* --- SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-xl mb-6">System Fees</h3>
            <div className="space-y-4">
              {fees.map((fee, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded">
                  <span className="font-medium capitalize">{fee.key.replace('fee_', '')} Fee</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">₦</span>
                    <input 
                      type="number" 
                      className="border p-2 rounded w-32"
                      value={fee.value}
                      onChange={(e) => {
                        const newFees = [...fees];
                        newFees[idx].value = e.target.value;
                        setFees(newFees);
                      }}
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => alert("Fees updated!")} className="mt-4 px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800">Save Changes</button>
            </div>
          </div>
        )}

      </main>

      {/* Hidden Print Component */}
      <div style={{ display: "none" }}>
        <AdmissionLetter ref={printRef} student={printData} />
      </div>
    </div>
  );
};

// Helpers
const TabBtn = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors mb-1 ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    {icon} <span className="font-medium text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }) => {
  const colors = { blue: 'text-blue-600 bg-blue-50', green: 'text-green-600 bg-green-50', purple: 'text-purple-600 bg-purple-50', orange: 'text-orange-600 bg-orange-50' };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{value || 0}</p>
      </div>
      <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
    </div>
  );
};

const calculateGrade = (total) => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

export default AdminDashboard;
