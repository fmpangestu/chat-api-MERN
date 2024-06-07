import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // await conversation.save();
    // await newMessage.save();

    await Promise.all([conversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] },
        }).populate("messages");

        if (!conversation) {
            return res.status(404).json({ error: "No conversation found" });
        }
        const messages = conversation.messages;

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//!! ini untuk update message kedepan ok!
// export const deleteMessage = async (req, res) => {
//     try {
//         const { id: messageId } = req.params;
//         const senderId = req.user._id;

//         const message = await Message.findById(messageId);

//         if (!message) {
//             return res.status(404).json({ error: "No message found" });
//         }

//         if (message.senderId.toString() !== senderId) {
//             return res.status(401).json({ error: "Unauthorized" });
//         }

//         await message.remove();

//         res.status(200).json({ message: "Message deleted successfully" });
//     } catch (error) {
//         console.log("Error in deleteMessage controller", error.message);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// }
