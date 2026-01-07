-- Create a new pot for demo leads
INSERT INTO pots (id, name) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Demo Leads');

-- Insert 20 mock contacts
INSERT INTO contacts (first_name, last_name, company, job_title, phone, email, status, pot_id) VALUES
('James', 'Wilson', 'TechFlow Solutions', 'CTO', '+1 555-0101', 'james.wilson@techflow.io', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Sarah', 'Chen', 'GreenLeaf Industries', 'VP Sales', '+1 555-0102', 'sarah.chen@greenleaf.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Michael', 'Brown', 'DataStream Corp', 'Director of IT', '+1 555-0103', 'm.brown@datastream.co', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Emma', 'Davis', 'CloudNine Software', 'CEO', '+1 555-0104', 'emma@cloudnine.dev', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('David', 'Lee', 'Nexus Innovations', 'Head of Engineering', '+1 555-0105', 'david.lee@nexusinno.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Lisa', 'Martinez', 'Quantum Analytics', 'COO', '+1 555-0106', 'l.martinez@quantumanalytics.io', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Robert', 'Taylor', 'BluePeak Ventures', 'Managing Partner', '+1 555-0107', 'rtaylor@bluepeak.vc', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Jennifer', 'White', 'Synergy Systems', 'Director of Operations', '+1 555-0108', 'jennifer.white@synergysys.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Chris', 'Anderson', 'PrimeCore Technologies', 'VP Engineering', '+1 555-0109', 'canderson@primecore.tech', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Amanda', 'Johnson', 'Elevate Digital', 'Marketing Director', '+1 555-0110', 'amanda.j@elevatedigital.co', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Kevin', 'Thompson', 'Fusion Dynamics', 'CIO', '+1 555-0111', 'kthompson@fusiondynamics.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Rachel', 'Garcia', 'Apex Consulting', 'Senior Partner', '+1 555-0112', 'r.garcia@apexconsulting.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Brian', 'Williams', 'Summit Software', 'Product Manager', '+1 555-0113', 'brian.w@summitsoftware.io', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Nicole', 'Robinson', 'Catalyst Group', 'Business Development', '+1 555-0114', 'nicole@catalystgroup.co', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Andrew', 'Clark', 'Horizon Labs', 'Research Director', '+1 555-0115', 'a.clark@horizonlabs.io', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Michelle', 'Lewis', 'Vanguard Solutions', 'Sales Director', '+1 555-0116', 'mlewis@vanguardsolutions.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Daniel', 'Walker', 'Sterling Enterprises', 'CFO', '+1 555-0117', 'dwalker@sterlingent.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Laura', 'Hall', 'Momentum Partners', 'Operations Manager', '+1 555-0118', 'laura.hall@momentumpartners.co', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Steven', 'Young', 'Pinnacle Tech', 'Tech Lead', '+1 555-0119', 's.young@pinnacletech.io', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('Karen', 'King', 'Velocity Corp', 'Account Executive', '+1 555-0120', 'karen.king@velocitycorp.com', 'pending', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');