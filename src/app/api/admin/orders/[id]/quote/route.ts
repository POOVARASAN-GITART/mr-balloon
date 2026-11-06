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
  const { amount, notes } = body;

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ success: false, message: 'Valid quoted amount is required' }, { status: 400 });
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

  if (order.status !== 'submitted') {
    return NextResponse.json({ success: false, message: 'Quote can only be sent for submitted orders' }, { status: 400 });
  }

  // Update order
  const { data: updatedOrder, error } = await supabase
    .from('orders')
    .update({
      status: 'quoted',
      owner_id: user.id,
      owner_notes: notes,
      quoted_amount: Number(amount),
      quote_sent_at: new Date().toISOString(),
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
    to_status: 'quoted',
    changed_by: user.id,
    notes: `Custom quote sent: ₹${Number(amount).toLocaleString()}`,
  });

  // Notify client
  await sendClientQuoteNotification(updatedOrder, Number(amount), notes);

  return NextResponse.json({ success: true, order: updatedOrder });
}

async function sendClientQuoteNotification(order: any, amount: number, notes?: string) {
  const template = NotificationTemplates.quoteReceived(order.order_number, amount);
  
  let message = template.message;
  if (notes) {
    message += `\n\nNotes: ${notes}`;
  }
  
  await sendMultichannelNotification(order.user_id || 'guest', {
    ...template,
    message,
    orderId: order.id,
    channels: ['whatsapp', 'sms', 'in_app', 'push'],
  });
}