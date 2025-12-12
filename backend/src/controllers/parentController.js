const supabase = require('../config/supabaseClient');

exports.parentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    // Force trim to remove accidental spaces from copy-paste
    const cleanId = studentId ? studentId.trim() : "";

    console.log(`Parent trying to login with ID: "${cleanId}"`);

    // 1. Find student using 'ilike' (Case Insensitive) and 'maybeSingle' to avoid crashes
    const { data: student, error } = await supabase
      .from('students')
      .select('*, profiles:id(full_name)')
      .ilike('student_id_text', cleanId)
      .maybeSingle();

    if (error) {
        console.error("DB Error:", error);
        return res.status(500).json({ error: "Database error during lookup" });
    }

    if (!student) {
      console.log(`Login Failed: ID "${cleanId}" not found in DB.`);
      return res.status(404).json({ error: `Student ID "${cleanId}" not found. Check exact spelling.` });
    }

    // 2. Check Password (Surname or Hash)
    const surname = student.surname || "";
    const cleanPass = password.trim().toLowerCase();
    const cleanSurname = surname.trim().toLowerCase();

    // Allow login if password matches Surname OR if it matches a set parent password
    const isSurnameMatch = cleanSurname === cleanPass;
    const isHashMatch = student.parent_password_hash && student.parent_password_hash === password;

    if (!isSurnameMatch && !isHashMatch) {
      return res.status(401).json({ error: `Invalid Password. Try using the student's surname: ${surname}` });
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
    console.error('Parent Login Critical Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
};
