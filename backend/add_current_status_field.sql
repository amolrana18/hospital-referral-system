-- Add current_status field to hospital_staff table
USE hospital_referral_system;

ALTER TABLE hospital_staff 
ADD COLUMN current_status ENUM('On-Duty', 'Off-Duty', 'On-Leave', 'On-Call', 'Emergency Duty') DEFAULT 'Off-Duty' 
AFTER contact_number;

-- Update existing records to have a default status
UPDATE hospital_staff SET current_status = 'Off-Duty' WHERE current_status IS NULL;