import axios from 'axios';
import { createClient } from './supabase/server';

interface WhatsAppMessage {
  to: string;
  body: string;
  templateName?: string;
  templateParams?: string[];
}

interface SMSMessage {
  to: string;
  body: string;
}

interface FCMMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER;
const OWNER_PHONE = process.env.OWNER_PHONE_NUMBER;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits;
}

export async function sendWhatsAppNotification(
  to: string,
  message: string,
  templateName?: string,
  templateParams?: string[]
): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn('WhatsApp credentials not configured');
    return false;
  }

  try {
    const payload: any = {
      messaging_product: 'whatsapp',
      to: formatPhoneNumber(to),
    };

    if (templateName) {
      payload.type = 'template';
      payload.template = {
        name: templateName,
        language: { code: 'en' },
        components: templateParams
          ? [
              {
                type: 'body',
                parameters: templateParams.map((p) => ({ type: 'text', text: p })),
              },
            ]
          : [],
      };
    } else {
      payload.type = 'text';
      payload.text = { body: message };
    }

    await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return true;
  } catch (error) {
    console.error('WhatsApp send failed:', axios.isAxiosError(error) ? error.response?.data : error);
    return false;
  }
}

export async function sendSMSNotification(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio credentials not configured');
    return false;
  }

  try {
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      new URLSearchParams({
        To: formatPhoneNumber(to),
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }),
      {
        auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return true;
  } catch (error) {
    console.error('SMS send failed:', axios.isAxiosError(error) ? error.response?.data : error);
    return false;
  }
}

export async function sendFCMNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  if (!FCM_SERVER_KEY) {
    console.warn('FCM server key not configured');
    return false;
  }

  try {
    await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icons/icon-192.png',
          click_action: '/orders',
        },
        data: payload.data || {},
        priority: 'high',
      },
      {
        headers: {
          Authorization: `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return true;
  } catch (error) {
    console.error('FCM send failed:', axios.isAxiosError(error) ? error.response?.data : error);
    return false;
  }
}

export async function sendMultichannelNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: string;
    orderId?: string;
    channels?: ('in_app' | 'push' | 'sms' | 'whatsapp' | 'email')[];
  }
): Promise<void> {
  const supabase = createClient();
  const channels = notification.channels || ['in_app'];

  // Always create in-app notification
  if (channels.includes('in_app')) {
    await supabase.from('notifications').insert({
      user_id: userId,
      order_id: notification.orderId || null,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channels: ['in_app'],
    });
  }

  // Get user for other channels
  const { data: user } = await supabase.from('users').select('phone, email, fcm_token').eq('id', userId).single();
  if (!user) return;

  // Send WhatsApp
  if (channels.includes('whatsapp') && user.phone) {
    await sendWhatsAppNotification(user.phone, notification.message);
  }

  // Send SMS
  if (channels.includes('sms') && user.phone) {
    await sendSMSNotification(user.phone, notification.message);
  }

  // Send Push
  if (channels.includes('push') && user.fcm_token) {
    await sendFCMNotification(user.fcm_token, {
      title: notification.title,
      body: notification.message,
      data: { orderId: notification.orderId || '', type: notification.type },
    });
  }

  // Email would go here if needed
}

// Pre-built notification templates
export const NotificationTemplates = {
  orderSubmitted: (orderNumber: string, eventDate: string, venueName: string) => ({
    title: 'Order Received ✅',
    message: `Your order ${orderNumber} has been received for ${new Date(eventDate).toLocaleDateString('en-IN')} at ${venueName}. Our team will review and confirm within 30-60 minutes. Track: ${APP_URL}/orders/${orderNumber}`,
    type: 'order_submitted',
  }),

  orderAccepted: (orderNumber: string, eventDate: string) => ({
    title: 'Order Confirmed 🎉',
    message: `Great news! Your order ${orderNumber} for ${new Date(eventDate).toLocaleDateString('en-IN')} has been accepted. Advance payment instructions will follow.`,
    type: 'order_accepted',
  }),

  orderRejected: (orderNumber: string, reason: string) => ({
    title: 'Order Update',
    message: `We're sorry, but your order ${orderNumber} could not be accepted: ${reason}. Please contact us for alternatives or visit ${APP_URL}/explore`,
    type: 'order_rejected',
  }),

  quoteReceived: (orderNumber: string, amount: number) => ({
    title: 'Custom Quote Received 💰',
    message: `You've received a custom quote of ₹${amount.toLocaleString()} for order ${orderNumber}. Review and confirm at ${APP_URL}/orders/${orderNumber}`,
    type: 'quote_received',
  }),

  paymentDue: (orderNumber: string, amount: number, dueDate: string) => ({
    title: 'Payment Reminder 💳',
    message: `Advance payment of ₹${amount.toLocaleString()} for order ${orderNumber} is due by ${new Date(dueDate).toLocaleDateString('en-IN')}. Pay now at ${APP_URL}/orders/${orderNumber}`,
    type: 'payment_due',
  }),

  setupReminder: (orderNumber: string, eventDate: string, venueName: string) => ({
    title: 'Setup Tomorrow 🚚',
    message: `Reminder: Our team will set up decorations for order ${orderNumber} tomorrow at ${venueName}. Event date: ${new Date(eventDate).toLocaleDateString('en-IN')}`,
    type: 'setup_reminder',
  }),

  newOrderForOwner: (orderNumber: string, eventType: string, eventDate: string, venueName: string, clientName: string, clientPhone: string) => ({
    title: '🎈 New Order Alert',
    message: `Order: ${orderNumber}\nEvent: ${eventType} on ${new Date(eventDate).toLocaleDateString('en-IN')}\nVenue: ${venueName}\nClient: ${clientName} - ${clientPhone}\nReview: ${APP_URL}/admin/orders/${orderNumber}`,
    type: 'order_submitted',
  }),
};