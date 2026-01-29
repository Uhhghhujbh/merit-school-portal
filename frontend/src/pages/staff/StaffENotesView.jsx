import React, { useState, useEffect } from 'react';
import { FileText, Upload, Clock, CheckCircle, XCircle, Trash2, Plus, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

const StaffENotesView = ({ token, user }) => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'upload'
    const [myNotes, setMyNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        class_level: 'All',
        description: '',
        file_url: '' // Google Drive Link
    });

    const [subjects] = useState([
        "Mathematics", "English", "Physics", "Chemistry", "Biology",
        "Government", "Economics", "Literature", "CRK", "IRK"
    ]); // Could fetch dynamically

    useEffect(() => {
        fetchMyNotes();
    }, []);

    const fetchMyNotes = async () => {
        try {
            setLoading(true);
            const data = await api.get('/enotes/mine', token);
            setMyNotes(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.file_url || !formData.subject) return alert("Fill required fields");

        setUploading(true);
        try {
            const res = await api.post('/enotes/add', {
                ...formData,
                file_type: 'pdf', // Default
                file_size: 0
            }, token);

            if (res.success) {
                alert(res.message);
                setFormData({ title: '', subject: '', class_level: 'All', description: '', file_url: '' });
                setActiveTab('list');
                fetchMyNotes();
            }
        } catch (err) {
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this note?")) return;
        try {
            await api.delete(`/enotes/${id}`, token); // Admin route, but verifying Staff might not have delete permission? 
            // The routes defined deleteENote with verifyAdmin. Staff cannot delete??
            // Re-checking enotesRoutes.js: router.delete('/:id', verifyAdmin, ...);
            // So Staff CANNOT delete. I should hide delete button or update backend. 
            // For now, I will omit generic delete for Staff unless status is pending? 
            // Staff usually can delete their own pending stuff. Backend logic would need update.
            // I'll just OMIT delete for now to be safe.
        } catch (err) {
            alert("Delete failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-purple-600" /> My E-Notes
                    </h2>
                    <p className="text-slate-500 text-sm">Upload and track your study material contributions.</p>
                </div>
                <button
                    onClick={() => setActiveTab(activeTab === 'list' ? 'upload' : 'list')}
                    className="bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-800 transition shadow-lg"
                >
                    {activeTab === 'list' ? <><Plus size={20} /> Upload New Note</> : "View My Uploads"}
                </button>
            </div>

            {activeTab === 'upload' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fadeIn">
                    <h3 className="font-bold text-lg mb-6 border-b pb-4">Upload Study Material</h3>
                    <form onSubmit={handleUpload} className="max-w-2xl space-y-6">
                        <div>
                            <label className="label-text">Title</label>
                            <input className="input-field w-full" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Introduction to Calculus" required />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="label-text">Subject</label>
                                <select className="input-field w-full" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required>
                                    <option value="">-- Select Subject --</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Class Level</label>
                                <select className="input-field w-full" value={formData.class_level} onChange={e => setFormData({ ...formData, class_level: e.target.value })}>
                                    <option value="All">All Levels</option>
                                    <option value="SSS 1">SSS 1</option>
                                    <option value="SSS 2">SSS 2</option>
                                    <option value="SSS 3">SSS 3</option>
                                    <option value="JAMB">JAMB</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label-text">Google Drive Link (PDF/Doc)</label>
                            <input className="input-field w-full" value={formData.file_url} onChange={e => setFormData({ ...formData, file_url: e.target.value })} placeholder="https://drive.google.com/..." required />
                        </div>
                        <div>
                            <label className="label-text">Description</label>
                            <textarea className="input-field w-full h-32 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief summary of the content..." />
                        </div>
                        <button type="submit" disabled={uploading} className="bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-800 transition">
                            {uploading ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> Submit for Approval</>}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Loading...</div>
                    ) : myNotes.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                            <p>You haven't uploaded any notes yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                                <tr>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Uploaded</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Downloads</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {myNotes.map(note => (
                                    <tr key={note.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 font-bold text-slate-900">{note.title}</td>
                                        <td className="p-4 text-slate-600">{note.subject}</td>
                                        <td className="p-4 text-slate-500">{new Date(note.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            {note.is_active ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Live</span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono">{note.downloads}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default StaffENotesView;
