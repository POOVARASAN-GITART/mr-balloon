import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMultichannelNotification, NotificationTemplates } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // Verify owner/admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'owner' && profile?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { notes } = body;

  // Get current order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
  }

  if (!['submitted', 'quoted'].includes(order.status)) {
    return NextResponse.json({ success: false, message: 'Order cannot be accepted in current status' }, { status: 400 });
  }

  // Update order
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({
      status: 'accepted',
      owner_id: user.id,
      owner_notes: notes,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  // Status history
  await supabase.from('order_status_history').insert({
    order_id: updatedOrder.id,
    from_status: order.status,
    to_status: 'accepted',
    changed_by: user.id,
    notes: notes || 'Order accepted by owner',
  });

  // Notify client
  await sendClientAcceptanceNotification(updatedOrder);

  // Notify team
  await notifyTeam(updatedOrder, 'accepted');

  return NextResponse.json({ success: true, order: updatedOrder });
}

async function sendClientAcceptanceNotification(order: any) {
  const template = NotificationTemplates.orderAccepted(order.order_number, order.event_date);
  
  await sendMultichannelNotification(order.user_id || 'guest', {
    ...template,
    orderId: order.id,
    channels: ['whatsapp', 'sms', 'in_app', 'push'],
  });
}

async function notifyTeam(order: any, action: string) {
  // Send to owner WhatsApp
  if (process.env.OWNER_WHATSAPP_NUMBER) {
    const message = `✅ Order ${order.order_number} ${action} by ${order.owner_id}`;
    await sendMultichannelNotification('owner', {
      title: `Order ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message,
      type: `order_${action}`,
      orderId: order.id,
      channels: ['whatsapp'],
    });
  }
}