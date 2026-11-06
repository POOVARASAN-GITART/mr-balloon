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
  const { reason } = body;

  if (!reason || !reason.trim()) {
    return NextResponse.json({ success: false, message: 'Rejection reason is required' }, { status: 400 });
  }

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
    return NextResponse.json({ success: false, message: 'Order cannot be rejected in current status' }, { status: 400 });
  }

  // Update order
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({
      status: 'rejected',
      owner_id: user.id,
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
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
    to_status: 'rejected',
    changed_by: user.id,
    notes: reason,
  });

  // Notify client
  await sendClientRejectionNotification(updatedOrder, reason);

  return NextResponse.json({ success: true, order: updatedOrder });
}

async function sendClientRejectionNotification(order: any, reason: string) {
  const template = NotificationTemplates.orderRejected(order.order_number, reason);
  
  await sendMultichannelNotification(order.user_id || 'guest', {
    ...template,
    orderId: order.id,
    channels: ['whatsapp', 'sms', 'in_app', 'push'],
  });
}