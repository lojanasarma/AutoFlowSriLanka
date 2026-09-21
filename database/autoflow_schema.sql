USE AutoFlowSriLanka_DB;
GO

-- PART B: SQL DDL IMPLEMENTATION
-- Database Design: AutoFlow Sri Lanka

-- 1. BASE SYSTEM TABLES (No Foreign Keys)
CREATE TABLE Role (
    role_id INT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Users (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

CREATE TABLE Template (
    template_id INT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE Centre (
    centre_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL
);

CREATE TABLE FuelStation (
    station_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL
);

-- 2. USER HIERARCHY & ROLES (Table-per-subclass mapping)
CREATE TABLE UserRole (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Role(role_id) ON DELETE CASCADE
);

CREATE TABLE Customer (
    customer_id INT PRIMARY KEY,
    loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0),
    FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    department VARCHAR(50) NOT NULL,
    FOREIGN KEY (staff_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Technician (
    tech_id INT PRIMARY KEY,
    skills VARCHAR(255),
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    FOREIGN KEY (tech_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
);

-- 3. AUDIT & NOTIFICATIONS
CREATE TABLE Notification (
    notif_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT NOT NULL,
    channel VARCHAR(20) CHECK (channel IN ('SMS', 'EMAIL', 'SYSTEM')),
    status VARCHAR(20) DEFAULT 'SENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (template_id) REFERENCES Template(template_id)
);

CREATE TABLE AuditLog (
    audit_id INT PRIMARY KEY,
    actor_id INT NOT NULL,
    entity VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES Users(user_id)
);

-- 4. VEHICLE MANAGEMENT
CREATE TABLE Vehicle (
    vehicle_id INT PRIMARY KEY,
    reg_no VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT CHECK (year >= 1900),
    fuel_type VARCHAR(20) CHECK (fuel_type IN ('Petrol', 'Diesel', 'Hybrid', 'EV')),
    engine_capacity INT CHECK (engine_capacity > 0),
    owner_id INT NOT NULL,
    insurance_expiry DATE NOT NULL,
    mileage INT CHECK (mileage >= 0),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (owner_id) REFERENCES Customer(customer_id)
);

CREATE TABLE VehicleDocument (
    doc_id INT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'VALID',
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE
);

-- 5. SERVICE BOOKING & SCHEDULE
CREATE TABLE Bay (
    bay_id INT PRIMARY KEY,
    centre_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    FOREIGN KEY (centre_id) REFERENCES Centre(centre_id) ON DELETE CASCADE
);

CREATE TABLE TimeSlot (
    slot_id INT PRIMARY KEY,
    centre_id INT NOT NULL,
    bay_id INT NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    FOREIGN KEY (centre_id) REFERENCES Centre(centre_id),
    FOREIGN KEY (bay_id) REFERENCES Bay(bay_id)
);

CREATE TABLE Booking (
    booking_id INT PRIMARY KEY,
    ref VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    centre_id INT NOT NULL,
    slot_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
    FOREIGN KEY (centre_id) REFERENCES Centre(centre_id),
    FOREIGN KEY (slot_id) REFERENCES TimeSlot(slot_id)
);

CREATE TABLE ServiceHistory (
    history_id INT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    booking_id INT NOT NULL,
    mileage INT CHECK (mileage >= 0),
    notes TEXT,
    completed_at DATETIME NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

CREATE TABLE WaitingList (
    wait_id INT PRIMARY KEY,
    booking_id INT NOT NULL,
    preferred_slot DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'WAITING',
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE
);

-- 6. FUEL LOGGING
CREATE TABLE FuelLog (
    log_id INT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    station_id INT NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10,2) CHECK (quantity > 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    odometer INT CHECK (odometer >= 0),
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'VERIFIED',
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
    FOREIGN KEY (station_id) REFERENCES FuelStation(station_id)
);

-- 7. FINANCIALS & PAYMENTS
CREATE TABLE Payment (
    payment_id INT PRIMARY KEY,
    booking_id INT NOT NULL,
    provider_ref VARCHAR(100) UNIQUE,
    method VARCHAR(50) CHECK (method IN ('CASH', 'CARD', 'BANK_TRANSFER')),
    amount DECIMAL(10,2) CHECK (amount >= 0),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
);

CREATE TABLE Invoice (
    invoice_id INT PRIMARY KEY,
    payment_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) CHECK (amount >= 0),
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ISSUED',
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id)
);

CREATE TABLE Refund (
    refund_id INT PRIMARY KEY,
    payment_id INT NOT NULL,
    amount DECIMAL(10,2) CHECK (amount >= 0),
    reason TEXT NOT NULL,
    decided_by INT NOT NULL,
    status VARCHAR(20) DEFAULT 'APPROVED',
    FOREIGN KEY (payment_id) REFERENCES Payment(payment_id),
    FOREIGN KEY (decided_by) REFERENCES Staff(staff_id)
);

-- PART C: INSERT SAMPLE DATA

-- 1. BASE SYSTEM TABLES
INSERT INTO Role (role_id, name) VALUES 
(1, 'System Admin'),
(2, 'Customer'),
(3, 'Workshop Manager'),
(4, 'Finance Officer'),
(5, 'Technician');

INSERT INTO Users (user_id, full_name, email, mobile, password_hash, status) VALUES 
(1, 'Amal Perera', 'amal@example.com', '0771111111', 'hash1', 'ACTIVE'),
(2, 'Kamal Silva', 'kamal@example.com', '0772222222', 'hash2', 'ACTIVE'),
(3, 'Nimal Fernando', 'nimal@example.com', '0773333333', 'hash3', 'ACTIVE'),
(4, 'Sunil Jayasinghe', 'sunil@example.com', '0774444444', 'hash4', 'ACTIVE'),
(5, 'Ruwan Kumara', 'ruwan@example.com', '0775555555', 'hash5', 'ACTIVE'),
(6, 'Niroshan Perera', 'niroshan@autoflow.lk', '0711111111', 'hash6', 'ACTIVE'),
(7, 'Malsha Wickramaratne', 'malsha@autoflow.lk', '0712222222', 'hash7', 'ACTIVE'),
(8, 'Dinuka Liyanage', 'dinuka@autoflow.lk', '0713333333', 'hash8', 'ACTIVE'),
(9, 'Nuwan Bandara', 'nuwan@autoflow.lk', '0714444444', 'hash9', 'ACTIVE'),
(10, 'Saman Rathnayake', 'saman@autoflow.lk', '0715555555', 'hash10', 'ACTIVE');

INSERT INTO Template (template_id, type, subject, body, status) VALUES 
(1, 'BOOKING_CONFIRM', 'Booking Confirmed', 'Your booking is confirmed.', 'ACTIVE'),
(2, 'PAYMENT_SUCCESS', 'Payment Received', 'We received your payment.', 'ACTIVE'),
(3, 'SERVICE_DONE', 'Service Completed', 'Your vehicle is ready.', 'ACTIVE'),
(4, 'REFUND_PROC', 'Refund Processed', 'Your refund is initiated.', 'ACTIVE'),
(5, 'REMINDER', 'Service Reminder', 'Upcoming service reminder.', 'ACTIVE');

INSERT INTO Centre (centre_id, name, location) VALUES 
(1, 'AutoFlow Malabe', 'Malabe, Colombo'),
(2, 'AutoFlow Kandy', 'Peradeniya Road, Kandy'),
(3, 'AutoFlow Galle', 'Galle Road, Galle'),
(4, 'AutoFlow Negombo', 'Colombo Road, Negombo'),
(5, 'AutoFlow Kurunegala', 'Dambulla Road, Kurunegala');

INSERT INTO FuelStation (station_id, name, location) VALUES 
(1, 'Ceypetco Malabe', 'Malabe Town'),
(2, 'LIOC Kandy', 'Kandy City'),
(3, 'Laugfs Galle', 'Galle Fort'),
(4, 'Ceypetco Negombo', 'Negombo Town'),
(5, 'LIOC Kurunegala', 'Kurunegala Center');

-- 2. USER HIERARCHY & ROLES
INSERT INTO UserRole (user_id, role_id) VALUES 
(1, 2), (2, 2), (3, 2), (4, 2), (5, 2),
(6, 3), (7, 4), (8, 5), (9, 5), (10, 5);

INSERT INTO Customer (customer_id, loyalty_points) VALUES 
(1, 150), (2, 0), (3, 300), (4, 50), (5, 500);

INSERT INTO Staff (staff_id, department) VALUES 
(6, 'Operations'),
(7, 'Finance'),
(8, 'Workshop'),
(9, 'Workshop'),
(10, 'Workshop');

INSERT INTO Technician (tech_id, skills, status) VALUES 
(6, 'General Supervisor', 'AVAILABLE'),
(8, 'Engine Diagnostics, AC', 'AVAILABLE'),
(9, 'Electrical, Hybrid', 'AVAILABLE'),
(10, 'Body Wash, Detailing', 'AVAILABLE'),
(7, 'Finance IT Support', 'AVAILABLE');

-- 3. AUDIT & NOTIFICATIONS
INSERT INTO Notification (notif_id, user_id, template_id, channel, status) VALUES 
(1, 1, 1, 'SMS', 'SENT'),
(2, 2, 2, 'EMAIL', 'SENT'),
(3, 3, 3, 'SYSTEM', 'SENT'),
(4, 4, 4, 'SMS', 'SENT'),
(5, 5, 5, 'EMAIL', 'SENT');

INSERT INTO AuditLog (audit_id, actor_id, entity, action, old_value, new_value) VALUES 
(1, 6, 'Vehicle', 'UPDATE', 'status=ACTIVE', 'status=INACTIVE'),
(2, 7, 'Payment', 'VERIFY', 'status=PENDING', 'status=COMPLETED'),
(3, 6, 'Booking', 'CANCEL', 'status=PENDING', 'status=CANCELLED'),
(4, 1, 'Profile', 'UPDATE', 'mobile=077111', 'mobile=0771111111'),
(5, 7, 'Refund', 'APPROVE', 'status=PENDING', 'status=APPROVED');

-- 4. VEHICLE MANAGEMENT
INSERT INTO Vehicle (vehicle_id, reg_no, make, model, year, fuel_type, engine_capacity, owner_id, insurance_expiry, mileage, status) VALUES 
(1, 'CBA-1234', 'Toyota', 'Prius', 2015, 'Hybrid', 1800, 1, '2027-01-15', 85000, 'ACTIVE'),
(2, 'WP-KAA-9876', 'Honda', 'Civic', 2018, 'Petrol', 1500, 2, '2027-05-20', 42000, 'ACTIVE'),
(3, 'NW-XYZ-1111', 'Nissan', 'Leaf', 2019, 'EV', 100, 3, '2026-11-10', 30000, 'ACTIVE'),
(4, 'SP-BCA-2222', 'Toyota', 'Hilux', 2021, 'Diesel', 2400, 4, '2027-08-01', 15000, 'ACTIVE'),
(5, 'WP-CBB-3333', 'Suzuki', 'Alto', 2014, 'Petrol', 800, 5, '2026-12-30', 110000, 'ACTIVE');

INSERT INTO VehicleDocument (doc_id, vehicle_id, type, expiry_date, status) VALUES 
(1, 1, 'Revenue License', '2027-01-15', 'VALID'),
(2, 2, 'Insurance', '2027-05-20', 'VALID'),
(3, 3, 'Revenue License', '2026-11-10', 'VALID'),
(4, 4, 'Emission Test', '2027-08-01', 'VALID'),
(5, 5, 'Insurance', '2026-12-30', 'VALID');

-- 5. SERVICE BOOKING & SCHEDULE
INSERT INTO Bay (bay_id, centre_id, name, status) VALUES 
(1, 1, 'Bay A - Quick Lube', 'AVAILABLE'),
(2, 1, 'Bay B - Heavy Repair', 'AVAILABLE'),
(3, 2, 'Bay A - General', 'AVAILABLE'),
(4, 3, 'Bay 1 - Diagnostics', 'AVAILABLE'),
(5, 4, 'Bay 1 - Wash', 'AVAILABLE');

INSERT INTO TimeSlot (slot_id, centre_id, bay_id, start_at, end_at, status) VALUES 
(1, 1, 1, '2026-10-01 08:00:00', '2026-10-01 10:00:00', 'BOOKED'),
(2, 1, 2, '2026-10-01 10:00:00', '2026-10-01 12:00:00', 'BOOKED'),
(3, 2, 3, '2026-10-02 09:00:00', '2026-10-02 11:00:00', 'BOOKED'),
(4, 3, 4, '2026-10-03 13:00:00', '2026-10-03 15:00:00', 'AVAILABLE'),
(5, 4, 5, '2026-10-04 15:00:00', '2026-10-04 17:00:00', 'AVAILABLE');

INSERT INTO Booking (booking_id, ref, customer_id, vehicle_id, service_type, centre_id, slot_id, status) VALUES 
(1, 'BKG-001', 1, 1, 'Full Service', 1, 1, 'COMPLETED'),
(2, 'BKG-002', 2, 2, 'Oil Change', 1, 2, 'CONFIRMED'),
(3, 'BKG-003', 3, 3, 'Battery Check', 2, 3, 'PENDING'),
(4, 'BKG-004', 4, 4, 'Engine Tune-up', 3, 4, 'CANCELLED'),
(5, 'BKG-005', 5, 5, 'Wash and Polish', 4, 5, 'PENDING');

INSERT INTO ServiceHistory (history_id, vehicle_id, booking_id, mileage, notes, completed_at) VALUES 
(1, 1, 1, 85000, 'Replaced oil filter and engine oil.', '2026-09-01 10:30:00'),
(2, 2, 2, 42000, 'Topped up coolant.', '2026-08-15 11:00:00'),
(3, 3, 3, 30000, 'EV Battery health at 95%.', '2026-07-20 14:00:00'),
(4, 4, 4, 14500, 'Customer cancelled due to emergency.', '2026-09-10 09:00:00'),
(5, 5, 5, 109000, 'Detailed wash done.', '2026-09-12 16:00:00');

INSERT INTO WaitingList (wait_id, booking_id, preferred_slot, status) VALUES 
(1, 3, '2026-10-01 08:00:00', 'WAITING'),
(2, 5, '2026-10-02 09:00:00', 'WAITING'),
(3, 2, '2026-10-03 13:00:00', 'PROMOTED'),
(4, 4, '2026-10-04 15:00:00', 'CANCELLED'),
(5, 1, '2026-09-01 08:00:00', 'FULFILLED');

-- 6. FUEL LOGGING
INSERT INTO FuelLog (log_id, vehicle_id, station_id, fuel_type, quantity, cost, odometer) VALUES 
(1, 1, 1, 'Petrol', 20.5, 7500.00, 85100),
(2, 2, 2, 'Petrol', 30.0, 10500.00, 42150),
(3, 4, 3, 'Diesel', 40.0, 12000.00, 15200),
(4, 5, 4, 'Petrol', 15.0, 5250.00, 110050),
(5, 1, 5, 'Petrol', 25.0, 8750.00, 85400);

-- 7. FINANCIALS & PAYMENTS
INSERT INTO Payment (payment_id, booking_id, provider_ref, method, amount, status) VALUES 
(1, 1, 'TXN-001', 'CARD', 15000.00, 'COMPLETED'),
(2, 2, 'TXN-002', 'CASH', 5000.00, 'COMPLETED'),
(3, 3, 'TXN-003', 'BANK_TRANSFER', 2000.00, 'COMPLETED'),
(4, 4, 'TXN-004', 'CARD', 25000.00, 'COMPLETED'),
(5, 5, 'TXN-005', 'CARD', 3000.00, 'COMPLETED'),
(6, 1, 'TXN-006', 'CARD', 15000.00, 'REFUNDED'),
(7, 2, 'TXN-007', 'BANK_TRANSFER', 5000.00, 'REFUNDED'),
(8, 3, 'TXN-008', 'CARD', 2000.00, 'REFUNDED'),
(9, 4, 'TXN-009', 'CASH', 25000.00, 'REFUNDED'),
(10, 5, 'TXN-010', 'CARD', 3000.00, 'REFUNDED');

INSERT INTO Invoice (invoice_id, payment_id, amount) VALUES 
(1, 1, 15000.00),
(2, 2, 5000.00),
(3, 3, 2000.00),
(4, 4, 25000.00),
(5, 5, 3000.00);

INSERT INTO Refund (refund_id, payment_id, amount, reason, decided_by, status) VALUES 
(1, 6, 15000.00, 'Double charge error', 7, 'APPROVED'),
(2, 7, 5000.00, 'Customer cancelled booking', 7, 'APPROVED'),
(3, 8, 2000.00, 'Service not available', 7, 'APPROVED'),
(4, 9, 25000.00, 'Manager discretionary refund', 7, 'APPROVED'),
(5, 10, 3000.00, 'System duplicate', 7, 'APPROVED');
GO

-- Stored Function
CREATE FUNCTION GetCustomerTotalSpend
(
    @customer_id INT
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @total_spent DECIMAL(10,2);

    SELECT @total_spent = COALESCE(SUM(i.amount), 0.00)
    FROM Invoice i
    JOIN Payment p 
        ON i.payment_id = p.payment_id
    JOIN Booking b 
        ON p.booking_id = b.booking_id
    WHERE b.customer_id = @customer_id;

    RETURN @total_spent;
END;
GO

-- Trigger
CREATE TRIGGER trg_Validate_Fuel_Odometer
ON FuelLog
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN Vehicle v
            ON i.vehicle_id = v.vehicle_id
        WHERE i.odometer < v.mileage
    )
    BEGIN
        RAISERROR(
            'Validation Error: Odometer reading cannot be lower than the current vehicle mileage.',
            16,
            1
        );

        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO
