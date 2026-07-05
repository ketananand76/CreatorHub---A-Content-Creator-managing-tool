import { CalendarEvent } from '../models/db.js';

export const getEvents = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const events = await CalendarEvent.find({ creatorId });
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('Get Calendar Events Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createEvent = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const { title, description, start, end, platform, reminderMinutes } = req.body;

    if (!title || !start) {
      return res.status(400).json({ success: false, message: 'Title and start date are required' });
    }

    const newEvent = await CalendarEvent.create({
      creatorId,
      title,
      description: description || '',
      start,
      end: end || start,
      platform: platform || 'YouTube',
      reminderMinutes: reminderMinutes !== undefined ? Number(reminderMinutes) : 30
    });

    res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Create Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user._id || req.user.id;

    const event = await CalendarEvent.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.creatorId !== creatorId && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedEvent = await CalendarEvent.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Update Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user._id || req.user.id;

    const event = await CalendarEvent.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.creatorId !== creatorId && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await CalendarEvent.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Delete Calendar Event Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
