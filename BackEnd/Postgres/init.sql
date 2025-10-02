-- -----------------------------
-- Create Database (if needed)
-- -----------------------------
-- CREATE DATABASE "BukCare";
-- \c BukCare;

-- =========================================================
-- Provinces
-- =========================================================
CREATE TABLE Provinces (
    Province_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE
);

-- =========================================================
-- City/Municipality
-- =========================================================
CREATE TABLE City_Municipality (
    City_Municipality_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Zip_Code INT NOT NULL,
    Province_ID INT NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_city_province FOREIGN KEY(Province_ID)
        REFERENCES Provinces(Province_ID)
        ON DELETE CASCADE
);

-- =========================================================
-- Addresses
-- =========================================================
CREATE TABLE Addresses (
    Address_ID SERIAL PRIMARY KEY,
    Street VARCHAR(255) NOT NULL,
    Barangay VARCHAR(255) NOT NULL,
    City_Municipality_ID INT NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_address_city FOREIGN KEY(City_Municipality_ID)
        REFERENCES City_Municipality(City_Municipality_ID)
        ON DELETE CASCADE
);

-- =========================================================
-- Users (Base entity for Patients, Doctors, Staff, Admin)
-- =========================================================
CREATE TABLE Users (
    User_ID BIGINT PRIMARY KEY,
    Fname VARCHAR(255) NOT NULL,
    Lname VARCHAR(255) NOT NULL,
    Mname VARCHAR(255),
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Sex VARCHAR(10) CHECK (Sex IN ('Male','Female','Other')),
    Dob DATE,
    Contact_Number VARCHAR(20),
    Role VARCHAR(50) NOT NULL DEFAULT 'patient', -- patient, doctor, staff, admin
    Address_ID INT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_address FOREIGN KEY(Address_ID)
        REFERENCES Addresses(Address_ID)
        ON DELETE SET NULL
);

-- =========================================================
-- Sequence for custom User IDs
-- =========================================================
CREATE SEQUENCE user_id_seq;

CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INT;
BEGIN
    seq_num := nextval('user_id_seq');
    NEW.User_ID := (to_char(NOW(), 'YYYYMMDDHH24MISS') || lpad(seq_num::text, 4, '0'))::BIGINT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_user_id
BEFORE INSERT ON Users
FOR EACH ROW
EXECUTE FUNCTION generate_user_id();

-- =========================================================
-- Specializations
-- =========================================================
CREATE TABLE Specializations (
    Specialization_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE,
    Description VARCHAR(255),
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Doctors (Subclass of Users)
-- =========================================================
CREATE TABLE Doctors (
    Doctor_ID SERIAL PRIMARY KEY,
    User_ID BIGINT UNIQUE NOT NULL,
    Specialization_ID INT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_user FOREIGN KEY(User_ID)
        REFERENCES Users(User_ID)
        ON DELETE CASCADE,
    CONSTRAINT fk_doctor_specialization FOREIGN KEY(Specialization_ID)
        REFERENCES Specializations(Specialization_ID)
        ON DELETE SET NULL
);

-- =========================================================
-- Appointments
-- =========================================================
CREATE TABLE Appointments (
    Appointment_ID SERIAL PRIMARY KEY,
    Patient_ID BIGINT NOT NULL,
    Doctor_ID INT NOT NULL,
    Appointment_Date TIMESTAMP NOT NULL,
    Status VARCHAR(50) DEFAULT 'pending',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_patient FOREIGN KEY(Patient_ID)
        REFERENCES Users(User_ID)
        ON DELETE CASCADE,
    CONSTRAINT fk_appointment_doctor FOREIGN KEY(Doctor_ID)
        REFERENCES Doctors(Doctor_ID)
        ON DELETE CASCADE
);

CREATE INDEX idx_appointments_patient ON Appointments(Patient_ID);
CREATE INDEX idx_appointments_doctor ON Appointments(Doctor_ID);

-- =========================================================
-- Notifications
-- =========================================================
CREATE TABLE Notification (
    Notification_ID SERIAL PRIMARY KEY,
    Source_User_ID BIGINT,
    Target_User_ID BIGINT,
    Appointment_ID INT,
    Message VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'unread',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_source FOREIGN KEY(Source_User_ID)
        REFERENCES Users(User_ID)
        ON DELETE SET NULL,
    CONSTRAINT fk_notification_target FOREIGN KEY(Target_User_ID)
        REFERENCES Users(User_ID)
        ON DELETE SET NULL,
    CONSTRAINT fk_notification_appointment FOREIGN KEY(Appointment_ID)
        REFERENCES Appointments(Appointment_ID)
        ON DELETE SET NULL
);

CREATE INDEX idx_notification_target ON Notification(Target_User_ID);
