const Message = require('../models/Message');

// get conversation with a specific user
exports.getMessages = async (req, res, next) => {
  try {
    const { withUser } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: withUser },
        { sender: withUser, receiver: req.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profilePic')
      .populate('receiver', 'name profilePic');

    res.json(messages);
  } catch (err) {
    next(err);
  }
};
