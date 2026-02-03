import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, BookOpen, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const StudentENotes = () => {
    const { token } = useAuthStore();
    const [notes, setNotes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPaid, setIsPaid] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const checkPayment = async () => {
            if (user?.payment_status === 'paid' || user?.payment_status === 'partial') {
                setIsPaid(true);
            }
        };
        checkPayment();
        fetchNotes();
        fetchSubjects();
    }, [selectedSubject, user]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const params = selectedSubject ? `?subject=${selectedSubject}` : '';
            const data = await api.get(`/enotes${params}`, token);
            setNotes(data || []);
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const data = await api.get('/enotes/subjects', token);
            setSubjects(data || []);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        }
    };

    const handleDownload = async (note) => {
        try {
            // Track download
            await api.post(`/enotes/${note.id}/download`, {}, token);
            // Open file in new tab
            window.open(note.file_url, '_blank');
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const filteredNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!isPaid) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-6 animate-bounce">
                    <Lock size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Feature Locked</h2>
                <p className="text-slate-600 max-w-sm mb-8">
                    Access to E-Notes is restricted to students who have completed their registration payments.
                </p>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Required Payment</p>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-slate-700 font-medium">Registration Fee</span>
                        <span className="text-2xl font-black text-slate-900">₦15,000+</span>
                    </div>
                    <button
                        onClick={() => window.location.href = '/student/payments'}
                        className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all"
                    >
                        Go to Payments
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-blue-700" size={32} />
                        E-Notes
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Download high-quality study materials
                    </p>
                </div>
                <div className="bg-blue-100 px-4 py-2 rounded-full text-blue-700 text-sm font-bold">
                    {filteredNotes.length} Materials Available
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row gap-2">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by topic or subject..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                    </div>

                    {/* Subject Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="pl-12 pr-10 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold text-slate-700 min-w-[200px]"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(sub => (
                                <option key={sub.name} value={sub.name}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
            </div>

            {/* Notes List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                    <p className="text-slate-500 font-bold">Loading Materials...</p>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">No Results Found</h3>
                    <p className="text-slate-500 font-medium max-w-xs mx-auto">
                        We couldn't find any materials matching "{searchQuery}". Try a different search term.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map(note => (
                        <div
                            key={note.id}
                            className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="text-blue-700" size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">
                                        {note.subject}
                                    </span>
                                    <h3 className="font-bold text-slate-900 mt-1 truncate">{note.title}</h3>
                                </div>
                            </div>

                            {note.description && (
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1 leading-relaxed">
                                    {note.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-bold">Size: {formatFileSize(note.file_size)}</span>
                                    <span className="text-xs text-slate-400 font-bold">Downloads: {note.downloads || 0}</span>
                                </div>
                                <button
                                    onClick={() => handleDownload(note)}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    title="Download Material"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentENotes;
