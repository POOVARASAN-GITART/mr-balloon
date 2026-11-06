-- ============================================
-- MR BALLOON - INITIAL DATABASE SCHEMA
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'owner', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    fcm_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================
-- CATALOG PACKAGES (Decoration Offerings)
-- ============================================
CREATE TABLE catalog_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('birthday', 'marriage', 'party', 'corporate')),
    sub_category VARCHAR(50),
    base_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    description TEXT,
    features JSONB,
    images TEXT[],
    gallery_images TEXT[],
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_catalog_category ON catalog_packages(category, is_active);
CREATE INDEX idx_catalog_slug ON catalog_packages(slug);
CREATE INDEX idx_catalog_popular ON catalog_packages(is_popular) WHERE is_popular = TRUE;

-- ============================================
-- PORTFOLIO / PAST WORK
-- ============================================
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150),
    event_type VARCHAR(30) CHECK (event_type IN ('birthday', 'marriage', 'party', 'corporate')),
    package_id UUID REFERENCES catalog_packages(id),
    images TEXT[] NOT NULL,
    venue_name VARCHAR(200),
    location_city VARCHAR(100),
    event_date DATE,
    client_testimonial TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_event_type ON portfolio_items(event_type);
CREATE INDEX idx_portfolio_featured ON portfolio_items(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_portfolio_city ON portfolio_items(location_city);

-- ============================================
-- ORDERS / BOOKINGS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Event Details
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('birthday', 'marriage', 'party', 'corporate')),
    event_subtype VARCHAR(50),
    
    -- Venue & Location
    venue_name VARCHAR(200),
    address_line1 VARCHAR(300) NOT NULL,
    address_line2 VARCHAR(300),
    landmark VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    place_id VARCHAR(255),
    
    -- Contact
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    alternate_phone VARCHAR(20),
    
    -- Schedule
    event_date DATE NOT NULL,
    setup_start_time TIMESTAMPTZ,
    setup_complete_by TIMESTAMPTZ NOT NULL,
    dismantle_time TIMESTAMPTZ,
    
    -- Package & Pricing
    package_id UUID REFERENCES catalog_packages(id),
    custom_requirements TEXT,
    reference_images TEXT[],
    estimated_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    advance_paid DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'advance_paid', 'paid', 'refunded')),
    
    -- Status Workflow
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
        'draft',
        'submitted',
        'quoted',
        'accepted',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'rejected'
    )),
    
    -- Owner Actions
    owner_id UUID REFERENCES users(id),
    owner_notes TEXT,
    quoted_amount DECIMAL(10,2),
    quote_sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    source VARCHAR(20) DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'whatsapp', 'call')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_event_date ON orders(event_date);
CREATE INDEX idx_orders_owner_id ON orders(owner_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_contact_phone ON orders(contact_phone);
CREATE INDEX idx_orders_city ON orders(city);
CREATE INDEX idx_orders_package_id ON orders(package_id);

-- Partial indexes for common queries
CREATE INDEX idx_orders_pending ON orders(created_at DESC) WHERE status IN ('submitted', 'quoted');
CREATE INDEX idx_orders_upcoming ON orders(event_date) WHERE status IN ('accepted', 'confirmed', 'in_progress') AND event_date >= CURRENT_DATE;

-- ============================================
-- ORDER STATUS HISTORY (Audit Trail)
-- ============================================
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_history_created_at ON order_status_history(created_at DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    channels JSONB DEFAULT '["in_app"]',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_order_id ON notifications(order_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_type VARCHAR(20) CHECK (payment_type IN ('advance', 'full', 'refund')),
    gateway VARCHAR(30) CHECK (gateway IN ('razorpay', 'stripe', 'phonepe', 'cash', 'upi')),
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway_order_id ON payments(gateway_order_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Owners/Admins can view all users
CREATE POLICY "Owners can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Catalog packages: Public read for active packages
CREATE POLICY "Public can view active packages" ON catalog_packages
    FOR SELECT USING (is_active = TRUE);

-- Owners/Admins can manage packages
CREATE POLICY "Owners can manage packages" ON catalog_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Portfolio: Public read
CREATE POLICY "Public can view portfolio" ON portfolio_items
    FOR SELECT USING (TRUE);

-- Owners/Admins can manage portfolio
CREATE POLICY "Owners can manage portfolio" ON portfolio_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders (draft or submitted)
CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own draft orders
CREATE POLICY "Users can update own draft orders" ON orders
    FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

-- Owners/Admins can view and manage all orders
CREATE POLICY "Owners can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can update all orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Order status history: Users can view history for their orders
CREATE POLICY "Users can view own order history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
        )
    );

-- Owners/Admins can view all history
CREATE POLICY "Owners can view all order history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Owners/Admins can view all notifications
CREATE POLICY "Owners can view all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
        )
    );

