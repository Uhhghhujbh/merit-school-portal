const supabase = require('../config/supabaseClient');

// 1. PARENT LOGIN
exports.parentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    const cleanId = studentId ? studentId.trim() : "";

    // Find student directly
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .ilike('student_id_text', cleanId)
      .maybeSingle();

    if (error) {
        console.error("DB Error:", error);
        return res.status(500).json({ error: "Database error" });
    }

    if (!student) {
      return res.status(404).json({ error: `Student ID "${cleanId}" not found.` });
    }

    // Check Password (Surname OR Custom Password)
    const surname = student.surname || "";
    const cleanPass = password.trim(); // Case sensitive for custom password? Usually yes.
    const cleanSurname = surname.trim().toLowerCase();

    // 1. Check if matches Surname (Default)
    const isSurnameMatch = cleanSurname === cleanPass.toLowerCase();
    
    // 2. Check if matches Custom Password
    const isHashMatch = student.parent_password_hash && student.parent_password_hash === cleanPass;

    if (!isSurnameMatch && !isHashMatch) {
      return res.status(401).json({ error: `Invalid Password. Try using the surname: ${surname}` });
    }

    // Success
    res.json({
      message: 'Parent Access Granted',
      student: {
        id: student.id,
        full_name: `${student.surname} ${student.first_name}`, 
        student_id: student.student_id_text,
        department: student.department,
        program_type: student.program_type,
        payment_status: student.payment_status // Send payment status to frontend
      }
    });

  } catch (err) {
    console.error('Parent Login Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// 2. CHANGE PASSWORD
exports.updatePassword = async (req, res) => {
  const { studentId, newPassword } = req.body;
  
  if (!studentId || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { error } = await supabase
      .from('students')
      .update({ parent_password_hash: newPassword })
      .eq('id', studentId);

    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Update Password Error:", err);
    res.status(500).json({ error: err.message });
  }
};
