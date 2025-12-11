const supabase = require('../config/supabaseClient');

// Log student activity
exports.logActivity = async (req, res) => {
  const { student_id, student_name, student_id_text, action, ip_address, device_info } = req.body;

  try {
    const { error } = await supabase.from('activity_logs').insert([{
      student_id,
      student_name,
      student_id_text,
      action,
      ip_address,
      device_info
    }]);

    if (error) throw error;
    res.json({ message: 'Activity logged successfully' });
  } catch (err) {
    console.error('Activity Log Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all activity logs (Admin only)
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
    console.error('Get Logs Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get logs for specific student
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
    console.error('Get Student Logs Error:', err);
    res.status(500).json({ error: err.message });
  }
};
