const logger = require('../config/logger');
const chatModel = require('../models/chat');
const mongoose = require('mongoose');

// Fetch all messages
const getAllMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { senderId } = req.params;

        logger.info('Attempting to fetch all messages', { userId, senderId });

        if (!mongoose.Types.ObjectId.isValid(senderId)) {
            logger.error('Invalid senderId provided', { senderId });
            return res.status(400).json({
                success: false,
                message: 'Invalid senderId',
            });
        }

        const messages = await chatModel.aggregate([
            {
                $match: {
                    $or: [
                        { sender: mongoose.Types.ObjectId(userId), receiver: mongoose.Types.ObjectId(senderId) },
                        { sender: mongoose.Types.ObjectId(senderId), receiver: mongoose.Types.ObjectId(userId) },
                    ],
                },
            },
            {
                $project: {
                    message: 1,
                    createdAt: 1,
                    sender: 1,
                    time: {
                        $dateToString: {
                            format: "%H:%M",
                            date: "$createdAt",
                            timezone: "Asia/Kolkata" // Adjust timezone as needed
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        // Transform the messages to indicate if they're sent or received
        const formattedMessages = messages.map(msg => ({
            message: msg.message,
            time: msg.time,
            isSent: msg.sender.toString() === userId.toString()
        }));

        logger.info('Messages retrieved successfully', { messageCount: messages.length });

        return res.status(200).json({
            success: true,
            messages: formattedMessages
        });
    } catch (error) {
        logger.error('Error retrieving messages', { errorMessage: error.message, stack: error.stack });
        return res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch messages',
        });
    }
};

// Create a new message
const createMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { receiverId, message } = req.body;

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ success: false, message: 'Invalid receiverId' });
        }

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        const newMessage = new chatModel({ sender: userId, receiver: receiverId, message });
        await newMessage.save();

        // Emit event to the chat room
        const chatRoomId = `${Math.min(userId, receiverId)}_${Math.max(userId, receiverId)}`;
        req.io.to(chatRoomId).emit('receiveMessage', {
            senderId: userId,
            receiverId,
            message: newMessage.message,
            time: newMessage.createdAt,
        });


        // Emit notification event to the receiver (if they are connected via Socket.IO)
        req.io.to(`${receiverId}`).emit('newMessageNotification', {
            senderId: userId,
            message: newMessage.message,
            time: newMessage.createdAt,
        });


        return res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        logger.error('Error creating message', { error });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user._id;

        const message = await chatModel.findById(messageId);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

        if (message.sender.toString() !== userId.toString() && message.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await chatModel.findByIdAndDelete(messageId);

        const chatRoomId = `${Math.min(message.sender, message.receiver)}_${Math.max(message.sender, message.receiver)}`;
        req.io.to(chatRoomId).emit('deleteMessage', { messageId });

        return res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
        logger.error('Error deleting message', { error });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getAllMessages, createMessage, deleteMessage };
