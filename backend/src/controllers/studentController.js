const supabase = require('../config/supabaseClient');

// ... (Keep existing getStudentProfile and getAnnouncements functions) ...

// 1. GET STUDENT PROFILE
exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!student) return res.status(404).json({ error: 'Profile not found.' });

    res.json(student);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 2. GET ANNOUNCEMENTS
exports.getAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .or('target_audience.eq.all,target_audience.eq.student')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3. *** SECURE PAYMENT VERIFICATION (UPDATED) ***
exports.verifyPayment = async (req, res) => {
  const { transaction_id, student_id } = req.body;

  if (!transaction_id || !student_id) {
    return res.status(400).json({ error: "Missing transaction details" });
  }
  
  try {
    // --- STEP A: REPLAY ATTACK CHECK ---
    // Check if this transaction ID already exists in our payments table
    const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('reference', transaction_id.toString()) // Flutterwave ID or Tx Ref
        .eq('status', 'successful')
        .maybeSingle();

    if (existingPayment) {
        console.warn(`REPLAY ATTACK BLOCKED: Transaction ${transaction_id} already used.`);
        return res.status(409).json({ error: "This transaction has already been used." });
    }

    // --- STEP B: Verify with Flutterwave ---
    const flwUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
    const response = await fetch(flwUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
    });
    
    const flwData = await response.json();

    if (flwData.status !== 'success' || flwData.data.status !== 'successful') {
        return res.status(400).json({ error: 'Payment failed or declined by bank.' });
    }

    const { amount, currency, tx_ref } = flwData.data;

    // --- STEP C: Validate Student & Fee ---
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', student_id)
        .maybeSingle();
        
    if (!student) return res.status(404).json({ error: "Student record not found." });

    const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*');
        
    if (settingsError) throw settingsError;

    let expectedFee = 0;
    if (student.program_type === 'JAMB') expectedFee = Number(settings.find(s => s.key === 'fee_jamb')?.value || 0);
    else if (student.program_type === 'A-Level') expectedFee = Number(settings.find(s => s.key === 'fee_alevel')?.value || 0);
    else expectedFee = Number(settings.find(s => s.key === 'fee_olevel')?.value || 0);

    // --- STEP D: SECURITY INTEGRITY CHECKS ---
    if (currency !== 'NGN') {
        return res.status(400).json({ error: "Invalid currency. Payment must be in NGN." });
    }

    if (amount < expectedFee) {
        console.warn(`FRAUD ATTEMPT: Student ${student_id} paid ${amount} but expected ${expectedFee}`);
        return res.status(400).json({ error: `Insufficient Payment. You paid ₦${amount} but the fee is ₦${expectedFee}.` });
    }

    // Verify Ownership (tx_ref contains student ID)
    if (!tx_ref.includes(student_id)) {
        console.warn(`FRAUD ATTEMPT: Student ${student_id} used receipt ${tx_ref} belonging to someone else.`);
        return res.status(400).json({ error: "Invalid Receipt. This payment does not belong to your account." });
    }

    // --- STEP E: Update Database ---
    const { error: updateError } = await supabase
        .from('students')
        .update({ payment_status: 'paid' })
        .eq('id', student_id);

    if (updateError) throw updateError;

    // Log the successful payment to prevent reuse
    await supabase.from('payments').insert([{
        student_id: student_id,
        amount: amount,
        reference: transaction_id.toString(), // Store the Transaction ID to block replay
        status: 'successful',
        channel: 'flutterwave'
    }]);

    res.json({ message: 'Payment Verified Successfully' });

  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ... (Keep existing submitManualPayment and getSchoolFees) ...
// 4. SUBMIT MANUAL PAYMENT
exports.submitManualPayment = async (req, res) => {
    const { student_id, reference, amount } = req.body;
    
    try {
        if (!student_id || !reference) return res.status(400).json({ error: "Missing details" });

        // Log into payments table as 'pending'
        const { error } = await supabase.from('payments').insert([{
            student_id,
            amount: amount || 0,
            reference: reference, // This will be the user's manual input
            status: 'pending_manual',
            channel: 'manual_transfer'
        }]);

        if (error) throw error;

        await supabase.from('activity_logs').insert([{
            student_id,
            student_name: 'Student User',
            student_id_text: 'MANUAL PAY',
            action: 'payment_manual_submitted',
            ip_address: req.ip || '0.0.0.0',
            device_info: `Ref: ${reference}`
        }]);

        res.json({ message: "Manual payment submitted for review." });
    } catch (err) {
        console.error("Manual Payment Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 5. GET SCHOOL FEES
exports.getSchoolFees = async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) throw error;

    const fees = {};
    data.forEach(item => fees[item.key] = Number(item.value));
    res.json(fees);
  } catch (err) {
    console.error("Get Fees Error:", err);
    res.status(500).json({ error: err.message });
  }
};
