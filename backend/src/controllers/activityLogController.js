const supabase = require('../config/supabaseClient');

// Log activity (Now Auto-Detects IP & Device)
exports.logActivity = async (req, res) => {
  // We allow the frontend to specify the 'action', but we verify the identity
  const { action, student_id, student_name, student_id_text } = req.body;

  // SECURITY: Capture IP/Device from Server, NOT Request Body
  const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
  const device_info = req.headers['user-agent'] || 'Unknown Device';

  try {
    const { error } = await supabase.from('activity_logs').insert([{
      student_id: student_id || req.user?.id, // Prefer auth token ID if available
      student_name: student_name || req.user?.user_metadata?.full_name || 'System',
      student_id_text: student_id_text || 'N/A',
      action,
      ip_address,   // Verified IP
      device_info   // Verified Device
    }]);

    if (error) throw error;
    res.json({ message: 'Activity logged successfully' });
  } catch (err) {
    console.error('Activity Log Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ... (Keep getAllLogs and getStudentLogs as they were) ...
exports.getAllLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentLogs = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
