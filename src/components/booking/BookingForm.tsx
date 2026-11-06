'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm, Controller, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Calendar, Clock, Phone, Upload, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { Button, Input, Textarea, SelectField } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { BookingFormData } from '@/types/database';

// Google Maps namespace declaration
declare global {
  interface Window {
    google: typeof google;
  }
  namespace google {
    namespace maps {
      namespace places {
        class Autocomplete {
          constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
          addListener(eventName: string, handler: () => void): void;
          getPlace(): PlaceResult;
          unbindAll(): void;
        }
        interface AutocompleteOptions {
          types?: string[];
          componentRestrictions?: { country: string };
          fields?: string[];
        }
        interface PlaceResult {
          place_id?: string;
          geometry?: { location?: { lat: () => number; lng: () => number } };
          formatted_address?: string;
          address_components?: Array<{ types: string[]; long_name: string }>;
          name?: string;
        }
      }
    }
  }
}

// ===== VALIDATION SCHEMA =====
const bookingSchema = z.object({
  eventType: z.enum(['birthday', 'marriage', 'party', 'corporate'], {
    required_error: 'Please select an event type',
  }),
  eventSubtype: z.string().optional(),
  venueName: z.string().min(2, 'Venue name is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  contactName: z.string().min(2, 'Contact name required'),
  contactPhone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/, 'Valid phone number required'),
  contactEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  alternatePhone: z.string().optional(),
  eventDate: z.string().min(1, 'Event date is required').refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  setupCompleteBy: z.string().min(4, 'Setup deadline required'),
  dismantleTime: z.string().optional(),
  packageId: z.string().uuid().optional(),
  customRequirements: z.string().max(2000).optional(),
  referenceImages: z.array(z.string().url()).max(5).optional(),
  budgetRange: z.enum(['under_25k', '25k_50k', '50k_1l', '1l_plus', 'custom']).optional(),
});

// ===== EVENT TYPE PILLS =====
const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday', icon: '🎂', color: 'from-pink-400 to-rose-500' },
  { value: 'marriage', label: 'Marriage / Reception', icon: '💍', color: 'from-amber-400 to-orange-500' },
  { value: 'party', label: 'Party / Event', icon: '🎉', color: 'from-violet-400 to-purple-500' },
  { value: 'corporate', label: 'Corporate', icon: '🏢', color: 'from-blue-400 to-cyan-500' },
] as const;

const EVENT_SUBTYPES: Record<string, string[]> = {
  birthday: ['1st Birthday', 'Kids Birthday', 'Milestone (18th, 21st, 50th)', 'Surprise Party'],
  marriage: ['Wedding Reception', 'Engagement', 'Mehndi / Sangeet', 'Haldi', 'Bridal Shower'],
  party: ['Anniversary', 'Baby Shower', 'Gender Reveal', 'Farewell', 'Housewarming', 'Festival'],
  corporate: ['Product Launch', 'Annual Day', 'Conference', 'Team Building', 'Awards Night'],
};

const BUDGET_OPTIONS = [
  { value: 'under_25k', label: 'Under ₹25,000' },
  { value: '25k_50k', label: '₹25,000 - ₹50,000' },
  { value: '50k_1l', label: '₹50,000 - ₹1,00,000' },
  { value: '1l_plus', label: '₹1,00,000+' },
  { value: 'custom', label: 'Custom Budget' },
];

// ===== STEP INDICATOR =====
function StepIndicator({ currentStep, totalSteps = 4 }: { currentStep: number; totalSteps?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              step < currentStep
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                : step === currentStep
                ? 'bg-gradient-to-br from-silver-300 to-slate-500 text-slate-900 ring-2 ring-silver-300 scale-110'
                : 'bg-slate-200 text-slate-400'
            )}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                'w-16 h-1 rounded transition-colors',
                step < currentStep ? 'bg-emerald-400' : 'bg-slate-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ===== MAIN BOOKING FORM =====
interface BookingFormProps {
  initialData?: Partial<BookingFormData>;
  onSubmit: (data: BookingFormData) => Promise<void>;
  className?: string;
}

