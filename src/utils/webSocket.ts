// import { Server } from "http";
// import { WebSocket, WebSocketServer } from "ws";
// import { Secret } from "jsonwebtoken";
// import { jwtHelpers } from "../helpars/jwtHelpers";
// import config from "../config";
// import {
//   NotificationType,
//   Role,
//   BookingStatus,
//   ReqStatus,
//   RoomType,
//   DeliveryType,
// } from "@prisma/client";
// import prisma from "../shared/prisma";
// import { notificationService } from "../app/modules/notification/notification.service";

// interface ExtendedWebSocket extends WebSocket {
//   userId?: string;
//   userRole?: Role;
//   userName?: string;
//   isAlive?: boolean;
//   path?: string;
//   activeConvId?: string;
// }

// export const onlineUsers = new Map<
//   string,
//   { socket: ExtendedWebSocket; path: string }
// >();

// // Track online drivers and deliverymen separately
// const onlineDrivers = new Map<string, ExtendedWebSocket>();
// const onlineDeliveryMen = new Map<string, ExtendedWebSocket>();

// // Function to calculate distance between two points
// const calculateDistance = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ): number => {
//   const toRad = (value: number) => (value * Math.PI) / 180;
//   const R = 6371; // Earth's radius in kilometers
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const lat1Rad = toRad(lat1);
//   const lat2Rad = toRad(lat2);
//   const a =
//     Math.pow(Math.cos(lat2Rad) * Math.sin(dLon), 2) +
//     Math.pow(
//       Math.cos(lat1Rad) * Math.sin(lat2Rad) -
//         Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon),
//       2
//     );
//   const b =
//     Math.sin(lat1Rad) * Math.sin(lat2Rad) +
//     Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
//   const angle = Math.atan2(Math.sqrt(a), b);
//   return Number((R * angle).toFixed(2));
// };

// // Helper function to find a room with exactly the specified participants
// async function findRoomForUsers(userIds: string[]): Promise<any> {
//   // First, find rooms that have all the specified users as participants
//   const rooms = await prisma.room.findMany({
//     where: {
//       participants: {
//         every: {
//           userId: { in: userIds },
//         },
//       },
//     },
//   });

//   // Now check if any of these rooms have exactly the specified participants
//   for (const room of rooms) {
//     const roomParticipants = await prisma.roomUser.findMany({
//       where: { roomId: room.id },
//       select: { userId: true },
//     });

//     const roomUserIds = roomParticipants.map((p) => p.userId);

//     // Check if the room has exactly the same participants as userIds
//     if (
//       roomUserIds.length === userIds.length &&
//       roomUserIds.every((id) => userIds.includes(id))
//     ) {
//       return room;
//     }
//   }

//   return null;
// }

// // Helper function to create a room for the specified users
// async function createRoomForUsers(
//   userIds: string[],
//   creatorId: string
// ): Promise<any> {
//   // Create a new room
//   const room = await prisma.room.create({
//     data: {
//       type: userIds.length > 2 ? RoomType.GROUP : RoomType.PRIVATE,
//       creatorId: creatorId,
//       participants: {
//         create: userIds.map((userId) => ({
//           userId: userId,
//         })),
//       },
//     },
//   });

//   return room;
// }

// export function setupWebSocket(server: Server) {
//   const wss = new WebSocketServer({
//     server,
//     perMessageDeflate: false,
//     handleProtocols: (protocols: string[] | Set<string>) => {
//       const protocolArray = Array.isArray(protocols)
//         ? protocols
//         : Array.from(protocols);
//       if (protocolArray.length === 0) {
//         return "";
//       }
//       return protocolArray[0];
//     },
//   });

//   // Make wss available globally
//   (global as any).wss = wss;

//   function heartbeat(ws: ExtendedWebSocket) {
//     ws.isAlive = true;
//   }

//   const interval = setInterval(() => {
//     wss.clients.forEach((ws: ExtendedWebSocket) => {
//       if (ws.isAlive === false) {
//         if (ws.userId) {
//           onlineUsers.delete(ws.userId);
//           if (ws.userRole === Role.DRIVER) {
//             onlineDrivers.delete(ws.userId);
//           } else if (ws.userRole === Role.DELIVERYMAN) {
//             onlineDeliveryMen.delete(ws.userId);
//           }
//         }
//         return ws.terminate();
//       }
//       ws.isAlive = false;
//       ws.ping();
//     });
//   }, 30000);

