const fs = require('fs');
let code = fs.readFileSync('backend/controllers/notificationController.js', 'utf8');

const newFunctions = `
export const getBroadcastHistory = async (req, res) => {
  try {
    const broadcasts = await Notification.find({ type: 'broadcast', userId: 'all' })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, broadcasts });
  } catch (error) {
    console.error('Get Broadcast History Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Broadcast deleted successfully' });
  } catch (error) {
    console.error('Delete Broadcast Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const remindBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const oldBroadcast = await Notification.findById(id);
    if (!oldBroadcast) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }

    // Create a new duplicate broadcast to bring it to the top
    const newBroadcast = await Notification.create({
      userId: 'all',
      title: 'Reminder: ' + (oldBroadcast.title.replace(/^Reminder: /, '')),
      message: oldBroadcast.message,
      type: 'broadcast',
      isReadBy: [] // reset read state
    });

    res.status(201).json({ success: true, message: 'Reminder broadcast sent successfully', broadcast: newBroadcast });
  } catch (error) {
    console.error('Remind Broadcast Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
`;

code = code + '\n' + newFunctions;
fs.writeFileSync('backend/controllers/notificationController.js', code);
console.log('Added functions to notificationController');