export function BookingForm({ initialData, onSubmit, className = '' }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const mapRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      eventType: 'birthday',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
      setupCompleteBy: '10:00',
      ...initialData,
    },
    mode: 'onChange',
  });

  const watchedEventType = watch('eventType');
  const subtypes = EVENT_SUBTYPES[watchedEventType] || [];

  // ===== MAP INITIALIZATION =====
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined' || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(mapRef.current, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'in' },
      fields: ['place_id', 'geometry', 'formatted_address', 'address_components', 'name'],
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.place_id) return;

      const addressComponents = place.address_components || [];
      const getComponent = (type: string) =>
        addressComponents.find((c) => c.types.includes(type))?.long_name || '';

      setValue('placeId', place.place_id, { shouldValidate: true });
      setValue('latitude', place.geometry.location?.lat(), { shouldValidate: true });
      setValue('longitude', place.geometry.location?.lng(), { shouldValidate: true });
      setValue('venueName', place.name || '', { shouldValidate: true });
      setValue('addressLine1', place.formatted_address || '', { shouldValidate: true });
      setValue('city', getComponent('locality') || getComponent('administrative_area_level_2') || '', { shouldValidate: true });
      setValue('state', getComponent('administrative_area_level_1') || '', { shouldValidate: true });
      setValue('pincode', getComponent('postal_code') || '', { shouldValidate: true });

      trigger(['venueName', 'addressLine1', 'city', 'pincode']);
    });

    setMapLoaded(true);
    return () => autocomplete.unbindAll();
  }, [setValue, trigger]);

  // ===== STEP NAVIGATION =====
  const nextStep = useCallback(async () => {
    const stepFields: Record<number, (keyof BookingFormData)[]> = {
      1: ['eventType'],
      2: ['venueName', 'addressLine1', 'city', 'pincode', 'contactName', 'contactPhone'],
      3: ['eventDate', 'setupCompleteBy'],
    };

    const valid = await trigger(stepFields[currentStep] || []);
    if (valid && currentStep < 4) setCurrentStep((s) => s + 1);
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => setCurrentStep((s) => Math.max(1, s - 1)), []);

  // ===== FORM SUBMISSION =====
  const onFormSubmit = handleSubmit(async (data) => {
    const payload: BookingFormData = {
      ...data,
      referenceImages: data.referenceImages || [],
    } as BookingFormData;
    await onSubmit(payload);
    setShowSuccess(true);
  });

  // ===== SUCCESS SCREEN =====
  if (showSuccess) {
    return (
      <div className="text-center py-12 animate-in">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Request Sent!</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          We've received your booking request. Our team will review and confirm within 30-60 minutes.
          You'll receive a WhatsApp/SMS confirmation shortly.
        </p>
        <Button variant="outline" onClick={() => { setShowSuccess(false); setCurrentStep(1); }}>
          Book Another Event
        </Button>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <form onSubmit={onFormSubmit} className={cn('space-y-6', className)} noValidate>
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Event Type */}
      {currentStep === 1 && (
        <fieldset className="space-y-6" aria-labelledby="step1-title">
          <legend id="step1-title" className="sr-only">Step 1: Event Type</legend>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              What are we celebrating? <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Event type">
              {EVENT_TYPES.map((type) => (
                <Controller
                  key={type.value}
                  name="eventType"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={value === type.value}
                      onClick={() => onChange(type.value)}
                      className={cn(
                        'relative p-4 rounded-2xl border-2 transition-all min-h-[120px] flex flex-col items-center justify-center gap-3',
                        value === type.value
                          ? 'border-silver-400 bg-gradient-to-br from-silver-50 to-white ring-2 ring-silver-300/50 shadow-lg'
                          : 'border-slate-200 hover:border-silver-300 hover:bg-slate-50'
                      )}
                    >
                      <span className="text-4xl" aria-hidden="true">{type.icon}</span>
                      <span className="font-medium text-slate-900 text-center">{type.label}</span>
                      {value === type.value && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-silver-400 to-slate-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  )}
                />
              ))}
            </div>
            {errors.eventType && (
              <p className="mt-2 text-sm text-rose-500" role="alert">{errors.eventType.message}</p>
            )}
          </div>

          {watchedEventType && subtypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Occasion Type
              </label>
              <SelectField
                placeholder="Select occasion type"
                options={subtypes.map((st) => ({ value: st, label: st }))}
                value={watch('eventSubtype') || ''}
                onValueChange={(v) => setValue('eventSubtype', v)}
                error={errors.eventSubtype?.message}
              />
              {errors.eventSubtype && <p className="mt-1 text-sm text-rose-500">{errors.eventSubtype.message}</p>}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="button" onClick={nextStep} className="w-full sm:w-auto">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </fieldset>
      )}

      {/* Step 2: Venue & Contact */}
      {currentStep === 2 && (
        <fieldset className="space-y-6" aria-labelledby="step2-title">
          <legend id="step2-title" className="sr-only">Step 2: Venue & Contact Details</legend>

          {/* Map Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-silver-500" />
              Venue Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={mapRef}
                type="text"
                placeholder="Search venue name or address (e.g., Taj Lands End, Mumbai)"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-silver-400 focus:border-transparent transition-all pl-10',
                  !mapLoaded && 'cursor-wait'
                )}
                disabled={!mapLoaded}
                aria-describedby="map-hint"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-silver-500" />
                </div>
              )}
            </div>
            <p id="map-hint" className="mt-2 text-xs text-slate-500">Powered by Google Maps. Start typing to search venues.</p>
          </div>

          {/* Address Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Venue Name"
              name="venueName"
              register={register}
              error={errors.venueName}
              placeholder="e.g., Grand Ballroom, Taj Lands End"
              required
            />
            <Input
              label="PIN Code"
              name="pincode"
              register={register}
              error={errors.pincode}
              placeholder="400001"
              maxLength={6}
              inputMode="numeric"
              required
            />
          </div>

          <Textarea
            label="Full Address"
            name="addressLine1"
            register={register}
            error={errors.addressLine1}
            placeholder="Building, Street, Area"
            required
            rows={2}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="City"
              name="city"
              register={register}
              error={errors.city}
              placeholder="Mumbai"
              required
            />
            <Input
              label="State"
              name="state"
              register={register}
              placeholder="Maharashtra"
            />
            <Input
              label="Landmark (Optional)"
              name="landmark"
              register={register}
              placeholder="Near Bandra Station"
            />
          </div>

          {/* Contact Information */}
          <div className="border-t border-slate-200 pt-6 mt-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-silver-500" />
              Contact Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact Person Name"
                name="contactName"
                register={register}
                error={errors.contactName}
                placeholder="Rahul Sharma"
                required
              />
              <Input
                label="Primary Phone"
                name="contactPhone"
                register={register}
                error={errors.contactPhone}
                placeholder="+91 98765 43210"
                type="tel"
                required
                inputMode="tel"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email (Optional)"
                name="contactEmail"
                register={register}
                error={errors.contactEmail}
                placeholder="rahul@example.com"
                type="email"
              />
              <Input
                label="Alternate Phone (Optional)"
                name="alternatePhone"
                register={register}
                placeholder="+91 98765 43211"
                type="tel"
                inputMode="tel"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={prevStep}>
              Back
            </Button>
            <Button type="button" onClick={nextStep}>
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </fieldset>
      )}

      {/* Step 3: Date & Package */}
      {currentStep === 3 && (
        <fieldset className="space-y-6" aria-labelledby="step3-title">
          <legend id="step3-title" className="sr-only">Step 3: Date, Time & Package</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-silver-500" />
                Event Date <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="eventDate"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-silver-400 focus:border-transparent transition-all"
                  />
                )}
              />
              {errors.eventDate && <p className="mt-1 text-sm text-rose-500">{errors.eventDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-silver-500" />
                Setup Complete By <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="setupCompleteBy"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    type="time"
                    {...field}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-silver-400 focus:border-transparent transition-all"
                  />
                )}
              />
              {errors.setupCompleteBy && <p className="mt-1 text-sm text-rose-500">{errors.setupCompleteBy.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-silver-500" />
              Dismantle Time (Optional)
            </label>
            <Controller
              name="dismantleTime"
              control={control}
              render={({ field }) => (
                <input
                  type="time"
                  {...field}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-silver-400 focus:border-transparent transition-all"
                />
              )}
            />
          </div>

          {/* Package Selection */}
          <div className="border-t border-slate-200 pt-6 mt-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a Package (Optional)</h3>
            <PackageSelector
              selectedId={selectedPackage}
              onSelect={setSelectedPackage}
              category={watchedEventType}
              register={register}
              control={control}
              name="packageId"
            />
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Budget Range (Optional)</label>
            <SelectField
              placeholder="Select budget range"
              options={BUDGET_OPTIONS}
              value={watch('budgetRange') || ''}
              onValueChange={(v) => setValue('budgetRange', v as any)}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={prevStep}>
              Back
            </Button>
            <Button type="button" onClick={nextStep}>
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </fieldset>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <fieldset className="space-y-6" aria-labelledby="step4-title">
          <legend id="step4-title" className="sr-only">Step 4: Review & Submit</legend>

          <OrderSummary data={watch()} />

          <div className="border-t border-slate-200 pt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 rounded border-slate-300 text-silver-500 focus:ring-silver-400"
              />
              <span className="text-sm text-slate-600">
                I agree to the <a href="/terms" className="text-silver-600 hover:underline">Terms & Conditions</a> and
                <a href="/privacy" className="text-silver-600 hover:underline">Privacy Policy</a>. I authorize Mr Balloon to contact me via SMS/WhatsApp/call regarding this booking.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  Place Order Request
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </fieldset>
      )}
    </form>
  );
}