//   wss.on("close", () => {
//     clearInterval(interval);
//   });

//   wss.on("connection", (ws: ExtendedWebSocket, req) => {
//     ws.isAlive = true;
//     ws.path = req.url;
//     console.log("New WebSocket connection established on path:", ws.path);
//     ws.send(
//       JSON.stringify({
//         event: "info",
//         message: "Connected to server. Please authenticate.",
//       })
//     );

//     ws.on("pong", () => heartbeat(ws));

//     ws.on("message", async (data: string) => {
//       try {
//         const parsedData = JSON.parse(data);
//         console.log("Received event:", parsedData.event, "on path:", ws.path);

//         if (!ws.userId && parsedData.event !== "authenticate") {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Please authenticate first",
//             })
//           );
//           return;
//         }

//         // Handle authentication for all paths
//         if (parsedData.event === "authenticate") {
//           const token = parsedData.token;
//           if (!token) {
//             ws.send(
//               JSON.stringify({
//                 event: "error",
//                 message: "Token is required for authentication",
//               })
//             );
//             return;
//           }

//           try {
//             const user = jwtHelpers.verifyToken(
//               token,
//               config.jwt.jwt_secret as Secret
//             );
//             const { id, role, email } = user;

//             // Remove existing socket for this user on this path
//             const existingConnection = onlineUsers.get(id);
//             if (existingConnection && existingConnection.path === ws.path) {
//               existingConnection.socket.close();
//               onlineUsers.delete(id);
//               if (role === Role.DRIVER) {
//                 onlineDrivers.delete(id);
//               } else if (role === Role.DELIVERYMAN) {
//                 onlineDeliveryMen.delete(id);
//               }
//             }

//             ws.userId = id;
//             ws.userRole = role;
//             ws.userName = email;
//             onlineUsers.set(id, { socket: ws, path: ws.path! });

//             // Add to appropriate online map based on role
//             if (role === Role.DRIVER) {
//               onlineDrivers.set(id, ws);
//             } else if (role === Role.DELIVERYMAN) {
//               onlineDeliveryMen.set(id, ws);
//             }

//             ws.send(
//               JSON.stringify({
//                 event: "authenticated",
//                 data: { userId: id, role, success: true },
//               })
//             );
//           } catch (error) {
//             ws.send(
//               JSON.stringify({
//                 event: "error",
//                 message: "Invalid token",
//               })
//             );
//           }
//           return;
//         }

//         // Route messages based on path
//         if (ws.path === "/admin-chat") {
//           await handleAdminChatMessage(ws, parsedData);
//         } else {
//           await handleBookingChatMessage(ws, parsedData);
//         }
//       } catch (error) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Invalid message format",
//           })
//         );
//       }
//     });

//     ws.on("close", () => {
//       if (ws.userId) {
//         onlineUsers.delete(ws.userId);
//         if (ws.userRole === Role.DRIVER) {
//           onlineDrivers.delete(ws.userId);
//         } else if (ws.userRole === Role.DELIVERYMAN) {
//           onlineDeliveryMen.delete(ws.userId);
//         }
//       }
//     });
//   });

//   return wss;
// }

// // Track active conversations for admins
// const activeAdminConversations = new Map<string, string>(); // Maps adminId -> activeChatId

// async function handleAdminChatMessage(ws: ExtendedWebSocket, parsedData: any) {
//   // Admin chat handling remains mostly correct since it doesn't depend on booking models
//   // Only minor adjustments for type safety
//   switch (parsedData.event) {
//     case "startChat": {
//       const { targetUserId } = parsedData;
//       if (!targetUserId) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "targetUserId is required",
//           })
//         );
//         return;
//       }
//       try {
//         const user = await prisma.user.findUnique({
//           where: { id: ws.userId },
//         });
//         if (!user) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "User not found",
//             })
//           );
//           return;
//         }

//         // If regular user, can only chat with admin
//         if (user.role !== Role.ADMIN) {
//           const admin = await prisma.user.findFirst({
//             where: { role: Role.ADMIN },
//           });
//           if (!admin) {
//             ws.send(
//               JSON.stringify({
//                 event: "error",
//                 message: "No admin available",
//               })
//             );
//             return;
//           }

