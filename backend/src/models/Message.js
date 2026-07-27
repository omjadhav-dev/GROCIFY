const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // A conversation is uniquely identified by two user IDs
    // We store both to query easily
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // conversationId is just a sorted combo of both user IDs
    // so we can fetch all messages between two users quickly
    conversationId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
