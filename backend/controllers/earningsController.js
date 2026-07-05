import { IncomeExpense } from '../models/db.js';

export const getEarnings = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const logs = await IncomeExpense.find({ creatorId });
    
    // Sort by date descending
    const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate summaries
    let totalIncome = 0;
    let totalExpense = 0;
    const monthlySummary = {};

    sortedLogs.forEach(log => {
      const amt = Number(log.amount) || 0;
      if (log.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }

      // Monthly breakdown (YYYY-MM)
      const month = log.date.substring(0, 7);
      if (!monthlySummary[month]) {
        monthlySummary[month] = { income: 0, expense: 0 };
      }
      if (log.type === 'income') {
        monthlySummary[month].income += amt;
      } else {
        monthlySummary[month].expense += amt;
      }
    });

    const netProfit = totalIncome - totalExpense;

    // Create a forecast if user is premium
    let forecast = null;
    if (req.user.isPremium) {
      // Basic linear forecast based on monthly average
      const months = Object.keys(monthlySummary);
      if (months.length > 0) {
        const avgIncome = totalIncome / months.length;
        const avgExpense = totalExpense / months.length;
        
        forecast = Array.from({ length: 3 }).map((_, i) => {
          const nextMonthDate = new Date();
          nextMonthDate.setMonth(nextMonthDate.getMonth() + i + 1);
          const monthStr = nextMonthDate.toISOString().substring(0, 7);
          // Add small random growth factor (e.g. 5%)
          const multiplier = 1 + (i + 1) * 0.05;
          return {
            month: monthStr,
            projectedIncome: Math.round(avgIncome * multiplier),
            projectedExpense: Math.round(avgExpense * (1 + (i + 1) * 0.02)),
            growthRate: '5.0%'
          };
        });
      } else {
        // Fallback dummy forecast
        forecast = [
          { month: 'Forecast Month 1', projectedIncome: 50000, projectedExpense: 20000, growthRate: 'N/A' },
          { month: 'Forecast Month 2', projectedIncome: 55000, projectedExpense: 21000, growthRate: '10.0%' },
          { month: 'Forecast Month 3', projectedIncome: 60000, projectedExpense: 22000, growthRate: '9.0%' }
        ];
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        monthlyBreakdown: Object.entries(monthlySummary).map(([month, data]) => ({
          month,
          income: data.income,
          expense: data.expense
        })).sort((a, b) => a.month.localeCompare(b.month))
      },
      logs: sortedLogs,
      forecast,
      isPremium: req.user.isPremium
    });
  } catch (error) {
    console.error('Get Earnings Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addLog = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const { type, category, amount, date, description } = req.body;

    if (!type || !category || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Type, category, amount and date are required' });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense' });
    }

    const newLog = await IncomeExpense.create({
      creatorId,
      type,
      category,
      amount: Number(amount),
      date,
      description: description || ''
    });

    res.status(201).json({ success: true, log: newLog });
  } catch (error) {
    console.error('Add Log Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user._id || req.user.id;

    const log = await IncomeExpense.findById(id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (log.creatorId !== creatorId && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await IncomeExpense.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete Log Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