//           let chat = await prisma.adminChat.findFirst({
//             where: {
//               OR: [
//                 { userId: ws.userId, adminId: admin.id },
//                 { userId: admin.id, adminId: ws.userId },
//               ],
//             },
//           });

//           if (!chat) {
//             chat = await prisma.adminChat.create({
//               data: {
//                 userId: ws.userId!,
//                 adminId: admin.id,
//               },
//             });
//           }

//           ws.send(
//             JSON.stringify({
//               event: "chatStarted",
//               data: chat,
//             })
//           );
//         } else {
//           // Admin can chat with anyone
//           const targetUser = await prisma.user.findUnique({
//             where: { id: targetUserId },
//           });
//           if (!targetUser) {
//             ws.send(
//               JSON.stringify({
//                 event: "error",
//                 message: "Target user not found",
//               })
//             );
//             return;
//           }

//           let chat = await prisma.adminChat.findFirst({
//             where: {
//               OR: [
//                 { userId: targetUserId, adminId: ws.userId },
//                 { userId: ws.userId, adminId: targetUserId },
//               ],
//             },
//           });

//           if (!chat) {
//             chat = await prisma.adminChat.create({
//               data: {
//                 userId: targetUserId,
//                 adminId: ws.userId!,
//               },
//             });
//           }

//           ws.send(
//             JSON.stringify({
//               event: "chatStarted",
//               data: chat,
//             })
//           );
//         }
//       } catch (error) {
//         console.error("Error starting chat:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to start chat",
//           })
//         );
//       }
//       break;
//     }
//     // Other admin chat cases remain mostly unchanged
//     // ... (rest of admin chat handling stays the same)
//   }
// }

// async function handleBookingChatMessage(
//   ws: ExtendedWebSocket,
//   parsedData: any
// ) {
//   switch (parsedData.event) {
//     case "joinBookingChat": {
//       const { bookingId } = parsedData;
//       if (!bookingId) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "bookingId is required",
//           })
//         );
//         return;
//       }

//       try {
//         const booking = await prisma.booking.findUnique({
//           where: { id: bookingId },
//           include: {
//             customer: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             driver: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             deliveryMan: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             pickupLocation: true,
//             shippingAddress: true,
//           },
//         });

//         if (!booking) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Booking not found",
//             })
//           );
//           return;
//         }

//         // Check if user is either customer or the assigned driver/deliveryman
//         const isCustomer = booking.customer?.userId === ws.userId;
//         const isDriver = booking.driver?.userId === ws.userId;
//         const isDeliveryMan = booking.deliveryMan?.userId === ws.userId;

//         if (!isCustomer && !isDriver && !isDeliveryMan) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "You are not authorized to join this chat",
//             })
//           );
//           return;
//         }

//         // Check if chat is allowed based on request status
//         if (
//           booking.reqStatus !== ReqStatus.ACCEPT &&
//           booking.reqStatus !== ReqStatus.ASSIGNED_TO_DRIVER &&
//           booking.reqStatus !== ReqStatus.ASSIGNED_TO_DELIVERYMAN &&
//           booking.reqStatus !== ReqStatus.IN_PROGRESS
//         ) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message:
//                 "Chat is only available for accepted or in-progress bookings",
//             })
//           );
//           return;
//         }

//         // Check booking completion status
//         if (
//           booking.status === BookingStatus.COMPLETED ||
//           booking.status === BookingStatus.CANCELLED
//         ) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message:
//                 "Chat is not available for completed or cancelled bookings",
//             })
//           );
//           return;
//         }

//         // Identify all users involved in the booking
//         const userIds = [];
//         if (booking.customer) userIds.push(booking.customer.userId);
//         if (booking.driver) userIds.push(booking.driver.userId);
//         if (booking.deliveryMan) userIds.push(booking.deliveryMan.userId);

//         // Find a room with exactly these participants
//         let room = await findRoomForUsers(userIds);

//         // If no room exists, create one
//         if (!room) {
//           room = await createRoomForUsers(userIds, ws.userId!);
//         }

