const supabase = require('../config/supabaseClient');

exports.parentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    // Force trim and cleanup
    const cleanId = studentId ? studentId.trim() : "";

    console.log(`Checking Parent Login for ID: "${cleanId}"`);

    // 1. Find student using 'ilike' (Case Insensitive) and 'maybeSingle'
    const { data: student, error } = await supabase
      .from('students')
      .select('*, profiles:id(full_name)')
      .ilike('student_id_text', cleanId) 
      .maybeSingle();

    if (error) {
       console.error("DB Error:", error);
       return res.status(500).json({ error: "Database error" });
    }

    if (!student) {
      return res.status(404).json({ error: `Student ID "${cleanId}" not found. Please check the admission letter.` });
    }

    // 2. Check Password (Surname or Hash)
    const surname = student.surname || "";
    const cleanPass = password.trim().toLowerCase();
    const cleanSurname = surname.trim().toLowerCase();

    const isSurnameMatch = cleanSurname === cleanPass;
    const isHashMatch = student.parent_password_hash && student.parent_password_hash === password;

    if (!isSurnameMatch && !isHashMatch) {
      return res.status(401).json({ error: `Invalid Password. Try using the surname: ${surname}` });
    }

    // 3. Success
    res.json({
      message: 'Parent Access Granted',
      student: {
        id: student.id,
        full_name: student.profiles?.full_name || student.surname,
        student_id: student.student_id_text,
        department: student.department,
        program_type: student.program_type
      }
    });

  } catch (err) {
    console.error('Parent Login Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};
