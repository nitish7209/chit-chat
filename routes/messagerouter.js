const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messagecontroller');
const { authuser } = require('../middleware/auth');

router.post('/allMessages/:senderId', authuser, messageController.getAllMessages);


router.post('/sendMessage', authuser, messageController.createMessage);


router.get('/deleteMessage/:messageId', authuser, messageController.deleteMessage);


module.exports = router; 