//         // Get messages for this room
//         const messages = await prisma.chat.findMany({
//           where: { roomId: room.id },
//           orderBy: { createdAt: "asc" },
//           include: {
//             sender: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 avatar: true,
//               },
//             },
//             readStatus: {
//               where: {
//                 userId: ws.userId,
//               },
//             },
//           },
//         });

//         // Format messages with isSender flag
//         const messagesWithSenderFlag = messages.map((msg) => ({
//           ...msg,
//           isSender: msg.senderId === ws.userId,
//           isRead: msg.readStatus.length > 0 ? msg.readStatus[0].isRead : false,
//         }));

//         // Get participant details
//         const participants = await prisma.roomUser.findMany({
//           where: { roomId: room.id },
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 avatar: true,
//               },
//             },
//           },
//         });

//         const participantsData = participants.map((p) => p.user);

//         ws.send(
//           JSON.stringify({
//             event: "joinedBookingChat",
//             data: {
//               roomId: room.id,
//               bookingId: booking.id,
//               participants: participantsData,
//               messages: messagesWithSenderFlag,
//               roomType: room.type,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error joining booking chat:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to join chat",
//           })
//         );
//       }
//       break;
//     }

//     case "bookingMessage": {
//       const { bookingId, message, images = [] } = parsedData;
//       if (!bookingId || (!message && (!images || images.length === 0))) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "bookingId and either message or images are required",
//           })
//         );
//         return;
//       }

//       try {
//         const booking = await prisma.booking.findUnique({
//           where: { id: bookingId },
//           include: {
//             customer: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             driver: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             deliveryMan: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//           },
//         });

//         if (!booking) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Booking not found",
//             })
//           );
//           return;
//         }

//         // Verify chat eligibility
//         if (
//           booking.reqStatus !== ReqStatus.ACCEPT &&
//           booking.reqStatus !== ReqStatus.ASSIGNED_TO_DRIVER &&
//           booking.reqStatus !== ReqStatus.ASSIGNED_TO_DELIVERYMAN &&
//           booking.reqStatus !== ReqStatus.IN_PROGRESS
//         ) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message:
//                 "Chat is only available for accepted or in-progress bookings",
//             })
//           );
//           return;
//         }

//         if (
//           booking.status === BookingStatus.COMPLETED ||
//           booking.status === BookingStatus.CANCELLED
//         ) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message:
//                 "Chat is not available for completed or cancelled bookings",
//             })
//           );
//           return;
//         }

//         // Identify all users involved in the booking
//         const userIds = [];
//         if (booking.customer) userIds.push(booking.customer.userId);
//         if (booking.driver) userIds.push(booking.driver.userId);
//         if (booking.deliveryMan) userIds.push(booking.deliveryMan.userId);

//         // Find a room with exactly these participants
//         let room = await findRoomForUsers(userIds);

//         // If no room exists, create one
//         if (!room) {
//           room = await createRoomForUsers(userIds, ws.userId!);
//         }

//         // Create message
//         const newMessage = await prisma.chat.create({
//           data: {
//             roomId: room.id,
//             senderId: ws.userId!,
//             message: message || "",
//             images: images || [],
//           },
//           include: {
//             sender: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 avatar: true,
//               },
//             },
//             readStatus: true,
//           },
//         });

//         // Create read status for sender
//         await prisma.chatReadStatus.create({
//           data: {
//             chatId: newMessage.id,
//             userId: ws.userId!,
//             isRead: true,
//           },
//         });

//         // Send to all participants except sender
//         const roomParticipants = await prisma.roomUser.findMany({
//           where: { roomId: room.id },
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 avatar: true,
//                 fcmToken: true,
//               },
//             },
//           },
//         });

//         for (const participant of roomParticipants) {
//           if (participant.userId === ws.userId) continue; // Skip sender

//           const participantConnection = onlineUsers.get(participant.userId);
//           const isOnline =
//             participantConnection?.socket.readyState === WebSocket.OPEN;

//           // Send WebSocket message if online
//           if (isOnline && participantConnection?.path !== "/admin-chat") {
//             participantConnection.socket.send(
//               JSON.stringify({
//                 event: "newMessage",
//                 data: {
//                   ...newMessage,
//                   roomId: room.id,
//                   isSender: false,
//                   isRead: false,
//                 },
//               })
//             );
//           }
//           // Send push notification if offline
//           else if (participant.user.fcmToken) {
//             const senderName =
//               newMessage.sender.username ||
//               newMessage.sender.email ||
//               "Someone";
//             const notificationPayload = {
//               title: "New Message",
//               body: message || "Sent images",
//               type: NotificationType.CHAT,
//               targetId: bookingId,
//               slug: `/bookings/${bookingId}/chat`,
//             };