// ===== HELPER COMPONENTS =====

function PackageSelector({
  selectedId,
  onSelect,
  category,
  register,
  control,
  name,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  category: string;
  register: any;
  control: any;
  name: string;
}) {
  // In production, fetch from API based on category
  const packages = [
    { id: '1', title: 'Classic Balloon Arch', price: 15000, image: '/packages/arch-classic.jpg', features: ['5ft Arch', '2 Colors', 'Setup Included'] },
    { id: '2', title: 'Premium Stage Backdrop', price: 45000, image: '/packages/backdrop-premium.jpg', features: ['12x8ft', 'LED Lights', 'Custom Name'] },
    { id: '3', title: 'Full Venue Decor', price: 120000, image: '/packages/full-decor.jpg', features: ['Entrance', 'Stage', 'Tables', 'Photo Zone'] },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {packages.map((pkg) => (
        <Controller
          key={pkg.id}
          name={name}
          control={control}
          render={({ field }) => (
            <label
              className={cn(
                'relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all',
                selectedId === pkg.id
                  ? 'border-silver-400 ring-2 ring-silver-300/50'
                  : 'border-slate-200 hover:border-silver-300'
              )}
            >
              <input
                type="radio"
                {...field}
                value={pkg.id}
                onChange={() => onSelect(pkg.id)}
                className="sr-only"
              />
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-silver-100 to-slate-100">
                  <span className="text-5xl">{pkg.title.includes('Arch') ? '🎈' : pkg.title.includes('Backdrop') ? '🎭' : '🎪'}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-slate-900">{pkg.title}</h4>
                <p className="text-2xl font-bold text-silver-600 mt-1">₹{pkg.price.toLocaleString()}</p>
                <ul className="mt-3 text-sm text-slate-600 space-y-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-silver-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedId === pkg.id && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-silver-400 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </label>
          )}
        />
      ))}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-silver-400 hover:text-silver-600 transition-all"
      >
        <span className="text-3xl">+</span>
        <span className="font-medium">Custom Quote</span>
        <span className="text-sm">Tell us your vision</span>
      </button>
    </div>
  );
}

