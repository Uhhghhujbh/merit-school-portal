const supabase = require('../config/supabaseClient');

// --- 1. VERIFY ADMIN ---
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    const { data: adminEntry } = await supabase
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)
      .maybeSingle();

    if (!adminEntry) {
      return res.status(403).json({ error: 'Access Denied: Not an Administrator.' });
    }

    req.user = user;
    req.role = 'admin'; 
    next();

  } catch (err) {
    console.error("Admin Auth Error:", err);
    res.status(500).json({ error: 'Server Authentication Error' });
  }
};

// --- 2. VERIFY STAFF ---
const verifyStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const email = user.email.trim().toLowerCase();

    // Check Admin (Admins can act as Staff)
    const { data: adminEntry } = await supabase.from('admin_allowlist').select('email').ilike('email', email).maybeSingle();

    // Check Staff Profile
    const { data: staffProfile } = await supabase.from('staff').select('*').eq('id', user.id).maybeSingle();

    if (adminEntry) {
      req.user = user;
      req.role = 'admin';
      if (staffProfile) req.staff = staffProfile; 
      return next(); 
    }

    if (staffProfile) {
      req.user = user;
      req.role = 'staff';
      req.staff = staffProfile;
      return next();
    }

    return res.status(403).json({ error: 'Access Denied: You are not Staff.' });

  } catch (err) {
    console.error('Staff Auth Error:', err);
    return res.status(500).json({ error: 'Server Authentication Error' });
  }
};

// --- 3. VERIFY STUDENT (MISSING PIECE) ---
const verifyStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // Attach user to request so Controller can read 'req.user.id'
    req.user = user;
    req.role = 'student';
    next();

  } catch (err) {
    console.error("Student Auth Error:", err);
    res.status(500).json({ error: 'Server Authentication Error' });
  }
};

module.exports = { verifyAdmin, verifyStaff, verifyStudent };
