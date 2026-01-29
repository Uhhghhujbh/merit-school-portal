const supabase = require('../config/supabaseClient');

// ==================== HELPER FUNCTIONS ====================

const hasPermission = (requestingUserId, targetStudentId, userRole) => {
  return requestingUserId === targetStudentId || userRole === 'admin';
};

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection.remoteAddress || '0.0.0.0';
};

const logActivity = async (studentId, action, details = {}) => {
  try {
    await supabase.from('activity_logs').insert([{
      student_id: studentId,
      student_name: details.name || 'Student',
      student_id_text: details.student_id_text || 'UNKNOWN',
      action: action,
      ip_address: getClientIP(details.req),
      device_info: details.device_info || 'Web Client'
    }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const getSystemSettings = async () => {
  const { data } = await supabase.from('system_settings').select('*');
  const settings = {};
  data?.forEach(item => { settings[item.key] = item.value; });
  return settings;
};

// ==================== STUDENT PROFILE ====================

exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!hasPermission(req.user.id, id, req.user.role)) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    // 1. Fetch Basic Info
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !student) throw new Error('Student not found');

    // 2. Fetch Multi-Programs (NEW FEATURE)
    const { data: programs } = await supabase
      .from('student_programs')
      .select('*')
      .eq('student_id', id);

    // 3. Fetch Active CBT Subscription (NEW FEATURE)
    const { data: cbtSub } = await supabase
      .from('cbt_subscriptions') // Uses the view or table
      .select('*')
      .eq('student_id', id)
      .gt('expiry_date', new Date().toISOString()) // Check if not expired
      .maybeSingle();

    res.json({
      success: true,
      student: {
        ...student,
        programs: programs || [], // Returns array of programs (JAMB, O-Level)
        cbt_subscription: cbtSub ? { active: true, expiry: cbtSub.expiry_date } : { active: false }
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!hasPermission(req.user.id, id, req.user.role)) {
      return res.status(403).json({ error: 'Access Denied' });
    }

    // Only allow updating contact info, not academic/payment data
    const allowed = ['phone_number', 'address', 'parents_phone', 'state_of_origin', 'lga'];
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowed.includes(key)) filteredUpdates[key] = updates[key];
    });

    const { data, error } = await supabase
      .from('students')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, student: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== ANNOUNCEMENTS ====================

exports.getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, announcements: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== PAYMENTS (Updated for Multi-Program) ====================

exports.getSchoolFees = async (req, res) => {
  try {
    const { data } = await supabase.from('system_settings').select('*');
    const settings = {};
    data?.forEach(item => { settings[item.key] = Number(item.value); });

    // Return only fees
    res.json({
      fee_jamb: settings.fee_jamb || 0,
      fee_alevel: settings.fee_alevel || 0,
      fee_olevel: settings.fee_olevel || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 1. Verify Online Payment (Flutterwave)
exports.verifyPayment = async (req, res) => {
  const { transaction_id, student_id, purpose, program_type } = req.body;
  // 'purpose' can be 'program_fee' or 'cbt_access'

  try {
    // Security: Verify the request is for the logged-in user's own payment
    if (req.user.id !== student_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized payment verification attempt' });
    }

    // A. Verify with Flutterwave API
    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
    if (!FLW_SECRET_KEY) {
      throw new Error('Payment verification service unavailable');
    }

    const flwResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const flwData = await flwResponse.json();

    if (flwData.status !== 'success' || flwData.data?.status !== 'successful') {
      // Log failed attempt
      await logActivity(student_id, 'PAYMENT_VERIFICATION_FAILED', {
        req,
        transaction_id,
        reason: flwData.message || 'Payment not successful'
      });
      return res.status(400).json({
        error: 'Payment verification failed',
        details: flwData.message
      });
    }

    const amountPaid = flwData.data.amount;
    const currency = flwData.data.currency;

    // B. Validate payment amount against expected amount
    const { data: settings } = await supabase.from('system_settings').select('*');
    const settingsMap = {};
    settings?.forEach(s => { settingsMap[s.key] = Number(s.value); });

    let expectedAmount = 0;
    if (purpose === 'program_fee') {
      if (program_type === 'JAMB') expectedAmount = settingsMap.fee_jamb || 0;
      else if (program_type === 'A-Level') expectedAmount = settingsMap.fee_alevel || 0;
      else expectedAmount = settingsMap.fee_olevel || 0;
    } else if (purpose === 'cbt_access') {
      expectedAmount = settingsMap.cbt_price || 1500;
    }

    // Allow 5% tolerance for currency conversion differences
    if (amountPaid < expectedAmount * 0.95) {
      await logActivity(student_id, 'PAYMENT_AMOUNT_MISMATCH', {
        req,
        expected: expectedAmount,
        received: amountPaid
      });
      return res.status(400).json({
        error: 'Payment amount mismatch',
        expected: expectedAmount,
        received: amountPaid
      });
    }

    // C. Handle different payment types
    if (purpose === 'program_fee') {
      // Update specific program status
      await supabase
        .from('student_programs')
        .update({ payment_status: 'paid' })
        .eq('student_id', student_id)
        .eq('program_type', program_type);

      // Also update main students table
      await supabase
        .from('students')
        .update({ payment_status: 'paid' })
        .eq('id', student_id);

    } else if (purpose === 'cbt_access') {
      // Create Subscription with 3 months validity
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      await supabase.from('cbt_subscriptions').insert([{
        student_id,
        amount_paid: amountPaid,
        plan_type: 'quarterly',
        expiry_date: expiryDate.toISOString()
      }]);

      // Update student record
      await supabase
        .from('students')
        .update({
          cbt_subscription_active: true,
          cbt_subscription_expires: expiryDate.toISOString()
        })
        .eq('id', student_id);
    }

    // D. Log to Main Payments Table with full audit trail
    await supabase.from('payments').insert([{
      student_id,
      amount: amountPaid,
      reference: transaction_id,
      tx_ref: flwData.data.tx_ref,
      flw_ref: flwData.data.flw_ref,
      status: 'successful',
      channel: 'flutterwave',
      currency: currency,
      purpose: purpose,
      verified_at: new Date().toISOString()
    }]);

    // E. Create audit log
    await logActivity(student_id, 'PAYMENT_VERIFIED', {
      req,
      amount: amountPaid,
      purpose,
      transaction_id
    });

    res.json({
      success: true,
      message: "Payment Verified Successfully",
      amount: amountPaid,
      purpose
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
};


// 2. Submit Manual Payment (Using the NEW transaction_logs table)
exports.submitManualPayment = async (req, res) => {
  const { student_id, reference, amount, payment_purpose, proof_url } = req.body;

  try {
    if (!hasPermission(req.user.id, student_id, req.user.role)) {
      return res.status(403).json({ error: "Access Denied" });
    }

    const { data, error } = await supabase
      .from('transaction_logs') // <--- USING CORRECT TABLE
      .insert([{
        student_id,
        reference_number: reference,
        amount,
        payment_purpose, // 'School Fee - JAMB', 'CBT Access'
        proof_url,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Manual payment submitted. Waiting for Admin approval.",
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== PASSWORD RESET (New Request) ====================

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  // Only allow this if it's the logged-in user OR if they have a specialized token (Forgot Password flow)
  // For simple Dashboard reset:
  if (req.user.email !== email && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      req.user.id,
      { password: newPassword }
    );

    if (error) throw error;
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  const { student_id } = req.params;
  try {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });
    res.json({ success: true, payments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