//             await notificationService.sendNotification(
//               participant.user.fcmToken,
//               notificationPayload,
//               participant.userId
//             );
//           }
//         }

//         // Send confirmation to sender
//         ws.send(
//           JSON.stringify({
//             event: "messageSent",
//             data: {
//               ...newMessage,
//               isSender: true,
//               isRead: true,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error sending message:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to send message",
//           })
//         );
//       }
//       break;
//     }

//     case "markMessagesAsRead": {
//       const { bookingId } = parsedData;
//       if (!bookingId) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "bookingId is required",
//           })
//         );
//         return;
//       }

//       try {
//         const booking = await prisma.booking.findUnique({
//           where: { id: bookingId },
//         });

//         if (!booking) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Booking not found",
//             })
//           );
//           return;
//         }

//         // Verify user is part of the booking
//         const isCustomer = booking.customerId === ws.userId;
//         const isDriver = booking.driverId === ws.userId;
//         const isDeliveryMan = booking.deliveryManId === ws.userId;

//         if (!isCustomer && !isDriver && !isDeliveryMan) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Not authorized to access this chat",
//             })
//           );
//           return;
//         }

//         // Identify all users involved in the booking
//         const userIds = [];
//         if (booking.customerId) userIds.push(booking.customerId);
//         if (booking.driverId) userIds.push(booking.driverId);
//         if (booking.deliveryManId) userIds.push(booking.deliveryManId);

//         // Find a room with exactly these participants
//         const room = await findRoomForUsers(userIds);

//         if (!room) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Chat room not found",
//             })
//           );
//           return;
//         }

//         // Mark messages as read
//         await prisma.chatReadStatus.updateMany({
//           where: {
//             chat: {
//               roomId: room.id,
//             },
//             userId: ws.userId,
//             isRead: false,
//           },
//           data: { isRead: true },
//         });

//         ws.send(
//           JSON.stringify({
//             event: "messagesMarkedAsRead",
//             data: {
//               bookingId,
//               success: true,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error marking messages as read:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to mark messages as read",
//           })
//         );
//       }
//       break;
//     }

//     case "fetchBookingMessages": {
//       const { bookingId } = parsedData;
//       if (!bookingId) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "bookingId is required",
//           })
//         );
//         return;
//       }

//       try {
//         const booking = await prisma.booking.findUnique({
//           where: { id: bookingId },
//           include: {
//             customer: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             driver: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             deliveryMan: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//           },
//         });

//         if (!booking) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Booking not found",
//             })
//           );
//           return;
//         }

//         // Verify user is part of the booking
//         const isCustomer = booking.customerId === ws.userId;
//         const isDriver = booking.driverId === ws.userId;
//         const isDeliveryMan = booking.deliveryManId === ws.userId;

//         if (!isCustomer && !isDriver && !isDeliveryMan) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Not authorized to access this chat",
//             })
//           );
//           return;
//         }

//         // Identify all users involved in the booking
//         const userIds = [];
//         if (booking.customerId) userIds.push(booking.customerId);
//         if (booking.driverId) userIds.push(booking.driverId);
//         if (booking.deliveryManId) userIds.push(booking.deliveryManId);

//         // Find a room with exactly these participants
//         const room = await findRoomForUsers(userIds);

//         if (!room) {
//           // If no room exists yet, return empty messages array
//           ws.send(
//             JSON.stringify({
//               event: "bookingMessages",
//               data: {
//                 bookingId,
//                 participants: [],
//                 messages: [],
//               },
//             })
//           );
//           return;
//         }

//         // Get messages for this room
//         const messages = await prisma.chat.findMany({
//           where: { roomId: room.id },
//           orderBy: { createdAt: "asc" },
//           include: {
//             sender: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 avatar: true,
//               },
//             },
//             readStatus: {
//               where: {
//                 userId: ws.userId,
//               },
//             },
//           },
//         });

