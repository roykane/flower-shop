/**
 * Notification utility for order status changes
 *
 * This module provides notification helpers that can be connected to
 * SMS (Twilio, Vietguys, etc.) or Zalo OA services.
 *
 * Currently logs notifications - replace with actual service calls for production.
 */

// Status messages in Vietnamese
const statusMessages = {
  pending: 'Đơn hàng của bạn đang chờ xác nhận.',
  confirmed: 'Đơn hàng đã được xác nhận. Shop đang chuẩn bị hàng.',
  processing: 'Đơn hàng đang được xử lý.',
  shipped: 'Đơn hàng đang trên đường giao đến bạn.',
  delivered: 'Đơn hàng đã giao thành công. Cảm ơn bạn đã mua hàng!',
  cancelled: 'Đơn hàng đã bị hủy.',
};

const paymentMessages = {
  pending: 'Đơn hàng đang chờ thanh toán.',
  paid: 'Đơn hàng đã được thanh toán thành công.',
  failed: 'Thanh toán thất bại. Vui lòng thử lại.',
  refunded: 'Đơn hàng đã được hoàn tiền.',
};

/**
 * Send notification when order status changes
 * @param {Object} order - The order object
 * @param {string} newStatus - The new status
 * @param {string} note - Optional note
 */
async function notifyOrderStatusChange(order, newStatus, note = '') {
  const phone = order.shippingAddress?.phone;
  const orderCode = order.orderCode || order._id;
  const message = statusMessages[newStatus] || `Trạng thái đơn hàng: ${newStatus}`;

  const fullMessage = `[MINH ANH] Đơn hàng ${orderCode}: ${message}${note ? ` (${note})` : ''} Hotline: 0839477199`;

  // Log for now - replace with actual SMS/Zalo service
  console.log(`[NOTIFICATION] To: ${phone}`);
  console.log(`[NOTIFICATION] Message: ${fullMessage}`);

  // TODO: Integrate with SMS service
  // Example for Twilio:
  // await twilioClient.messages.create({
  //   body: fullMessage,
  //   from: process.env.TWILIO_PHONE,
  //   to: phone,
  // });

  // TODO: Integrate with Zalo OA
  // Example:
  // await zaloService.sendMessage({
  //   phone: phone,
  //   message: fullMessage,
  // });

  return { success: true, phone, message: fullMessage };
}

/**
 * Send notification when payment status changes
 * @param {Object} order - The order object
 * @param {string} newPaymentStatus - The new payment status
 */
async function notifyPaymentStatusChange(order, newPaymentStatus) {
  const phone = order.shippingAddress?.phone;
  const orderCode = order.orderCode || order._id;
  const message = paymentMessages[newPaymentStatus] || `Trạng thái thanh toán: ${newPaymentStatus}`;

  const fullMessage = `[MINH ANH] Đơn hàng ${orderCode}: ${message} Hotline: 0839477199`;

  console.log(`[NOTIFICATION] To: ${phone}`);
  console.log(`[NOTIFICATION] Message: ${fullMessage}`);

  return { success: true, phone, message: fullMessage };
}

/**
 * Send order confirmation notification
 * @param {Object} order - The order object
 */
async function notifyOrderCreated(order) {
  const phone = order.shippingAddress?.phone;
  const orderCode = order.orderCode || order._id;
  const total = order.total?.toLocaleString('vi-VN') || '0';

  const fullMessage = `[MINH ANH] Cảm ơn bạn đã đặt hàng! Mã đơn: ${orderCode}. Tổng: ${total}đ. Shop sẽ gọi xác nhận trong 30 phút. Hotline: 0839477199`;

  console.log(`[NOTIFICATION] To: ${phone}`);
  console.log(`[NOTIFICATION] Message: ${fullMessage}`);

  return { success: true, phone, message: fullMessage };
}

/**
 * Send Zalo message (placeholder)
 * @param {string} phone - Phone number
 * @param {string} message - Message content
 */
async function sendZaloMessage(phone, message) {
  // TODO: Implement Zalo OA API integration
  // Requires Zalo OA account and API credentials
  console.log(`[ZALO] To: ${phone}`);
  console.log(`[ZALO] Message: ${message}`);

  return { success: true, provider: 'zalo' };
}

/**
 * Send SMS message (placeholder)
 * @param {string} phone - Phone number
 * @param {string} message - Message content
 */
async function sendSMS(phone, message) {
  // TODO: Implement SMS service (Twilio, Vietguys, eSMS, etc.)
  console.log(`[SMS] To: ${phone}`);
  console.log(`[SMS] Message: ${message}`);

  return { success: true, provider: 'sms' };
}

module.exports = {
  notifyOrderStatusChange,
  notifyPaymentStatusChange,
  notifyOrderCreated,
  sendZaloMessage,
  sendSMS,
  statusMessages,
  paymentMessages,
};