function OrderSummary({ data }: { data: BookingFormData }) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-silver-100 text-silver-600 flex items-center justify-center text-sm font-bold">1</span>
        Order Summary
      </h3>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Event Type</dt>
          <dd className="font-medium text-slate-900 capitalize">{data.eventType}</dd>
        </div>
        {data.eventSubtype && (
          <div className="flex justify-between">
            <dt className="text-slate-500">Occasion</dt>
            <dd className="font-medium text-slate-900">{data.eventSubtype}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-slate-500">Date</dt>
          <dd className="font-medium text-slate-900">{data.eventDate ? formatDate(data.eventDate) : '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Setup By</dt>
          <dd className="font-medium text-slate-900">{data.setupCompleteBy}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Venue</dt>
          <dd className="font-medium text-slate-900 text-right max-w-[60%] truncate">
            {data.venueName}, {data.addressLine1}, {data.city} - {data.pincode}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Contact</dt>
          <dd className="font-medium text-slate-900">{data.contactName} - {data.contactPhone}</dd>
        </div>
        {data.packageId && (
          <div className="flex justify-between border-t border-slate-200 pt-3">
            <dt className="text-slate-500">Selected Package</dt>
            <dd className="font-medium text-slate-900">Package ID: {data.packageId}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// ===== TYPE DECLARATIONS =====
declare global {
  interface Window {
    google: typeof google;
  }
}