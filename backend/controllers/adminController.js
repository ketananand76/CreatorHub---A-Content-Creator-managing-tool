import { User, Transaction, SessionLog, Ticket, IncomeExpense, SystemSettings, BrandDeal, TeamTask, CalendarEvent, Notification } from '../models/db.js';

// --- USER-FACING ENDPOINTS ---

export const submitTransaction = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { amount, utr, screenshotUrl } = req.body;

    if (!amount || !utr) {
      return res.status(400).json({ success: false, message: 'Amount and Transaction UTR are required' });
    }

    // Check if UTR is already submitted
    const existing = await Transaction.findOne({ utr });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This Transaction UTR reference has already been submitted.' });
    }

    const transaction = await Transaction.create({
      userId,
      userEmail: req.user.email,
      amount: Number(amount),
      upiId: '9771735011@mbk',
      utr,
      screenshotUrl: screenshotUrl || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payment verification request submitted successfully. The Super Admin will review and activate your subscription.',
      transaction
    });
  } catch (error) {
    console.error('Submit Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const transactions = await Transaction.find({ userId });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Get My Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const submitTicket = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const ticket = await Ticket.create({
      userId,
      userEmail: req.user.email,
      subject,
      message,
      status: 'open'
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    console.error('Submit Ticket Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const tickets = await Ticket.find({ userId });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('Get My Tickets Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// --- SUPER ADMIN / ADMIN ENDPOINTS ---

export const getAdminStats = async (req, res) => {
  try {
    const users = await User.find({});
    const transactions = await Transaction.find({});
    const tickets = await Ticket.find({});

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const premiumUsers = users.filter(u => u.isPremium).length;

    // Calculate revenue based on APPROVED UPI payments
    const approvedTransactions = transactions.filter(t => t.status === 'approved');
    const totalEarning = approvedTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    // Support ticket stats
    const openTickets = tickets.filter(t => t.status === 'open').length;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        premiumUsers,
        totalRevenue: totalEarning,
        openTickets,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Get Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUsersList = async (req, res) => {
  try {
    const users = await User.find({});
    // Remove passwords before returning
    const cleanUsers = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isPremium: u.isPremium,
      premiumExpires: u.premiumExpires,
      isTwoFAEnabled: u.isTwoFAEnabled,
      createdAt: u.createdAt
    }));
    res.status(200).json({ success: true, users: cleanUsers });
  } catch (error) {
    console.error('Get Users List Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // active, suspended, banned

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { status }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: `User status updated to ${status}`, user: updatedUser });
  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const toggleUserPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const nextPremium = !user.isPremium;
    let premiumExpires = null;
    if (nextPremium) {
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      premiumExpires = oneYear.toISOString();
    }

    await User.findByIdAndUpdate(userId, { isPremium: nextPremium, premiumExpires });

    // Send notification to user about their tier status change
    await Notification.create({
      userId,
      title: nextPremium ? 'Premium Activated 🌟' : 'Premium Deactivated ⚠️',
      message: nextPremium 
        ? `An administrator has manually activated your Premium subscription. Valid until ${new Date(premiumExpires).toLocaleDateString()}. Enjoy AI tools!`
        : 'An administrator has manually deactivated your Premium subscription status.',
      type: 'subscription'
    });

    res.status(200).json({
      success: true,
      message: `Premium status for ${user.name} has been ${nextPremium ? 'activated' : 'deactivated'}.`
    });
  } catch (error) {
    console.error('Toggle Premium Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['Creator', 'Team Member', 'Admin', 'Super Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndUpdate(userId, { role });

    // Send notification
    await Notification.create({
      userId,
      title: 'Account Role Updated 👥',
      message: `Your account role has been updated to ${role} by an administrator. Please log out and log back in to apply privileges.`,
      type: 'system'
    });

    res.status(200).json({ success: true, message: `User role updated to ${role} successfully.` });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await User.deleteOne({ _id: userId });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPaymentLogs = async (req, res) => {
  try {
    const transactions = await Transaction.find({});
    // Sort transactions by pending first, then by date descending
    const sorted = transactions.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.status(200).json({ success: true, logs: sorted });
  } catch (error) {
    console.error('Get Payment Logs Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const approveTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction is already processed' });
    }

    // Approve transaction
    await Transaction.findByIdAndUpdate(transactionId, { status: 'approved' });

    // Activate premium for the paying user
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    await User.findByIdAndUpdate(tx.userId, {
      isPremium: true,
      premiumExpires: oneYear.toISOString()
    });

    // Send notification to the paying user
    await Notification.create({
      userId: tx.userId,
      title: 'Subscription Approved 🎉',
      message: 'Congratulations! Your UPI payment has been verified. Premium features are now unlocked.',
      type: 'subscription'
    });

    // Automatically log this as income in the earnings tracker for admin stats, or for the platform!
    // Since payment goes to CreatorHub platform, Super Admin records total earnings.
    res.status(200).json({
      success: true,
      message: 'Transaction approved. Premium subscription activated for the user.'
    });
  } catch (error) {
    console.error('Approve Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const rejectTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaction already processed' });
    }

    await Transaction.findByIdAndUpdate(transactionId, { status: 'rejected' });

    // Send notification to user about payment rejection
    await Notification.create({
      userId: tx.userId,
      title: 'Subscription Rejected ❌',
      message: 'Your payment verification request was rejected. Please check the transaction details/UTR and submit again.',
      type: 'subscription'
    });

    res.status(200).json({
      success: true,
      message: 'Transaction rejected successfully.'
    });
  } catch (error) {
    console.error('Reject Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const logs = await SessionLog.find({});
    // Return sorted descending
    const sortedLogs = logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ success: true, logs: sortedLogs });
  } catch (error) {
    console.error('Get Session History Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('Get Tickets Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const replyTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    await Ticket.findByIdAndUpdate(ticketId, {
      reply,
      status: 'resolved'
    });

    res.status(200).json({ success: true, message: 'Ticket resolved and reply sent.' });
  } catch (error) {
    console.error('Reply Ticket Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAdsenseSettings = async (req, res) => {
  try {
    const setting = await SystemSettings.findOne({ key: 'adsense_code' });
    const fallbackAdCode = `
      <div style="width:100%;max-width:340px;margin:10px auto;padding:2px;border-radius:18px;background:linear-gradient(45deg,#ff007f,#7928ca,#4338ca,#06b6d4);background-size:300% 300%;animation:gradient-flow 4s ease infinite;box-shadow:0 12px 30px rgba(121,40,202,0.3);position:relative;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;">
        <style>
          @keyframes gradient-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
          @keyframes pulse-glow{0%,100%{opacity:0.6}50%{opacity:1}}
          @keyframes float-up{0%{transform:translateY(0px)}50%{transform:translateY(-4px)}100%{transform:translateY(0px)}}
          .ai-ad-btn:hover{transform:scale(1.05);background:#fff!important;color:#7928ca!important;}
        </style>
        <div style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,0.15) 0%,transparent 60%);animation:pulse-glow 3s infinite;"></div>
        <div style="background:#0f172a;border-radius:16px;padding:20px;text-align:center;position:relative;z-index:1;height:100%;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:float-up 3s ease-in-out infinite"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span style="font-size:10px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#06b6d4;">AI Sponsored</span>
          </div>
          <h3 style="font-size:18px;font-weight:800;color:#fff;margin:0 0 8px 0;line-height:1.2;background:linear-gradient(to right,#fff,#cbd5e1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Unlock True AI Potential</h3>
          <p style="font-size:13px;color:#94a3b8;margin:0 0 18px 0;line-height:1.4;">Supercharge your workflow with next-gen AI automation. Join 100K+ creators today.</p>
          <a href="#" class="ai-ad-btn" style="display:inline-block;padding:10px 24px;border-radius:24px;background:linear-gradient(90deg,#7928ca,#ff007f);color:#fff;font-size:13px;font-weight:800;text-decoration:none;letter-spacing:0.05em;transition:all 0.3s ease;box-shadow:0 4px 15px rgba(255,0,127,0.3);">START FREE TRIAL</a>
        </div>
      </div>
    `;
    const adCode = (setting && setting.value && setting.value.trim()) ? setting.value : fallbackAdCode;
    res.status(200).json({ success: true, adCode });
  } catch (error) {
    console.error('Get Adsense Settings Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateAdsenseSettings = async (req, res) => {
  try {
    const { adCode } = req.body;
    let setting = await SystemSettings.findOne({ key: 'adsense_code' });
    if (setting) {
      const targetId = setting._id || setting.id;
      setting = await SystemSettings.findByIdAndUpdate(targetId, { value: adCode }, { new: true });
    } else {
      setting = await SystemSettings.create({ key: 'adsense_code', value: adCode });
    }
    res.status(200).json({ success: true, message: 'Google AdSense settings updated successfully.', adCode: setting.value });
  } catch (error) {
    console.error('Update Adsense Settings Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCreatorPerformanceData = async () => {
  const creators = await User.find({ role: 'Creator' });
  const performanceList = [];

  for (const c of creators) {
    const creatorId = c._id || c.id;

    // Brand sponsorships
    const deals = await BrandDeal.find({ creatorId });
    const totalDealsValue = deals
      .filter(d => ['Completed', 'Contract Signed', 'Payment Pending'].includes(d.stage))
      .reduce((sum, d) => sum + (Number(d.dealValue) || 0), 0);

    // Completed tasks
    const tasks = await TeamTask.find({ creatorId });
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;

    // Calendar schedules
    const events = await CalendarEvent.find({ creatorId });
    const calendarEventsCount = events.length;

    // Score calculation
    const score = Math.round((totalDealsValue / 1000) * 10 + (tasksCompleted * 15) + (calendarEventsCount * 5));

    performanceList.push({
      id: creatorId,
      name: c.name,
      email: c.email,
      status: c.status,
      isPremium: c.isPremium,
      totalDealsValue,
      tasksCompleted,
      totalTasks,
      calendarEventsCount,
      score
    });
  }

  return performanceList.sort((a, b) => b.score - a.score);
};

export const getCreatorPerformance = async (req, res) => {
  try {
    const leaderboard = await getCreatorPerformanceData();
    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    console.error('Get Creator Performance Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAIPerformanceAnalysis = async (req, res) => {
  try {
    const data = await getCreatorPerformanceData();
    if (data.length === 0) {
      return res.status(200).json({ success: true, analysis: 'No creator data available for AI performance analysis.' });
    }

    const leaderboardSummary = data.map((c, i) => 
      `${i + 1}. ${c.name} (${c.email}) - Score: ${c.score}, Total Deals Value: ₹${c.totalDealsValue}, Tasks Completed: ${c.tasksCompleted}/${c.totalTasks}, Content Posts: ${c.calendarEventsCount}, Status: ${c.status}`
    ).join('\n');

    const prompt = `You are CreatorHub's Executive AI Performance Analyzer.
Here is the live performance data of the content creators on our SaaS platform:
${leaderboardSummary}

Please write a highly professional, beautifully formatted markdown analysis report for the Administrator.
Include:
1. Executive Summary (Highlighting platform growth).
2. Star Creator Spotlight (Acknowledge who is leading and why they are performing best based on deals and tasks).
3. Actionable Growth Optimization tips for other creators on the platform.
4. Alerts or Warnings (e.g. creators with pending tasks or inactive/suspended accounts).
Use professional business SaaS vocabulary and markdown bullet points. Do not include markdown code block wrappings around the final markdown report text itself.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const resData = await response.json();
        if (resData.candidates && resData.candidates[0].content.parts[0].text) {
          return res.status(200).json({ success: true, analysis: resData.candidates[0].content.parts[0].text });
        }
      } catch (err) {
        console.error('Gemini API fetch failed, falling back to mock analyser:', err.message);
      }
    }

    // Dynamic Mock Fallback if API key is not configured or fails
    const mockAnalysis = `### 🤖 CreatorHub AI Executive Performance Report

#### 📊 1. Executive Summary
The CreatorHub workspace ecosystem shows highly positive engagement metrics. Brand partnerships and sponsor deals represent the primary driver of platform value, followed by coordinated content calendar postings.

#### 🏆 2. Star Creator Spotlight
* **Leading Creator**: **${data[0]?.name || 'N/A'}** (${data[0]?.email || 'N/A'})
* **Performance Analysis**: With a top Score of **${data[0]?.score || 0}** and brand partnerships valued at **₹${data[0]?.totalDealsValue.toLocaleString() || 0}**, this user demonstrates exceptional commercial execution. Coordinated team tasks completed (**${data[0]?.tasksCompleted || 0}**) confirm strong operational efficiency.

#### 💡 3. Growth & Optimization Strategies
* **Cross-Platform Scheduling**: Encourage creators to sync calendar reminders to prevent post fatigue.
* **Deal Pipeline Progression**: Creators should transition leads from "Pitching" to "Completed" within 14 days to maximize monthly earnings velocity.

#### ⚠️ 4. Administrative Risk Assessment
* Make sure all active accounts follow whitelisted payment guidelines and that suspended profiles have their deal pipelines locked.
`;
    res.status(200).json({ success: true, analysis: mockAnalysis });
  } catch (error) {
    console.error('AI Performance Analysis Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- New God Mode Controls ---
export const getReferralNetwork = async (req, res) => {
  try {
    const allUsers = await User.find({}).lean();
    
    // Group users by the person who referred them
    const network = {};
    const usersMap = {};

    allUsers.forEach(u => {
      usersMap[u.referralCode] = { id: u._id, name: u.name, email: u.email, referralCount: u.referralCount };
    });

    allUsers.forEach(u => {
      if (u.referredBy) {
        if (!network[u.referredBy]) {
          network[u.referredBy] = {
            referrer: usersMap[u.referredBy] || { name: 'Unknown', email: 'N/A' },
            referredUsers: []
          };
        }
        network[u.referredBy].referredUsers.push({
          id: u._id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt
        });
      }
    });

    res.status(200).json({ success: true, network: Object.values(network) });
  } catch (error) {
    console.error('Error fetching referral network:', error);
    res.status(500).json({ success: false, message: 'Server error fetching referral network' });
  }
};

export const masterEditUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Allow editing almost everything except password explicitly if they don't want to
    // But since admin is god, whatever comes in body is updated.
    
    // Ensure numeric parsing for certain fields just in case
    if (updateData.referralCount !== undefined) updateData.referralCount = Number(updateData.referralCount);
    
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).lean();
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, message: 'User details updated successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error in master edit user:', error);
    res.status(500).json({ success: false, message: 'Server error while editing user' });
  }
};