//         // Format messages with isSender flag
//         const messagesWithSenderFlag = messages.map((msg) => ({
//           ...msg,
//           isSender: msg.senderId === ws.userId,
//           isRead: msg.readStatus.length > 0 ? msg.readStatus[0].isRead : false,
//         }));

//         // Get participant details
//         const participants = await prisma.roomUser.findMany({
//           where: { roomId: room.id },
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 username: true,
//                 email: true,
//                 avatar: true,
//               },
//             },
//           },
//         });

//         const participantsData = participants.map((p) => p.user);

//         ws.send(
//           JSON.stringify({
//             event: "bookingMessages",
//             data: {
//               bookingId,
//               participants: participantsData,
//               messages: messagesWithSenderFlag,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error fetching messages:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to fetch messages",
//           })
//         );
//       }
//       break;
//     }

//     case "updateDriverLocation":
//     case "updateDeliveryManLocation": {
//       const { bookingId, lat, lng, location } = parsedData;
//       if (!bookingId || lat === undefined || lng === undefined) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "bookingId, lat, and lng are required",
//           })
//         );
//         return;
//       }

//       try {
//         const booking = await prisma.booking.findUnique({
//           where: { id: bookingId },
//           include: {
//             pickupLocation: true,
//             shippingAddress: true,
//             customer: {
//               include: {
//                 user: true,
//               },
//             },
//           },
//         });

//         if (!booking) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Booking not found",
//             })
//           );
//           return;
//         }

//         // Verify user is the driver or delivery man
//         const isDriver = booking.driverId === ws.userId;
//         const isDeliveryMan = booking.deliveryManId === ws.userId;

//         if (!isDriver && !isDeliveryMan) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message:
//                 "Only the assigned driver/delivery man can update location",
//             })
//           );
//           return;
//         }

//         // Update user location
//         await prisma.user.update({
//           where: { id: ws.userId },
//           data: {
//             lat: Number(lat),
//             lng: Number(lng),
//             isLocationOn: true,
//           },
//         });

//         // Determine target location based on booking status
//         let targetLat, targetLng;

//         if (
//           booking.reqStatus === ReqStatus.ASSIGNED_TO_DRIVER ||
//           booking.reqStatus === ReqStatus.ASSIGNED_TO_DELIVERYMAN
//         ) {
//           // Heading to pickup location
//           targetLat = booking.pickupLocation?.lat;
//           targetLng = booking.pickupLocation?.lng;
//         } else {
//           // Heading to delivery location
//           targetLat = booking.shippingAddress?.lat;
//           targetLng = booking.shippingAddress?.lng;
//         }

//         // Calculate remaining distance
//         let remainingDistance = 0;
//         if (targetLat !== undefined && targetLng !== undefined) {
//           remainingDistance = calculateDistance(
//             Number(lat),
//             Number(lng),
//             Number(targetLat),
//             Number(targetLng)
//           );
//         }

//         // Send update to customer if online
//         if (booking.customer?.userId) {
//           const customerConnection = onlineUsers.get(booking.customer.userId);
//           if (
//             customerConnection?.socket.readyState === WebSocket.OPEN &&
//             customerConnection.path !== "/admin-chat"
//           ) {
//             customerConnection.socket.send(
//               JSON.stringify({
//                 event: "driverLocationUpdated",
//                 data: {
//                   bookingId: booking.id,
//                   location: { lat, lng, location },
//                   remainingDistance: Number(remainingDistance.toFixed(2)),
//                   isHeadingToPickup:
//                     booking.reqStatus === ReqStatus.ASSIGNED_TO_DRIVER ||
//                     booking.reqStatus === ReqStatus.ASSIGNED_TO_DELIVERYMAN,
//                 },
//               })
//             );
//           }
//         }

//         // Send confirmation to driver/delivery man
//         ws.send(
//           JSON.stringify({
//             event: "locationUpdated",
//             data: {
//               bookingId: booking.id,
//               location: { lat, lng, location },
//               remainingDistance: Number(remainingDistance.toFixed(2)),
//               isHeadingToPickup:
//                 booking.reqStatus === ReqStatus.ASSIGNED_TO_DRIVER ||
//                 booking.reqStatus === ReqStatus.ASSIGNED_TO_DELIVERYMAN,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error updating location:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to update location",
//           })
//         );
//       }
//       break;
//     }

