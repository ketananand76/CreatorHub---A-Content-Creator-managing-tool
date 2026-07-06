import { TeamTask, Message, User } from '../models/db.js';

export const getTeamMembers = async (req, res) => {
  try {
    // Return all team members in the system
    const members = await User.find({ role: 'Team Member' });
    const cleanMembers = members.map(m => ({
      id: m._id || m.id,
      name: m.name,
      email: m.email,
      status: m.status
    }));
    res.status(200).json({ success: true, members: cleanMembers });
  } catch (error) {
    console.error('Get Team Members Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTasks = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const role = req.user.role;
    
    let query = {};
    if (role === 'Creator') {
      // Creator sees tasks they assigned
      query = { creatorId: userId };
    } else if (role === 'Team Member') {
      // Team Member sees tasks assigned to them
      query = { assignedTo: userId };
    } else if (role === 'Super Admin' || role === 'Admin') {
      // Admins see all tasks
      query = {};
    }

    const tasks = await TeamTask.find(query);
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createTask = async (req, res) => {
  try {
    const creatorId = req.user._id || req.user.id;
    const { assignedTo, title, description, deadline } = req.body;

    if (!assignedTo || !title || !deadline) {
      return res.status(400).json({ success: false, message: 'Assigned user, title, and deadline are required' });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ success: false, message: 'Assigned team member not found' });
    }

    const task = await TeamTask.create({
      creatorId,
      assignedTo,
      assignedToName: assignedUser.name,
      title,
      description: description || '',
      status: 'todo',
      deadline
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;

    if (!['todo', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const task = await TeamTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: Team Member can update status if assigned to them.
    // Creator can update status if they created/assigned it.
    // Super Admin can update anything.
    const isAssignedToMe = String(task.assignedTo) === String(userId);
    const isCreatedByMe = String(task.creatorId) === String(userId);

    if (!isAssignedToMe && !isCreatedByMe && req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedTask = await TeamTask.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Update Task Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const task = await TeamTask.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (String(task.creatorId) !== String(userId) && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await TeamTask.deleteOne({ _id: id });
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    // For simplicity, creators define the channel context.
    // If user is a Creator, channel is their own ID.
    // If user is a Team Member, they can fetch messages using a creatorId query parameter.
    const role = req.user.role;
    let channelId = req.query.creatorId;

    if (role === 'Creator') {
      channelId = req.user._id || req.user.id;
    }

    if (!channelId) {
      // Find the first task assigned to this team member to get a creatorId
      const task = await TeamTask.findOne({ assignedTo: req.user._id || req.user.id });
      if (task) {
        channelId = task.creatorId;
      } else {
        // Fallback to general shared room
        channelId = 'general-team-room';
      }
    }

    const messages = await Message.find({ creatorId: channelId });
    // Sort chronological
    const sortedMsg = messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.status(200).json({ success: true, messages: sortedMsg, activeChannelId: channelId });
  } catch (error) {
    console.error('Get Chat Messages Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const postChatMessage = async (req, res) => {
  try {
    const senderId = req.user._id || req.user.id;
    const senderName = req.user.name;
    const { text, channelId } = req.body;

    if (!text || !channelId) {
      return res.status(400).json({ success: false, message: 'Text and channel ID are required' });
    }

    const newMsg = await Message.create({
      creatorId: channelId,
      senderId,
      senderName,
      text
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    console.error('Post Message Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