-- Owners/Admins can view all payments
CREATE POLICY "Owners can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_packages_updated_at BEFORE UPDATE ON catalog_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER FOR ORDER STATUS HISTORY
-- ============================================
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, notes)
        VALUES (NEW.id, OLD.status, NEW.status, 
            COALESCE(NEW.owner_id, NEW.user_id),
            CASE 
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                WHEN NEW.status = 'accepted' THEN NEW.owner_notes
                ELSE NULL
            END
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_log_order_status_change
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get order with user details
CREATE OR REPLACE FUNCTION get_order_with_details(order_id UUID)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR,
    user_name VARCHAR,
    user_phone VARCHAR,
    user_email VARCHAR,
    event_type VARCHAR,
    event_subtype VARCHAR,
    venue_name VARCHAR,
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    landmark VARCHAR,
    city VARCHAR,
    state VARCHAR,
    pincode VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    contact_name VARCHAR,
    contact_phone VARCHAR,
    contact_email VARCHAR,
    event_date DATE,
    setup_complete_by TIMESTAMPTZ,
    dismantle_time TIMESTAMPTZ,
    package_title VARCHAR,
    package_price DECIMAL,
    custom_requirements TEXT,
    reference_images TEXT[],
    estimated_amount DECIMAL,
    final_amount DECIMAL,
    advance_paid DECIMAL,
    payment_status VARCHAR,
    status VARCHAR,
    owner_notes TEXT,
    quoted_amount DECIMAL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        u.name as user_name,
        u.phone as user_phone,
        u.email as user_email,
        o.event_type,
        o.event_subtype,
        o.venue_name,
        o.address_line1,
        o.address_line2,
        o.landmark,
        o.city,
        o.state,
        o.pincode,
        o.latitude,
        o.longitude,
        o.contact_name,
        o.contact_phone,
        o.contact_email,
        o.event_date,
        o.setup_complete_by,
        o.dismantle_time,
        cp.title as package_title,
        COALESCE(cp.discounted_price, cp.base_price) as package_price,
        o.custom_requirements,
        o.reference_images,
        o.estimated_amount,
        o.final_amount,
        o.advance_paid,
        o.payment_status,
        o.status,
        o.owner_notes,
        o.quoted_amount,
        o.rejection_reason,
        o.created_at,
        o.updated_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN catalog_packages cp ON o.package_id = cp.id
    WHERE o.id = order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming orders for dashboard
CREATE OR REPLACE FUNCTION get_upcoming_orders(limit_count INT DEFAULT 10)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR,
    event_type VARCHAR,
    event_date DATE,
    venue_name VARCHAR,
    city VARCHAR,
    contact_name VARCHAR,
    contact_phone VARCHAR,
    status VARCHAR,
    quoted_amount DECIMAL,
    advance_paid DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.event_type,
        o.event_date,
        o.venue_name,
        o.city,
        o.contact_name,
        o.contact_phone,
        o.status,
        o.quoted_amount,
        o.advance_paid
    FROM orders o
    WHERE o.status IN ('accepted', 'confirmed', 'in_progress')
    AND o.event_date >= CURRENT_DATE
    ORDER BY o.event_date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (Optional - for development)
-- ============================================

-- Insert sample catalog packages
INSERT INTO catalog_packages (title, slug, category, sub_category, base_price, discounted_price, description, features, images, is_popular, sort_order) VALUES
('Classic Balloon Arch', 'classic-balloon-arch', 'birthday', 'arch', 15000, 12000, 'Elegant balloon arch perfect for birthday entrances', '["5ft Arch", "2 Colors", "Setup Included", "Same Day Removal"]', ARRAY['/packages/arch-classic.jpg'], TRUE, 1),
('Premium Stage Backdrop', 'premium-stage-backdrop', 'marriage', 'backdrop', 45000, 38000, 'Luxurious stage backdrop with LED lighting and custom name', '["12x8ft Backdrop", "LED Lights", "Custom Name/Initials", "Flower Accents", "Setup & Removal"]', ARRAY['/packages/backdrop-premium.jpg'], TRUE, 2),
('Full Venue Decor Package', 'full-venue-decor', 'marriage', 'full_stage', 120000, 99000, 'Complete venue transformation including entrance, stage, and tables', '["Entrance Arch", "Stage Backdrop", "Table Centerpieces", "Photo Zone", "Ceiling Decor", "Lighting", "Full Setup & Removal"]', ARRAY['/packages/full-decor.jpg'], TRUE, 3),
('Party Balloon Bundle', 'party-balloon-bundle', 'party', 'bundle', 25000, 20000, 'Fun balloon arrangements for parties and celebrations', '["Balloon Garland", "Confetti Balloons", "Number Balloons", "Table Clusters", "Setup Included"]', ARRAY['/packages/party-bundle.jpg'], FALSE, 4),
('Corporate Branding Decor', 'corporate-branding-decor', 'corporate', 'branding', 35000, 30000, 'Professional balloon decor with company branding', '["Logo Balloons", "Brand Colors", "Entrance Arch", "Stage Branding", "Setup & Removal"]', ARRAY['/packages/corporate-branding.jpg'], FALSE, 5);

-- Insert sample portfolio items
INSERT INTO portfolio_items (title, event_type, package_id, images, venue_name, location_city, event_date, client_testimonial, is_featured) VALUES
('Anaya''s 1st Birthday', 'birthday', (SELECT id FROM catalog_packages WHERE slug = 'classic-balloon-arch'), ARRAY['/portfolio/anaya-birthday-1.jpg', '/portfolio/anaya-birthday-2.jpg'], 'Grand Ballroom, Taj Lands End', 'Mumbai', '2024-01-15', 'Absolutely magical! The arch was the highlight of the party.', TRUE),
('Sharma Wedding Reception', 'marriage', (SELECT id FROM catalog_packages WHERE slug = 'premium-stage-backdrop'), ARRAY['/portfolio/sharma-wedding-1.jpg', '/portfolio/sharma-wedding-2.jpg', '/portfolio/sharma-wedding-3.jpg'], 'ITC Maratha', 'Mumbai', '2024-02-20', 'The backdrop with our initials was stunning. Highly recommend!', TRUE),
('Diwali Corporate Event', 'corporate', (SELECT id FROM catalog_packages WHERE slug = 'corporate-branding-decor'), ARRAY['/portfolio/diwali-corporate-1.jpg'], 'Jio World Convention Centre', 'Mumbai', '2023-11-10', 'Professional team, perfect brand integration.', TRUE),
('Meera''s Baby Shower', 'party', (SELECT id FROM catalog_packages WHERE slug = 'party-balloon-bundle'), ARRAY['/portfolio/meera-babyshower-1.jpg', '/portfolio/meera-babyshower-2.jpg'], 'Private Residence', 'Pune', '2024-03-05', 'So beautiful and affordable. The team was so sweet!', FALSE);