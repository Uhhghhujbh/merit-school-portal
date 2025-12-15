const supabase = require('../config/supabaseClient');

// Helper to normalize department names
const normalizeDepartment = (dept) => {
  if (!dept) return null;
  const input = dept.toLowerCase().trim();
  if (input.includes('sci') || input === 'science') return 'Science';
  if (input.includes('com') || input.includes('bus') || input === 'commercial') return 'Commercial';
  if (input.includes('art') || input.includes('alt') || input === 'humanities') return 'Art';
  return dept.charAt(0).toUpperCase() + dept.slice(1);
};

exports.registerStaff = async (req, res) => {
  const { 
    email, password, fullName, department, position, 
    adminToken, phone, address, qualification, gender 
  } = req.body;

  try {
    // 1. Validate Token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_codes') 
      .select('*')
      .eq('code', adminToken) 
      .single();

    if (tokenError || !tokenData) {
      return res.status(403).json({ error: 'Invalid Staff Token.' });
    }

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 3. FORCE ROLE FIX: Update Profile
    await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        role: 'staff',
        full_name: fullName
    });

    // Remove any accidental student record
    await supabase.from('students').delete().eq('id', userId);

    // 4. Create Staff Record
    const normalizedDept = normalizeDepartment(department);
    const staffIdText = `STF/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    
    const { error: staffError } = await supabase
      .from('staff')
      .insert([{
        id: userId,
        staff_id_text: staffIdText,
        full_name: fullName,
        email,
        department: normalizedDept,
        position,
        phone_number: phone,
        address,
        qualification,
        gender,
        is_suspended: false
      }]);

    if (staffError) {
      await supabase.auth.admin.deleteUser(userId);
      throw staffError;
    }

    // 5. Invalidate Token
    await supabase.from('verification_codes').delete().eq('code', adminToken);

    res.status(201).json({ message: 'Staff Account Created Successfully', staffId: staffIdText });

  } catch (error) {
    console.error('Staff Reg Error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.staffLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid Credentials' });

    // Verify they are actually staff
    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (!staffData) return res.status(403).json({ error: 'Access Denied: Not a Staff Account.' });

    res.json({ 
      user: { ...staffData, role: 'staff' }, 
      token: data.session.access_token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// FIXED: Filter students by Staff's Department
exports.getMyStudents = async (req, res) => {
    try {
        // req.staff is populated by the verifyStaff middleware
        const staffDept = req.staff?.department;

        let query = supabase.from('students').select('*').order('surname');

        // If staff belongs to a specific department (Science/Art/Commercial), filter by it.
        // If staff department is 'General' or null, they might see all (optional).
        if (staffDept && staffDept !== 'General') {
            query = query.eq('department', staffDept);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
