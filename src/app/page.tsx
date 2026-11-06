'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Truck, Star, Heart, Calendar, MapPin, Phone, MessageSquare } from 'lucide-react';
import { BalloonBackground } from '@/components/ui';
import { Button } from '@/components/ui';
import { BookingForm } from '@/components/booking/BookingForm';

const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday', icon: '🎂', href: '/explore?category=birthday' },
  { value: 'marriage', label: 'Marriage / Reception', icon: '💍', href: '/explore?category=marriage' },
  { value: 'party', label: 'Party / Event', icon: '🎉', href: '/explore?category=party' },
  { value: 'corporate', label: 'Corporate', icon: '🏢', href: '/explore?category=corporate' },
];

const FEATURES = [
  { icon: Sparkles, title: 'Custom Designs', description: 'Unique balloon art tailored to your vision and theme' },
  { icon: Shield, title: 'Quality Guaranteed', description: 'Premium materials and professional installation' },
  { icon: Truck, title: 'On-Time Delivery', description: 'Setup completed well before your event starts' },
  { icon: Star, title: 'Transparent Pricing', description: 'No hidden costs - what you see is what you pay' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', event: 'Anaya\'s 1st Birthday', text: 'The balloon arch was absolutely magical! It became the highlight of the entire party. Professional team and stunning work.', rating: 5 },
  { name: 'Rajesh & Meera', event: 'Wedding Reception', text: 'The stage backdrop with our initials was breathtaking. Our guests couldn\'t stop taking photos. Highly recommend!', rating: 5 },
  { name: 'Amit Patel', event: 'Corporate Diwali Event', text: 'Perfect brand integration with the balloon decor. The team understood our brief perfectly and delivered on time.', rating: 5 },
];

export default function HomePage() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Floating Balloons Background */}
      <BalloonBackground balloonCount={30} enableTouchBurst={true} enableFloat={true} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2" aria-label="Mr Balloon Home">
              <span className="text-3xl" aria-hidden="true">🎈</span>
              <span className="font-display font-bold text-xl text-slate-900 gradient-text">Mr Balloon</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/explore" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Explore</Link>
              <Link href="/portfolio" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Portfolio</Link>
              <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
              <Link href="/faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">FAQ</Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowBookingModal(true)}>
                Book Now
              </Button>
              <Button size="sm" onClick={() => setShowBookingModal(true)}>
                Get Quote
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-silver-100 text-silver-700 text-sm font-medium mb-6 animate-in">
              <Sparkles className="w-4 h-4" />
              Premium Balloon Decor & Stage Styling
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-slate-900 mb-6 leading-tight animate-in stagger-1">
              Transform Your Events into{' '}
              <span className="gradient-text">Unforgettable Memories</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto animate-in stagger-2">
              Custom balloon decorations and stage styling for birthdays, weddings, parties & corporate events. 
              Premium designs, transparent pricing, and seamless booking experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in stagger-3">
              <Button size="lg" onClick={() => setShowBookingModal(true)} className="w-full sm:w-auto">
                Start Your Booking
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Packages
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 animate-in stagger-4">
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-silver-600 gradient-text">500+</div>
                <div className="text-sm text-slate-500">Events Decorated</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-silver-600 gradient-text">98%</div>
                <div className="text-sm text-slate-500">Client Satisfaction</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-silver-600 gradient-text">24h</div>
                <div className="text-sm text-slate-500">Average Response</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl font-bold text-silver-600 gradient-text">50+</div>
                <div className="text-sm text-slate-500">Cities Served</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-subtle">
          <svg className="w-6 h-6 text-silver-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="event-types-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="event-types-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
              What are we celebrating?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose your event type to explore tailored decoration packages
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {EVENT_TYPES.map((type, index) => (
              <Link
                key={type.value}
                href={type.href}
                className="group glass-card-hover p-6 text-center aspect-square flex flex-col items-center justify-center gap-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-5xl group-hover:scale-110 transition-transform" aria-hidden="true">{type.icon}</span>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-silver-600 transition-colors">{type.label}</h3>
                <ArrowRight className="w-5 h-5 text-silver-400 group-hover:text-silver-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-50" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
              Why Choose Mr Balloon?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We make event decoration effortless with premium quality and exceptional service
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <div key={feature.title} className="glass-card p-6 text-center group" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-silver-100 to-slate-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-silver-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
              Loved by Our Clients
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real stories from celebrations we've had the honor to decorate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="glass-card p-6" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-medium text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="cta-heading">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card-metallic p-8 sm:p-12 rounded-3xl">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
              Ready to Create Magic?
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Let\'s bring your vision to life. Get a free quote or book your event decoration today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => setShowBookingModal(true)} className="w-full sm:w-auto">
                Get Your Free Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Packages First
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="text-3xl" aria-hidden="true">🎈</span>
                <span className="font-display font-bold text-xl text-slate-900 gradient-text">Mr Balloon</span>
              </Link>
              <p className="text-slate-600 max-w-sm mb-4">
                Premium balloon decor and stage styling for unforgettable celebrations. 
                Custom designs, transparent pricing, and seamless service.
              </p>
              <div className="flex gap-4">
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition-colors" aria-label="WhatsApp">
                  <MessageSquare className="w-6 h-6" />
                </a>
                <a href="tel:+919876543210" className="text-silver-600 hover:text-silver-700 transition-colors" aria-label="Call Us">
                  <Phone className="w-6 h-6" />
                </a>
                <a href="mailto:hello@mrballoon.in" className="text-slate-600 hover:text-slate-700 transition-colors" aria-label="Email Us">
                  <MessageSquare className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Quick Links</h4>
              <nav className="space-y-2">
                <Link href="/explore" className="block text-sm text-slate-600 hover:text-slate-900">Explore Packages</Link>
                <Link href="/portfolio" className="block text-sm text-slate-600 hover:text-slate-900">Portfolio</Link>
                <Link href="/pricing" className="block text-sm text-slate-600 hover:text-slate-900">Pricing</Link>
                <Link href="/faq" className="block text-sm text-slate-600 hover:text-slate-900">FAQ</Link>
              </nav>
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Contact</h4>
              <address className="text-sm text-slate-600 not-italic space-y-2">
                <p>Mumbai, Maharashtra</p>
                <p><a href="tel:+919876543210" className="hover:text-slate-900">+91 98765 43210</a></p>
                <p><a href="mailto:hello@mrballoon.in" className="hover:text-slate-900">hello@mrballoon.in</a></p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">© 2024 Mr Balloon. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-slate-900">Start Your Booking</h2>
              <button onClick={() => setShowBookingModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <BookingForm 
                onSubmit={async (data) => {
                  try {
                    const response = await fetch('/api/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    const result = await response.json();
                    if (!result.success) throw new Error(result.message || 'Failed to submit');
                  } catch (error) {
                    console.error('Booking failed:', error);
                    throw error;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}