import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMultichannelNotification, NotificationTemplates } from '@/lib/notifications';
import { generateOrderNumber } from '@/lib/utils';
import { z } from 'zod';

const createOrderSchema = z.object({
  eventType: z.enum(['birthday', 'marriage', 'party', 'corporate']),
  eventSubtype: z.string().optional(),
  venueName: z.string().min(2),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  contactName: z.string().min(2),
  contactPhone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/),
  contactEmail: z.string().email().optional().or(z.literal('')),
  alternatePhone: z.string().optional(),
  eventDate: z.string().date(),
  setupCompleteBy: z.string().regex(/^\d{2}:\d{2}$/),
  dismantleTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  packageId: z.string().uuid().optional(),
  customRequirements: z.string().max(2000).optional(),
  referenceImages: z.array(z.string().url()).max(5).optional(),
  budgetRange: z.enum(['under_25k', '25k_50k', '50k_1l', '1l_plus', 'custom']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    const supabase = createClient();

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Get user from auth
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // If no user, create a guest user entry or allow anonymous orders
    // For now, allow anonymous orders with user_id = null

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        ...validated,
        status: 'submitted',
        source: request.headers.get('x-client-platform') || 'web',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Create status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      to_status: 'submitted',
      notes: 'Order submitted by client',
    });

    // Notify owner (async, don't await)
    notifyOwner(order).catch(console.error);

    // Send client confirmation
    sendClientConfirmation(order).catch(console.error);

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.flatten() }, { status: 400 });
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}

async function notifyOwner(order: any) {
  const message = `🎈 *New Order Alert* 🎈
Order: ${order.order_number}
Event: ${order.event_type} ${order.event_subtype ? `(${order.event_subtype})` : ''}
Date: ${new Date(order.event_date).toLocaleDateString('en-IN')}
Venue: ${order.venue_name}, ${order.city}
Client: ${order.contact_name} - ${order.contact_phone}
Setup by: ${order.setup_complete_by}

Review in dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}`;

  // Send via WhatsApp Cloud API
  await sendMultichannelNotification('owner', {
    title: 'New Order Received',
    message,
    type: 'order_submitted',
    orderId: order.id,
    channels: ['whatsapp', 'sms', 'push'],
  });
  
  // Direct WhatsApp/SMS as backup
  if (process.env.OWNER_WHATSAPP_NUMBER) {
    await sendMultichannelNotification('owner', {
      title: 'New Order',
      message,
      type: 'order_submitted',
      channels: ['whatsapp', 'sms'],
    });
  }
}

async function sendClientConfirmation(order: any) {
  const template = NotificationTemplates.orderSubmitted(order.order_number, order.event_date, order.venue_name);
  
  await sendMultichannelNotification(order.user_id || 'guest', {
    ...template,
    orderId: order.id,
    channels: ['whatsapp', 'sms', 'in_app'],
  });
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is owner/admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  const isOwner = profile?.role === 'owner' || profile?.role === 'admin';

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  let query = supabase
    .from('orders')
    .select(`
      *,
      catalog_packages (title, base_price, discounted_price)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (!isOwner) {
    query = query.eq('user_id', user.id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (fromDate) {
    query = query.gte('event_date', fromDate);
  }

  if (toDate) {
    query = query.lte('event_date', toDate);
  }

  const { data: orders, error, count } = await query;

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}