//     case "updateLocation": {
//       const { lat, lng, location } = parsedData;
//       if (lat === undefined || lng === undefined) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "lat and lng are required",
//           })
//         );
//         return;
//       }

//       try {
//         // Verify user is authenticated
//         if (!ws.userId) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "User not authenticated",
//             })
//           );
//           return;
//         }

//         // Update user's location in the database
//         const updatedUser = await prisma.user.update({
//           where: { id: ws.userId },
//           data: {
//             lat: Number(lat),
//             lng: Number(lng),
//             isLocationOn: true,
//           },
//           select: {
//             id: true,
//             lat: true,
//             lng: true,
//             role: true,
//           },
//         });

//         // Verify user is a driver or delivery man
//         if (
//           updatedUser.role !== Role.DRIVER &&
//           updatedUser.role !== Role.DELIVERYMAN
//         ) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Only drivers and delivery men can update location",
//             })
//           );
//           return;
//         }

//         // Send confirmation
//         ws.send(
//           JSON.stringify({
//             event: "locationUpdated",
//             data: {
//               id: updatedUser.id,
//               location: {
//                 lat: updatedUser.lat,
//                 lng: updatedUser.lng,
//               },
//               success: true,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error updating location:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to update location",
//           })
//         );
//       }
//       break;
//     }

//     case "newBookingRequest": {
//       const { bookingId } = parsedData;
//       if (!bookingId) {
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "bookingId is required",
//           })
//         );
//         return;
//       }

//       try {
//         const booking = await prisma.booking.findUnique({
//           where: { id: bookingId },
//           include: {
//             customer: {
//               include: {
//                 user: {
//                   select: {
//                     id: true,
//                     username: true,
//                     email: true,
//                     avatar: true,
//                   },
//                 },
//               },
//             },
//             pickupLocation: true,
//             shippingAddress: true,
//           },
//         });

//         if (!booking) {
//           ws.send(
//             JSON.stringify({
//               event: "error",
//               message: "Booking not found",
//             })
//           );
//           return;
//         }

//         // Only send to available drivers/delivery men based on delivery type
//         let targetUsers: any[] = [];

//         if (booking.deliveryType === DeliveryType.TOW_TRUCK) {
//           targetUsers = Array.from(onlineDrivers.values());
//         } else if (booking.deliveryType === DeliveryType.DELIVERYMAN) {
//           targetUsers = Array.from(onlineDeliveryMen.values());
//         }

//         // Send to all available drivers/delivery men
//         for (const courierSocket of targetUsers) {
//           courierSocket.send(
//             JSON.stringify({
//               event: "newBookingRequest",
//               data: {
//                 bookingId: booking.id,
//                 customer: booking.customer?.user,
//                 pickupLocation: booking.pickupLocation,
//                 shippingAddress: booking.shippingAddress,
//                 price: booking.price,
//                 finalPrice: booking.finalPrice,
//                 deliveryType: booking.deliveryType,
//                 deliveryOption: booking.deliveryOption,
//                 bookingDate: booking.bookingDate,
//                 bookingRef: booking.bookingRef,
//               },
//             })
//           );
//         }

//         // Send confirmation to sender (customer)
//         ws.send(
//           JSON.stringify({
//             event: "bookingRequestSent",
//             data: {
//               bookingId: booking.id,
//               success: true,
//             },
//           })
//         );
//       } catch (error) {
//         console.error("Error sending booking request:", error);
//         ws.send(
//           JSON.stringify({
//             event: "error",
//             message: "Failed to send booking request",
//           })
//         );
//       }
//       break;
//     }

//     default:
//       ws.send(
//         JSON.stringify({
//           event: "error",
//           message: "Unknown event type",
//         })
//       );
//   }
// }

// // Function to send booking request to available drivers/delivery men
// export function sendBookingRequestToCouriers(bookingData: any) {
//   // Determine which couriers to send to based on delivery type
//   const targetCouriers =
//     bookingData.deliveryType === DeliveryType.TOW_TRUCK
//       ? Array.from(onlineDrivers.values())
//       : Array.from(onlineDeliveryMen.values());

//   for (const courierSocket of targetCouriers) {
//     courierSocket.send(
//       JSON.stringify({
//         event: "newBookingRequest",
//         data: bookingData,
//       })
//     );
//   }
// }
