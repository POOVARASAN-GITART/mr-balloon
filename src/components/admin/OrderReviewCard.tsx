'use client';

import { useState, useCallback } from 'react';
import { 
  MapPin, Phone, Calendar, Clock, AlertCircle, CheckCircle, 
  XCircle, MessageSquare, DollarSign, Map, Loader2, Bell,
  X, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button, Input, Textarea } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Order } from '@/types/database';

// ===== STATUS CONFIG =====
const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; icon: React.ComponentType<{ className?: string }> | null; bg: string }> = {
  draft: { label: 'Draft', color: 'text-slate-500', icon: null, bg: 'bg-slate-100' },
  submitted: { label: 'New Order', color: 'text-amber-700', icon: AlertCircle, bg: 'bg-amber-50 border-amber-200' },
  quoted: { label: 'Quoted', color: 'text-blue-700', icon: DollarSign, bg: 'bg-blue-50 border-blue-200' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-700', icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200' },
  in_progress: { label: 'In Progress', color: 'text-violet-700', icon: Loader2, bg: 'bg-violet-50 border-violet-200' },
  completed: { label: 'Completed', color: 'text-slate-700', icon: CheckCircle, bg: 'bg-slate-100' },
  cancelled: { label: 'Cancelled', color: 'text-rose-700', icon: XCircle, bg: 'bg-rose-50 border-rose-200' },
  rejected: { label: 'Rejected', color: 'text-rose-700', icon: XCircle, bg: 'bg-rose-50 border-rose-200' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'Birthday',
  marriage: 'Marriage / Reception',
  party: 'Party / Event',
  corporate: 'Corporate',
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600' },
  advance_paid: { label: 'Advance Paid', color: 'text-blue-600' },
  paid: { label: 'Fully Paid', color: 'text-emerald-600' },
  refunded: { label: 'Refunded', color: 'text-slate-600' },
};

interface OrderReviewCardProps {
  order: Order;
  onAccept: (orderId: string, notes?: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  onModifyQuote: (orderId: string, amount: number, notes: string) => Promise<void>;
  onCallClient: (phone: string) => void;
  onOpenMap: (lat: number, lng: number, label: string) => void;
  onOpenWhatsApp: (phone: string, message: string) => void;
  className?: string;
}

export function OrderReviewCard({
  order,
  onAccept,
  onReject,
  onModifyQuote,
  onCallClient,
  onOpenMap,
  onOpenWhatsApp,
  className = '',
}: OrderReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | 'quote' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [quoteAmount, setQuoteAmount] = useState<string>(order.quoted_amount?.toString() || order.estimated_amount?.toString() || '');
  const [quoteNotes, setQuoteNotes] = useState('');

  const statusConfig = STATUS_CONFIG[order.status];
  const paymentStatus = PAYMENT_STATUS_LABELS[order.payment_status] || { label: order.payment_status, color: 'text-slate-600' };
  const eventDate = new Date(order.event_date);
  const isUpcoming = eventDate > new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // ===== ACTION HANDLERS =====
  const handleAccept = useCallback(async () => {
    setActionLoading('accept');
    try {
      await onAccept(order.id, quoteNotes || undefined);
    } finally {
      setActionLoading(null);
    }
  }, [order.id, onAccept, quoteNotes]);

  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) return;
    setActionLoading('reject');
    try {
      await onReject(order.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  }, [order.id, onReject, rejectReason]);

  const handleSendQuote = useCallback(async () => {
    if (!quoteAmount || Number(quoteAmount) <= 0) return;
    setActionLoading('quote');
    try {
      await onModifyQuote(order.id, Number(quoteAmount), quoteNotes);
      setShowQuoteModal(false);
    } finally {
      setActionLoading(null);
    }
  }, [order.id, onModifyQuote, quoteAmount, quoteNotes]);

  // ===== RENDER =====
  return (
    <div className={cn('relative border rounded-2xl transition-all hover:shadow-lg', statusConfig.bg, 'border-slate-200', className)}>
      {/* Status Badge */}
      <div className="absolute -top-3 -right-3 z-10">
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', statusConfig.color, statusConfig.bg.replace('bg-', 'bg-').replace('border-', ''), 'shadow-sm')}>
          {statusConfig.icon && <statusConfig.icon className="w-3 h-3" />}
          {statusConfig.label}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-sm text-slate-600 mb-1">
              <span className="font-mono text-silver-600">{order.order_number}</span>
              <span className="text-slate-300">•</span>
              <span className="capitalize">{order.source}</span>
              <span className="text-slate-300">•</span>
              <time dateTime={order.created_at}>
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </time>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 truncate">
              {EVENT_TYPE_LABELS[order.event_type] || order.event_type}
              {order.event_subtype && <span className="text-slate-500 font-normal ml-2">— {order.event_subtype}</span>}
            </h3>
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg className={cn('w-5 h-5 transition-transform', isExpanded && 'rotate-180')}>
              <path stroke="currentColor" strokeWidth="2" d="M6 9l6 6 6-6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="Event Date" value={format(eventDate, 'MMM d, yyyy')} highlight={isUpcoming && daysUntil <= 7} />
          <InfoItem icon={<Clock className="w-4 h-4" />} label="Setup By" value={order.setup_complete_by} />
          <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Estimated" value={order.estimated_amount ? `₹${order.estimated_amount.toLocaleString()}` : '—'} />
          <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Quoted" value={order.quoted_amount ? `₹${order.quoted_amount.toLocaleString()}` : '—'} />
        </div>

        {/* Payment Status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 border border-slate-200">
          <span className="text-xs font-medium text-slate-500">Payment:</span>
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', paymentStatus.color, 'bg-opacity-10')}>
            {paymentStatus.label}
          </span>
          {order.advance_paid > 0 && (
            <span className="ml-auto text-sm font-semibold text-silver-600">Advance: ₹{order.advance_paid.toLocaleString()}</span>
          )}
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-slate-200 pt-4 space-y-4 animate-slide-down">
            {/* Venue & Location */}
            <DetailSection title="Venue & Location" icon={MapPin}>
              <div className="space-y-2">
                <DetailRow label="Venue" value={order.venue_name} />
                <DetailRow label="Address" value={`${order.address_line1}, ${order.city} - ${order.pincode}`} />
                {(order.latitude && order.longitude) && (
                  <button
                    onClick={() => onOpenMap(order.latitude!, order.longitude!, order.venue_name)}
                    className="inline-flex items-center gap-1.5 text-sm text-silver-600 hover:text-silver-700 font-medium"
                  >
                    <Map className="w-4 h-4" />
                    Open in Maps
                  </button>
                )}
              </div>
            </DetailSection>

            {/* Client Contact */}
            <DetailSection title="Client Contact" icon={Phone}>
              <div className="space-y-2">
                <DetailRow label="Name" value={order.contact_name} />
                <DetailRow label="Phone" value={order.contact_phone} action={
                  <button
                    onClick={() => onCallClient(order.contact_phone)}
                    className="text-sm text-silver-600 hover:underline"
                  >
                    Call
                  </button>
                } />
                {order.contact_email && <DetailRow label="Email" value={order.contact_email} />}
                <button
                  onClick={() => onOpenWhatsApp(order.contact_phone, `Hi ${order.contact_name}, this is Mr Balloon regarding your order ${order.order_number}.`)}
                  className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </DetailSection>

            {/* Event Schedule */}
            <DetailSection title="Event Schedule" icon={Calendar}>
              <div className="grid gap-2 sm:grid-cols-3">
                <DetailRow label="Event Date" value={format(eventDate, 'EEEE, MMMM d, yyyy')} />
                <DetailRow label="Setup Complete By" value={order.setup_complete_by} />
                {order.dismantle_time && <DetailRow label="Dismantle Time" value={order.dismantle_time} />}
              </div>
            </DetailSection>

            {/* Package & Requirements */}
            {(order.package_id || order.custom_requirements || order.reference_images.length > 0) && (
              <DetailSection title="Package & Requirements" icon={DollarSign}>
                <div className="space-y-2">
                  {order.package_id && <DetailRow label="Package" value={order.package_id} />}
                  {order.custom_requirements && <DetailRow label="Custom Notes" value={order.custom_requirements} multiline />}
                  {order.reference_images.length > 0 && (
                    <div>
                      <span className="text-sm text-slate-500">Reference Images:</span>
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                        {order.reference_images.map((img, i) => (
                          <img key={i} src={img} alt={`Reference ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DetailSection>
            )}

            {/* Owner Notes */}
            {order.owner_notes && (
              <DetailSection title="Owner Notes" icon={Bell}>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{order.owner_notes}</p>
              </DetailSection>
            )}

            {/* Rejection Reason */}
            {order.rejection_reason && (
              <DetailSection title="Rejection Reason" icon={XCircle}>
                <p className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl">{order.rejection_reason}</p>
              </DetailSection>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <ActionBar
          status={order.status}
          isLoading={actionLoading}
          onAccept={handleAccept}
          onReject={() => setShowRejectModal(true)}
          onQuote={() => setShowQuoteModal(true)}
          canAccept={['submitted', 'quoted'].includes(order.status)}
          canReject={['submitted', 'quoted'].includes(order.status)}
          canQuote={['submitted'].includes(order.status)}
        />
      </div>

      {/* Modals */}
      {showRejectModal && (
        <RejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          reason={rejectReason}
          setReason={setRejectReason}
          loading={actionLoading === 'reject'}
        />
      )}

      {showQuoteModal && (
        <QuoteModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          onConfirm={handleSendQuote}
          amount={quoteAmount}
          setAmount={setQuoteAmount}
          notes={quoteNotes}
          setNotes={setQuoteNotes}
          loading={actionLoading === 'quote'}
          estimated={order.estimated_amount}
        />
      )}
    </div>
  );
}

// ===== SUB-COMPONENTS =====

function InfoItem({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('p-3 rounded-xl bg-white/50 border', highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200')}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div className="font-medium text-slate-900 truncate">{value}</div>
    </div>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode | React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  const isComponent = typeof icon === 'function';
  const IconComponent = isComponent ? icon as React.ComponentType<{ className?: string }> : null;
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-silver-500">
          {isComponent && IconComponent ? <IconComponent className="w-4 h-4" /> : !isComponent ? icon : null}
        </span>
        {title}
      </h4>
      <div className="ml-6 space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, multiline, action }: { label: string; value: string; multiline?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-sm text-slate-500 w-32 sm:w-auto shrink-0">{label}</span>
      <span className={cn('text-sm text-slate-900', multiline ? 'whitespace-pre-wrap' : 'truncate')}>{value}</span>
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}

function ActionBar({
  status,
  isLoading,
  onAccept,
  onReject,
  onQuote,
  canAccept,
  canReject,
  canQuote,
}: {
  status: Order['status'];
  isLoading: string | null;
  onAccept: () => void;
  onReject: () => void;
  onQuote: () => void;
  canAccept: boolean;
  canReject: boolean;
  canQuote: boolean;
}) {
  if (['accepted', 'confirmed', 'in_progress', 'completed'].includes(status)) {
    return (
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Order confirmed. Awaiting event date.</span>
        </div>
      </div>
    );
  }

  if (['cancelled', 'rejected'].includes(status)) {
    return (
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center gap-3 text-sm text-rose-700 bg-rose-50 p-3 rounded-xl">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>This order has been {status === 'rejected' ? 'rejected' : 'cancelled'}.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
      {canAccept && (
        <Button
          onClick={onAccept}
          disabled={isLoading === 'accept'}
          className="flex-1 sm:flex-none"
        >
          {isLoading === 'accept' ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</span>
          ) : (
            'Accept Order'
          )}
        </Button>
      )}
      {canQuote && (
        <Button
          variant="secondary"
          onClick={onQuote}
          disabled={isLoading === 'quote'}
          className="flex-1 sm:flex-none"
        >
          {isLoading === 'quote' ? 'Sending...' : 'Modify Quote'}
        </Button>
      )}
      {canReject && (
        <Button
          variant="danger"
          onClick={onReject}
          disabled={isLoading === 'reject'}
          className="flex-1 sm:flex-none"
        >
          {isLoading === 'reject' ? 'Rejecting...' : 'Decline'}
        </Button>
      )}
    </div>
  );
}

function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  reason,
  setReason,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reason: string;
  setReason: (v: string) => void;
  loading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Decline Order</DialogTitle>
          <DialogDescription>Please provide a reason for declining this order. The client will be notified.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g., Unavailable on this date, venue too far, fully booked..."
          className="mt-4"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={!reason.trim() || loading}>
            {loading ? 'Declining...' : 'Decline Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuoteModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  setAmount,
  notes,
  setNotes,
  loading,
  estimated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: string;
  setAmount: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  loading: boolean;
  estimated?: number | null;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Send Custom Quote</DialogTitle>
          <DialogDescription>Enter the quoted amount and any notes for the client.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {estimated && (
            <div className="bg-slate-50 p-3 rounded-xl text-sm">
              <span className="text-slate-500">Estimated: </span>
              <span className="font-semibold text-slate-900">₹{Number(estimated).toLocaleString()}</span>
            </div>
          )}
          <Input
            label="Quoted Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="100"
            placeholder="Enter amount"
          />
          <Textarea
            label="Notes for Client (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Includes custom backdrop, LED lights, and same-day setup..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!amount || Number(amount) <= 0 || loading}>
            {loading ? 'Sending...' : 'Send Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}