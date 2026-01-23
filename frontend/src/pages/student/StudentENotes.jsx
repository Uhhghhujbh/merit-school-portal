import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, BookOpen, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const StudentENotes = () => {
    const { token } = useAuthStore();
    const [notes, setNotes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchNotes();
        fetchSubjects();
    }, [selectedSubject]);

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

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="text-blue-700" size={28} />
                    E-Notes
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                    Download study notes and materials for your subjects
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Subject Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-200 rounded focus:border-blue-500 outline-none appearance-none bg-white min-w-[180px]"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(sub => (
                                <option key={sub.name} value={sub.name}>
                                    {sub.name} ({sub.count})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Notes List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="bg-white p-12 rounded border border-gray-200 text-center">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Notes Found</h3>
                    <p className="text-gray-500 text-sm">
                        {selectedSubject ? `No notes available for ${selectedSubject}` : 'Check back later for study materials'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotes.map(note => (
                        <div
                            key={note.id}
                            className="bg-white p-4 rounded border border-gray-200 hover:border-blue-300 transition flex items-start gap-4"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 bg-blue-50 rounded flex items-center justify-center shrink-0">
                                <FileText className="text-blue-700" size={24} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                                        {note.subject}
                                    </span>
                                    {note.class_level && note.class_level !== 'All' && (
                                        <span className="text-xs">{note.class_level}</span>
                                    )}
                                    <span className="text-xs">{formatFileSize(note.file_size)}</span>
                                    <span className="text-xs">{note.downloads || 0} downloads</span>
                                </div>
                                {note.description && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.description}</p>
                                )}
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={() => handleDownload(note)}
                                className="px-4 py-2 bg-blue-700 text-white rounded font-medium text-sm hover:bg-blue-800 flex items-center gap-2 shrink-0"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            {!loading && filteredNotes.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                    Showing {filteredNotes.length} of {notes.length} notes
                </div>
            )}
        </div>
    );
};

export default StudentENotes;
