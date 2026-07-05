import { BrandDeal } from '../models/db.js';

export const getDeals = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const deals = await BrandDeal.find({ creatorId });
    res.status(200).json({ success: true, deals });
  } catch (error) {
    console.error('Get CRM Deals Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createDeal = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const { sponsorName, dealTitle, dealValue, stage, notes, contractUrl } = req.body;

    if (!sponsorName || !dealTitle || !dealValue) {
      return res.status(400).json({ success: false, message: 'Required fields: sponsorName, dealTitle, dealValue' });
    }

    const newDeal = await BrandDeal.create({
      creatorId,
      sponsorName,
      dealTitle,
      dealValue: Number(dealValue),
      stage: stage || 'Lead',
      notes: notes || '',
      contractUrl: contractUrl || ''
    });

    res.status(201).json({ success: true, deal: newDeal });
  } catch (error) {
    console.error('Create Deal Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user._id || req.user.id;

    const deal = await BrandDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    // Auth check: creators can edit their own deals
    if (deal.creatorId !== creatorId && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this deal' });
    }

    const updatedDeal = await BrandDeal.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, deal: updatedDeal });
  } catch (error) {
    console.error('Update Deal Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user._id || req.user.id;

    const deal = await BrandDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    if (deal.creatorId !== creatorId && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this deal' });
    }

    await BrandDeal.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete Deal Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
