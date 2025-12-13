const supabase = require('../config/supabaseClient');

// HELPER: Upload Base64 to Supabase Storage
async function uploadPhoto(base64Data, userId) {
  if (!base64Data) return null;
  try {
    // Remove header "data:image/jpeg;base64,"
    const base64File = base64Data.split(';base64,').pop();
    const buffer = Buffer.from(base64File, 'base64');
    const path = `students/${userId}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('photos') // Make sure you created this bucket in Supabase!
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    // Get Public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(path);
      
    return urlData.publicUrl;
  } catch (err) {
    console.error("Photo Upload Error:", err.message);
    return null; // Continue registration even if photo fails
  }
}

// --- ADMIN LOGIN (NEW FIX) ---
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ error: 'Invalid Email or Password' });

    // 2. CHECK ALLOWLIST (The Critical Fix)
    const { data: adminEntry, error: allowError } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (!adminEntry) {
      // If not in allowlist, sign them out immediately
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Access Denied: You are not an Administrator.' });
    }

    // 3. Success - Return Admin Role
    res.json({
      message: 'Admin Login Successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin' // Explicitly send this so frontend knows
      }
    });

  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// --- STUDENT LOGIN ---
exports.studentLogin = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    let email = identifier;

    // 1. Resolve Student ID to Email (Case Insensitive)
    if (!identifier.includes('@')) {
      const { data } = await supabase
        .from('students')
        .select('email')
        .ilike('student_id_text', identifier.trim()) // Use ilike for case-insensitivity
        .maybeSingle();
        
      if (!data) return res.status(404).json({ error: 'Student ID not found' });
      email = data.email;
    }

    // 2. Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: 'Invalid Password' });

    // 3. Get Profile
    const { data: profile, error: dbError } = await supabase
      .from('students')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (dbError) throw dbError;
    if (!profile) return res.status(500).json({ error: 'Profile row missing. Contact Admin.' });

    // Fetch Full Name from Profiles table
    const { data: profileName } = await supabase.from('profiles').select('full_name').eq('id', authData.user.id).single();
    if(profileName) profile.full_name = profileName.full_name;

    res.json({
      message: 'Login successful',
      token: authData.session.access_token,
      user: profile
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- REGISTER STUDENT ---
exports.registerStudent = async (req, res) => {
  const clean = (val) => (val && val.trim() !== "" ? val : null);

  const { 
    email, password, surname, middleName, lastName, 
    programme, department, subjects, photoPreview,
    dateOfBirth, gender, stateOfOrigin, lga, permanentAddress,
    parentsPhone, studentPhone, university, course
  } = req.body;

  try {
    // 1. Create Auth User
    const fullName = `${surname} ${middleName} ${lastName}`.trim();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || 'password123',
      email_confirm: true,
      user_metadata: { full_name: fullName } 
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 2. Generate Alphanumeric Student ID
    const year = new Date().getFullYear().toString().slice(-2);
    // Generate 4 random alphanumeric chars (e.g., A9X2)
    const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const deptMap = { 'Science': 'SCI', 'Art': 'ART', 'Commercial': 'BUS' };
    const deptCode = deptMap[department] || 'GEN';
    
    const studentIdText = `MCAS/${deptCode}/${year}/${randAlpha}`; 

    // 3. Upload Photo (Fixes Database Crash)
    const photoUrl = await uploadPhoto(photoPreview, userId);

    // 4. Create Profile & Student Entries
    // (Note: We use upsert to be safe, but Auth trigger is gone so insert is also fine)
    await supabase.from('profiles').upsert({
        id: userId,
        email,
        role: 'student',
        full_name: fullName
    });

    const { error: updateError } = await supabase
      .from('students')
      .upsert({
        id: userId,
        email,
        student_id_text: studentIdText,
        department: clean(department),
        surname: clean(surname),
        first_name: clean(middleName),
        last_name: clean(lastName),
        gender: clean(gender),
        dob: clean(dateOfBirth),
        state_of_origin: clean(stateOfOrigin),
        lga: clean(lga),
        address: clean(permanentAddress),
        parents_phone: clean(parentsPhone),
        phone_number: clean(studentPhone),
        program_type: programme,
        subjects: subjects,
        university_choice: clean(university),
        course_choice: clean(course),
        photo_url: photoUrl, // Saving URL, not Base64!
        is_validated: false,
        payment_status: 'unpaid'
      });

    if (updateError) throw updateError;

    // 5. Log Activity (Last step, safe from crashing flow)
    try {
      await supabase.from('activity_logs').insert([{
        student_id: userId,
        student_name: fullName,
        student_id_text: studentIdText,
        action: 'registered',
        ip_address: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        device_info: req.headers['user-agent'] || 'unknown'
      }]);
    } catch (logError) {
      console.warn('Log failed (non-critical):', logError.message);
    }

    res.status(201).json({ message: 'Success', studentId: studentIdText });

  } catch (error) {
    console.error("Registration Error:", error);
    // Clean up if auth user was created but DB failed
    if (error.message.includes("Database") && userId) {
       // Optional: await supabase.auth.admin.deleteUser(userId);
    }
    res.status(400).json({ error: error.message });
  }
};
