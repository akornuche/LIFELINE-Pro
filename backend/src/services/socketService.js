import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Socket.IO Real-time Notification Service
 */

let io = null;
const userSockets = new Map(); // Map of userId to socket IDs

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      credentials: true
    },
    pingTimeout: config.socket.pingTimeout,
    pingInterval: config.socket.pingInterval
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      logger.error('Socket authentication failed', { error: error.message });
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('Client connected', {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole
    });

    // Store user's socket connection
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Handle user presence
    socket.on('user:online', () => {
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        status: 'online'
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('Client disconnected', {
        socketId: socket.id,
        userId: socket.userId
      });

      // Remove from user sockets map
      const userSocketSet = userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userId);
          
          // Broadcast offline status
          socket.broadcast.emit('user:status', {
            userId: socket.userId,
            status: 'offline'
          });
        }
      }
    });

    // Custom event handlers
    socket.on('typing:start', (data) => {
      socket.broadcast.to(`user:${data.to}`).emit('typing:status', {
        userId: socket.userId,
        typing: true
      });
    });

    socket.on('typing:stop', (data) => {
      socket.broadcast.to(`user:${data.to}`).emit('typing:status', {
        userId: socket.userId,
        typing: false
      });
    });
  });

  logger.info('Socket.IO initialized successfully');
  return io;
}

/**
 * Send notification to specific user
 */
export function notifyUser(userId, event, data) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Notification sent', { userId, event });
  return true;
}

/**
 * Send notification to multiple users
 */
export function notifyUsers(userIds, event, data) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  userIds.forEach(userId => {
    notifyUser(userId, event, data);
  });

  return true;
}

/**
 * Send notification to all users with specific role
 */
export function notifyRole(role, event, data) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  io.to(`role:${role}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Role notification sent', { role, event });
  return true;
}

/**
 * Broadcast notification to all connected users
 */
export function broadcast(event, data) {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  logger.debug('Broadcast sent', { event });
  return true;
}

/**
 * Check if user is online
 */
export function isUserOnline(userId) {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

/**
 * Get online users count
 */
export function getOnlineUsersCount() {
  return userSockets.size;
}

/**
 * Notification event types
 */
export const NOTIFICATION_EVENTS = {
  // Appointments
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_CONFIRMED: 'appointment:confirmed',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_REMINDER: 'appointment:reminder',

  // Consultations
  CONSULTATION_STARTED: 'consultation:started',
  CONSULTATION_COMPLETED: 'consultation:completed',
  CONSULTATION_NOTES_ADDED: 'consultation:notes_added',

  // Prescriptions
  PRESCRIPTION_CREATED: 'prescription:created',
  PRESCRIPTION_READY: 'prescription:ready',
  PRESCRIPTION_DISPENSED: 'prescription:dispensed',
  PRESCRIPTION_EXPIRING: 'prescription:expiring',

  // Surgeries
  SURGERY_SCHEDULED: 'surgery:scheduled',
  SURGERY_APPROVED: 'surgery:approved',
  SURGERY_REJECTED: 'surgery:rejected',
  SURGERY_COMPLETED: 'surgery:completed',

  // Lab Tests
  LAB_TEST_ORDERED: 'lab:test_ordered',
  LAB_RESULTS_READY: 'lab:results_ready',

  // Payments
  PAYMENT_RECEIVED: 'payment:received',
  PAYMENT_REMINDER: 'payment:reminder',
  PAYMENT_OVERDUE: 'payment:overdue',
  STATEMENT_GENERATED: 'payment:statement_generated',

  // Admin
  VERIFICATION_PENDING: 'admin:verification_pending',
  VERIFICATION_APPROVED: 'admin:verification_approved',
  VERIFICATION_REJECTED: 'admin:verification_rejected',

  // Messages
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_READ: 'message:read',

  // System
  SYSTEM_MAINTENANCE: 'system:maintenance',
  SYSTEM_ANNOUNCEMENT: 'system:announcement'
};

/**
 * Helper functions for common notifications
 */

export function notifyAppointmentCreated(patientId, doctorId, appointmentData) {
  notifyUser(patientId, NOTIFICATION_EVENTS.APPOINTMENT_CREATED, {
    title: 'Appointment Scheduled',
    message: `Your appointment with Dr. ${appointmentData.doctorName} has been scheduled`,
    data: appointmentData
  });

  notifyUser(doctorId, NOTIFICATION_EVENTS.APPOINTMENT_CREATED, {
    title: 'New Appointment',
    message: `New appointment with ${appointmentData.patientName}`,
    data: appointmentData
  });
}

export function notifyPrescriptionReady(patientId, prescriptionData) {
  notifyUser(patientId, NOTIFICATION_EVENTS.PRESCRIPTION_READY, {
    title: 'Prescription Ready',
    message: 'Your prescription is ready for pickup',
    data: prescriptionData
  });
}

export function notifyPaymentReminder(patientId, paymentData) {
  notifyUser(patientId, NOTIFICATION_EVENTS.PAYMENT_REMINDER, {
    title: 'Payment Reminder',
    message: `Your subscription expires in ${paymentData.daysRemaining} days`,
    data: paymentData
  });
}

export function notifyLabResultsReady(patientId, labData) {
  notifyUser(patientId, NOTIFICATION_EVENTS.LAB_RESULTS_READY, {
    title: 'Lab Results Available',
    message: 'Your lab test results are now available',
    data: labData
  });
}

export function notifySurgeryApproval(patientId, surgeryData) {
  notifyUser(patientId, NOTIFICATION_EVENTS.SURGERY_APPROVED, {
    title: 'Surgery Approved',
    message: 'Your surgery request has been approved',
    data: surgeryData
  });
}

export default {
  initializeSocketIO,
  notifyUser,
  notifyUsers,
  notifyRole,
  broadcast,
  isUserOnline,
  getOnlineUsersCount,
  NOTIFICATION_EVENTS,
  // Helper functions
  notifyAppointmentCreated,
  notifyPrescriptionReady,
  notifyPaymentReminder,
  notifyLabResultsReady,
  notifySurgeryApproval
};
