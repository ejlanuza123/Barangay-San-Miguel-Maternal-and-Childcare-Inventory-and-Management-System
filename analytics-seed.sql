-- Sample analytics seed data for dashboard/report testing.
-- Safe to run alongside the live schema because it avoids auth-backed tables.

BEGIN;

-- -----------------------------------------------------------------------------
-- Maternal records
-- -----------------------------------------------------------------------------
INSERT INTO public.mother_records (
  id, patient_id, first_name, middle_name, last_name, age, contact_no, weeks,
  last_visit, risk_level, created_at, purok, street, updated_at, dob, blood_type,
  family_folder_no, nhts_no, philhealth_no, allergy_history, family_planning_history,
  sms_notifications_enabled, is_synced
) VALUES
  ('11111111-1111-4111-8111-111111111111', 'P-2026-001', 'Maria', 'L.', 'Santos', 28, '09170000001', 32, '2026-04-28', 'NORMAL', '2026-01-15 08:00:00+08', 'Purok 1', 'Rizal St.', '2026-04-28 10:15:00+08', '1997-03-10', 'O+', 'FF-001', 'NHTS-001', 'PH-001', 'None', 'Natural family planning', true, true),
  ('22222222-2222-4222-8222-222222222222', 'P-2026-002', 'Angela', 'M.', 'Reyes', 31, '09170000002', 28, '2026-04-26', 'MID RISK', '2026-01-22 09:30:00+08', 'Purok 2', 'Mabini St.', '2026-04-26 14:20:00+08', '1994-08-21', 'A+', 'FF-002', 'NHTS-002', 'PH-002', 'Penicillin', 'IUD before pregnancy', true, true),
  ('33333333-3333-4333-8333-333333333333', 'P-2026-003', 'Lorna', 'S.', 'Dela Cruz', 24, '09170000003', 24, '2026-04-20', 'NORMAL', '2026-02-03 07:45:00+08', 'Purok 3', 'Bonifacio St.', '2026-04-20 09:10:00+08', '2001-11-14', 'B+', 'FF-003', 'NHTS-003', 'PH-003', 'None', 'Condom use', true, true),
  ('44444444-4444-4444-8444-444444444444', 'P-2026-004', 'Joanna', 'P.', 'Villanueva', 35, '09170000004', 36, '2026-04-24', 'HIGH RISK', '2026-02-11 13:15:00+08', 'Purok 4', 'Quezon Ave.', '2026-04-24 08:55:00+08', '1990-05-02', 'AB+', 'FF-004', 'NHTS-004', 'PH-004', 'Seafood', 'Bilateral tubal ligation', true, true),
  ('55555555-5555-4555-8555-555555555555', 'P-2026-005', 'Clarisse', 'T.', 'Ortega', 26, '09170000005', 18, '2026-04-18', 'MID RISK', '2026-03-01 10:20:00+08', 'Purok 5', 'Del Pilar St.', '2026-04-18 11:40:00+08', '1999-01-08', 'O-', 'FF-005', 'NHTS-005', 'PH-005', 'None', 'Injectables', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_menstrual_history (
  id, mother_record_id, lmp, edc, age_of_menarche, menstruation_duration,
  bleeding_amount, age_first_period, risk_code, created_at, updated_at, is_synced
) VALUES
  ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '2025-09-12', '2026-06-19', 12, 5, 'Moderate', 12, 'N', '2026-01-15 08:05:00+08', '2026-04-28 10:05:00+08', true),
  ('22222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222222', '2025-10-01', '2026-07-08', 13, 6, 'Heavy', 13, 'MR', '2026-01-22 09:35:00+08', '2026-04-26 14:10:00+08', true),
  ('33333333-3333-4333-8333-333333333334', '33333333-3333-4333-8333-333333333333', '2025-11-08', '2026-08-15', 12, 5, 'Light', 12, 'N', '2026-02-03 07:50:00+08', '2026-04-20 09:05:00+08', true),
  ('44444444-4444-4444-8444-444444444445', '44444444-4444-4444-8444-444444444444', '2025-08-20', '2026-05-27', 11, 7, 'Heavy', 11, 'HR', '2026-02-11 13:20:00+08', '2026-04-24 08:50:00+08', true),
  ('55555555-5555-4555-8555-555555555556', '55555555-5555-4555-8555-555555555555', '2025-12-05', '2026-09-11', 14, 5, 'Moderate', 14, 'MR', '2026-03-01 10:25:00+08', '2026-04-18 11:35:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_obstetrical_score (
  id, mother_record_id, g_score, p_score, term, preterm, abortion, living_children,
  created_at, updated_at, is_synced
) VALUES
  ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 2, 1, 1, 0, 0, 1, '2026-01-15 08:10:00+08', '2026-04-28 10:00:00+08', true),
  ('32222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 3, 2, 2, 0, 0, 2, '2026-01-22 09:40:00+08', '2026-04-26 14:00:00+08', true),
  ('33333333-3333-4333-8333-333333333335', '33333333-3333-4333-8333-333333333333', 1, 0, 0, 0, 0, 0, '2026-02-03 07:55:00+08', '2026-04-20 09:00:00+08', true),
  ('34444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 4, 3, 3, 0, 0, 3, '2026-02-11 13:25:00+08', '2026-04-24 08:45:00+08', true),
  ('35555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 2, 1, 1, 0, 0, 1, '2026-03-01 10:30:00+08', '2026-04-18 11:30:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_medical_conditions (
  id, mother_record_id, condition_type, condition_category, is_present, created_at, updated_at, is_synced
) VALUES
  ('41111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Anemia', 'Maternal', true, '2026-01-15 08:15:00+08', '2026-04-28 10:00:00+08', true),
  ('42222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Hypertension', 'Maternal', true, '2026-01-22 09:45:00+08', '2026-04-26 14:00:00+08', true),
  ('43333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'Asthma', 'Medical', false, '2026-02-03 08:00:00+08', '2026-04-20 09:00:00+08', true),
  ('44444444-4444-4444-8444-444444444446', '44444444-4444-4444-8444-444444444444', 'Gestational Diabetes', 'Maternal', true, '2026-02-11 13:30:00+08', '2026-04-24 08:40:00+08', true),
  ('45555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'Allergy History', 'Medical', false, '2026-03-01 10:35:00+08', '2026-04-18 11:30:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_obstetrical_history (
  id, mother_record_id, gravida, outcome, sex, delivery_type, delivered_at,
  created_at, updated_at, is_synced
) VALUES
  ('51111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'G2', 'Live Birth', 'Male', 'Normal Spontaneous Delivery', 'Hospital', '2026-01-15 08:20:00+08', '2026-04-28 10:00:00+08', true),
  ('52222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'G3', 'Live Birth', 'Female', 'Cesarean', 'Hospital', '2026-01-22 09:50:00+08', '2026-04-26 14:00:00+08', true),
  ('53333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'G1', 'Current Pregnancy', 'TBD', 'N/A', 'N/A', '2026-02-03 08:05:00+08', '2026-04-20 09:00:00+08', true),
  ('54444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 'G4', 'Live Birth', 'Female', 'Normal Spontaneous Delivery', 'Hospital', '2026-02-11 13:35:00+08', '2026-04-24 08:40:00+08', true),
  ('55555555-5555-4555-8555-555555555557', '55555555-5555-4555-8555-555555555555', 'G2', 'Current Pregnancy', 'TBD', 'N/A', 'N/A', '2026-03-01 10:40:00+08', '2026-04-18 11:30:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_pregnancy_outcomes (
  id, mother_record_id, date_terminated, delivery_type, outcome, child_sex,
  birth_weight_grams, age_weeks, place_of_birth, attended_by, created_at, updated_at, is_synced
) VALUES
  ('61111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '2026-02-20', 'Normal Spontaneous Delivery', 'Delivered', 'Male', 3100, 39, 'Barangay Health Center', 'Midwife L. Cruz', '2026-02-20 15:00:00+08', '2026-02-20 15:30:00+08', true),
  ('62222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '2026-03-08', 'Cesarean', 'Delivered', 'Female', 2900, 38, 'District Hospital', 'Dr. R. Aquino', '2026-03-08 11:00:00+08', '2026-03-08 11:45:00+08', true),
  ('63333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '2026-04-05', 'Normal Spontaneous Delivery', 'Delivered', 'Female', 3250, 39, 'Barangay Health Center', 'Midwife L. Cruz', '2026-04-05 10:00:00+08', '2026-04-05 10:25:00+08', true),
  ('64444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '2026-04-22', 'Cesarean', 'Delivered', 'Male', 2750, 37, 'District Hospital', 'Dr. R. Aquino', '2026-04-22 13:00:00+08', '2026-04-22 13:40:00+08', true),
  ('65555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '2026-04-29', 'Normal Spontaneous Delivery', 'Ongoing Care', 'TBD', 0, 18, 'Barangay Health Center', 'Midwife L. Cruz', '2026-04-29 09:30:00+08', '2026-04-29 10:00:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_supplementation (
  id, mother_record_id, supplement_type, date_given, amount, administered_by,
  created_at, updated_at, is_synced
) VALUES
  ('71111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Iron', '2026-04-01', '1 tablet daily', 'Midwife L. Cruz', '2026-04-01 10:00:00+08', '2026-04-01 10:00:00+08', true),
  ('72222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'Folic Acid', '2026-04-02', '1 tablet daily', 'Midwife L. Cruz', '2026-04-02 10:00:00+08', '2026-04-02 10:00:00+08', true),
  ('73333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'Vitamin B Complex', '2026-04-03', '1 tablet daily', 'Midwife L. Cruz', '2026-04-03 10:00:00+08', '2026-04-03 10:00:00+08', true),
  ('74444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 'Iron', '2026-04-04', '2 tablets daily', 'Midwife L. Cruz', '2026-04-04 10:00:00+08', '2026-04-04 10:00:00+08', true),
  ('75555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'Calcium', '2026-04-05', '1 tablet daily', 'Midwife L. Cruz', '2026-04-05 10:00:00+08', '2026-04-05 10:00:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maternal_treatment_records (
  id, mother_record_id, visit_date, arrival_time, departure_time, height_cm, weight_kg,
  bp, muac_cm, bmi, aog_weeks, fh_cm, fhb, loc, presentation, fe_fa, admitted, examined,
  created_at, updated_at, is_synced
) VALUES
  ('81111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '2026-04-01', '08:15:00', '08:45:00', 154, 57.4, '110/70', 26.5, 24.2, 31, 30.0, 'Positive', 'Alert', 'Cephalic', 'Iron + Folic Acid', 'No', 'Midwife L. Cruz', '2026-04-01 08:50:00+08', '2026-04-01 09:00:00+08', true),
  ('82222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '2026-04-03', '09:05:00', '09:40:00', 152, 61.2, '120/80', 27.1, 26.5, 28, 28.5, 'Positive', 'Alert', 'Cephalic', 'Ferrous Sulfate', 'No', 'Midwife L. Cruz', '2026-04-03 09:45:00+08', '2026-04-03 09:55:00+08', true),
  ('83333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '2026-04-05', '10:00:00', '10:30:00', 149, 54.0, '108/68', 25.8, 24.3, 24, 24.0, 'Positive', 'Alert', 'Cephalic', 'Iron + Folic Acid', 'No', 'Midwife L. Cruz', '2026-04-05 10:35:00+08', '2026-04-05 10:45:00+08', true),
  ('84444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '2026-04-07', '13:00:00', '13:45:00', 158, 66.1, '130/90', 28.0, 26.5, 37, 33.0, 'Negative', 'Cephalic', 'Cephalic', 'Calcium + Iron', 'Referred to hospital', 'Midwife L. Cruz', '2026-04-07 13:50:00+08', '2026-04-07 14:00:00+08', true),
  ('85555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '2026-04-10', '09:20:00', '09:55:00', 151, 58.8, '112/72', 26.2, 25.8, 18, 19.0, 'Positive', 'Breech', 'Cephalic', 'Iron', 'No', 'Midwife L. Cruz', '2026-04-10 10:00:00+08', '2026-04-10 10:05:00+08', true)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Child records and related child analytics tables
-- -----------------------------------------------------------------------------
INSERT INTO public.child_records (
  id, child_id, first_name, last_name, dob, sex, place_of_birth, mother_name,
  father_name, guardian_name, nhts_no, philhealth_no, weight_kg, height_cm, bmi,
  nutrition_status, last_checkup, created_at, address, bhs_name, family_number,
  delivery_time, birth_order, delivery_type, mother_age, contact_no,
  guardian_relationship, nearest_landmark, nbs_referral_date, nbs_result,
  birth_attendant, aog_at_birth, smoking_history, birth_weight, child_name,
  place_of_delivery, vitamin_a_amount, vitamin_a_date, is_synced, updated_at
) VALUES
  ('a1111111-1111-4111-8111-111111111111', 'C-2026-001', 'Lucas', 'Santos', '2025-03-12', 'Male', 'Barangay Health Center', 'Maria Santos', 'Jose Santos', 'Maria Santos', 'NHTS-C001', 'PH-C001', 10.2, 78, 16.8, 'Normal', '2026-04-28', '2026-04-28 09:00:00+08', 'Purok 1, Rizal St.', 'BHC-1', 'FAM-001', '08:30:00', '1st', 'Normal Spontaneous Delivery', 28, '09180000001', 'Mother', 'Near covered court', '2025-04-01', 'Negative', 'Midwife L. Cruz', '39 weeks', 'None', '3.1 kg', 'Lucas Santos', 'Barangay Health Center', '200000 IU', '2026-04-28', true, '2026-04-28 09:10:00+08'),
  ('a2222222-2222-4222-8222-222222222222', 'C-2026-002', 'Ella', 'Reyes', '2025-05-20', 'Female', 'District Hospital', 'Angela Reyes', 'Mark Reyes', 'Angela Reyes', 'NHTS-C002', 'PH-C002', 9.4, 75, 16.7, 'Underweight', '2026-04-26', '2026-04-26 10:00:00+08', 'Purok 2, Mabini St.', 'BHC-1', 'FAM-002', '11:00:00', '2nd', 'Cesarean', 31, '09180000002', 'Mother', 'Beside sari-sari store', '2025-05-10', 'Negative', 'Dr. R. Aquino', '38 weeks', 'None', '2.9 kg', 'Ella Reyes', 'District Hospital', '100000 IU', '2026-04-26', true, '2026-04-26 10:15:00+08'),
  ('a3333333-3333-4333-8333-333333333333', 'C-2026-003', 'Noah', 'Dela Cruz', '2025-07-18', 'Male', 'Barangay Health Center', 'Lorna Dela Cruz', 'Jun Dela Cruz', 'Lorna Dela Cruz', 'NHTS-C003', 'PH-C003', 11.0, 79, 17.6, 'Normal', '2026-04-20', '2026-04-20 11:00:00+08', 'Purok 3, Bonifacio St.', 'BHC-2', 'FAM-003', '09:15:00', '1st', 'Normal Spontaneous Delivery', 24, '09180000003', 'Mother', 'Near chapel', '2025-06-20', 'Negative', 'Midwife L. Cruz', '39 weeks', 'None', '3.2 kg', 'Noah Dela Cruz', 'Barangay Health Center', '200000 IU', '2026-04-20', true, '2026-04-20 11:20:00+08'),
  ('a4444444-4444-4444-8444-444444444444', 'C-2026-004', 'Sophia', 'Villanueva', '2025-04-02', 'Female', 'District Hospital', 'Joanna Villanueva', 'Renato Villanueva', 'Joanna Villanueva', 'NHTS-C004', 'PH-C004', 8.7, 73, 16.3, 'Underweight', '2026-04-24', '2026-04-24 08:30:00+08', 'Purok 4, Quezon Ave.', 'BHC-2', 'FAM-004', '12:05:00', '3rd', 'Cesarean', 35, '09180000004', 'Mother', 'Near health center', '2025-04-12', 'Negative', 'Dr. R. Aquino', '37 weeks', 'None', '2.8 kg', 'Sophia Villanueva', 'District Hospital', '100000 IU', '2026-04-24', true, '2026-04-24 08:45:00+08'),
  ('a5555555-5555-4555-8555-555555555555', 'C-2026-005', 'Miguel', 'Ortega', '2025-08-11', 'Male', 'Barangay Health Center', 'Clarisse Ortega', 'Paul Ortega', 'Clarisse Ortega', 'NHTS-C005', 'PH-C005', 10.8, 77, 18.2, 'Normal', '2026-04-18', '2026-04-18 14:00:00+08', 'Purok 5, Del Pilar St.', 'BHC-3', 'FAM-005', '10:40:00', '1st', 'Normal Spontaneous Delivery', 26, '09180000005', 'Mother', 'Behind market', '2025-07-12', 'Negative', 'Midwife L. Cruz', '39 weeks', 'None', '3.0 kg', 'Miguel Ortega', 'Barangay Health Center', '200000 IU', '2026-04-18', true, '2026-04-18 14:10:00+08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.child_measurements (
  id, child_record_id, measurement_date, weight_kg, height_cm, bmi, nutrition_status,
  muac_cm, recorded_by, created_at, updated_at, is_synced
) VALUES
  ('b1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', '2026-03-28', 9.8, 77, 16.5, 'Normal', 13.5, NULL, '2026-03-28 09:15:00+08', '2026-03-28 09:20:00+08', true),
  ('b2222222-2222-4222-8222-222222222222', 'a1111111-1111-4111-8111-111111111111', '2026-04-28', 10.2, 78, 16.8, 'Normal', 13.7, NULL, '2026-04-28 09:20:00+08', '2026-04-28 09:25:00+08', true),
  ('b3333333-3333-4333-8333-333333333333', 'a2222222-2222-4222-8222-222222222222', '2026-03-26', 9.1, 74, 16.6, 'Underweight', 13.2, NULL, '2026-03-26 10:10:00+08', '2026-03-26 10:15:00+08', true),
  ('b4444444-4444-4444-8444-444444444444', 'a2222222-2222-4222-8222-222222222222', '2026-04-26', 9.4, 75, 16.7, 'Underweight', 13.4, NULL, '2026-04-26 10:20:00+08', '2026-04-26 10:25:00+08', true),
  ('b5555555-5555-4555-8555-555555555555', 'a3333333-3333-4333-8333-333333333333', '2026-03-20', 10.6, 78, 17.4, 'Normal', 13.8, NULL, '2026-03-20 11:00:00+08', '2026-03-20 11:05:00+08', true),
  ('b6666666-6666-4666-8666-666666666666', 'a3333333-3333-4333-8333-333333333333', '2026-04-20', 11.0, 79, 17.6, 'Normal', 14.0, NULL, '2026-04-20 11:10:00+08', '2026-04-20 11:15:00+08', true),
  ('b7777777-7777-4777-8777-777777777777', 'a4444444-4444-4444-8444-444444444444', '2026-03-24', 8.5, 72, 16.4, 'Underweight', 13.0, NULL, '2026-03-24 08:40:00+08', '2026-03-24 08:45:00+08', true),
  ('b8888888-8888-4888-8888-888888888888', 'a4444444-4444-4444-8444-444444444444', '2026-04-24', 8.7, 73, 16.3, 'Underweight', 13.1, NULL, '2026-04-24 08:50:00+08', '2026-04-24 08:55:00+08', true),
  ('b9999999-9999-4999-8999-999999999999', 'a5555555-5555-4555-8555-555555555555', '2026-03-18', 10.4, 76, 18.0, 'Normal', 13.9, NULL, '2026-03-18 14:10:00+08', '2026-03-18 14:15:00+08', true),
  ('baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a5555555-5555-4555-8555-555555555555', '2026-04-18', 10.8, 77, 18.2, 'Normal', 14.1, NULL, '2026-04-18 14:20:00+08', '2026-04-18 14:25:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.child_immunizations (
  id, child_record_id, immunization_type, date_given, age, weight_kg, height_cm,
  nutritional_status, admitted_by, immunized_by, next_visit, remarks,
  admission_time, departure_time, created_at, updated_at, is_synced
) VALUES
  ('c1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'BCG', '2026-01-10', '10 months', 9.5, 76, 'Normal', 'Midwife L. Cruz', 'Nurse A. Tan', '2026-04-10', 'On schedule', '08:20:00', '08:40:00', '2026-01-10 08:20:00+08', '2026-01-10 08:40:00+08', true),
  ('c2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'Pentavalent 1', '2026-01-12', '9 months', 9.0, 74, 'Underweight', 'Midwife L. Cruz', 'Nurse A. Tan', '2026-04-12', 'Monitor weight gain', '09:10:00', '09:35:00', '2026-01-12 09:10:00+08', '2026-01-12 09:35:00+08', true),
  ('c3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333', 'Pentavalent 2', '2026-02-10', '8 months', 10.5, 78, 'Normal', 'Midwife L. Cruz', 'Nurse A. Tan', '2026-05-10', 'On schedule', '10:00:00', '10:25:00', '2026-02-10 10:00:00+08', '2026-02-10 10:25:00+08', true),
  ('c4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444', 'Measles-Rubella', '2026-02-14', '10 months', 8.8, 73, 'Underweight', 'Midwife L. Cruz', 'Nurse A. Tan', '2026-05-14', 'Follow up nutrition counseling', '08:50:00', '09:20:00', '2026-02-14 08:50:00+08', '2026-02-14 09:20:00+08', true),
  ('c5555555-5555-4555-8555-555555555555', 'a5555555-5555-4555-8555-555555555555', 'OPV 1', '2026-03-12', '7 months', 10.2, 76, 'Normal', 'Midwife L. Cruz', 'Nurse A. Tan', '2026-06-12', 'Good response', '11:05:00', '11:25:00', '2026-03-12 11:05:00+08', '2026-03-12 11:25:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.child_mother_immunizations (
  id, child_record_id, immunization_type, date_given, created_at, updated_at, is_synced
) VALUES
  ('d1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'Hepatitis B at Birth', '2025-03-12', '2025-03-12 09:00:00+08', '2025-03-12 09:05:00+08', true),
  ('d2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'TT Booster', '2025-05-20', '2025-05-20 10:00:00+08', '2025-05-20 10:05:00+08', true),
  ('d3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333', 'Hepatitis B at Birth', '2025-07-18', '2025-07-18 09:30:00+08', '2025-07-18 09:35:00+08', true),
  ('d4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444', 'TT Booster', '2025-04-02', '2025-04-02 11:00:00+08', '2025-04-02 11:05:00+08', true),
  ('d5555555-5555-4555-8555-555555555555', 'a5555555-5555-4555-8555-555555555555', 'Hepatitis B at Birth', '2025-08-11', '2025-08-11 08:30:00+08', '2025-08-11 08:35:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.child_supplementation (
  id, child_record_id, supplement_type, date_given, amount, administered_by,
  created_at, updated_at, is_synced
) VALUES
  ('e1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'Vitamin A', '2026-04-28', '200,000 IU', 'Nurse A. Tan', '2026-04-28 09:30:00+08', '2026-04-28 09:30:00+08', true),
  ('e2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 'Vitamin A', '2026-04-26', '100,000 IU', 'Nurse A. Tan', '2026-04-26 10:30:00+08', '2026-04-26 10:30:00+08', true),
  ('e3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333', 'Deworming Tablet', '2026-04-20', '1 tablet', 'Nurse A. Tan', '2026-04-20 11:30:00+08', '2026-04-20 11:30:00+08', true),
  ('e4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444', 'Vitamin A', '2026-04-24', '100,000 IU', 'Nurse A. Tan', '2026-04-24 09:00:00+08', '2026-04-24 09:00:00+08', true),
  ('e5555555-5555-4555-8555-555555555555', 'a5555555-5555-4555-8555-555555555555', 'Vitamin A', '2026-04-18', '200,000 IU', 'Nurse A. Tan', '2026-04-18 14:30:00+08', '2026-04-18 14:30:00+08', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.child_breastfeeding (
  id, child_record_id, month_number, is_exclusive, created_at, updated_at, is_synced
) VALUES
  ('f1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 1, true, '2026-01-28 09:00:00+08', '2026-01-28 09:00:00+08', true),
  ('f2222222-2222-4222-8222-222222222222', 'a2222222-2222-4222-8222-222222222222', 2, true, '2026-02-26 10:00:00+08', '2026-02-26 10:00:00+08', true),
  ('f3333333-3333-4333-8333-333333333333', 'a3333333-3333-4333-8333-333333333333', 3, true, '2026-03-20 11:00:00+08', '2026-03-20 11:00:00+08', true),
  ('f4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444', 4, true, '2026-04-24 08:30:00+08', '2026-04-24 08:30:00+08', true),
  ('f5555555-5555-4555-8555-555555555555', 'a5555555-5555-4555-8555-555555555555', 5, false, '2026-04-18 14:00:00+08', '2026-04-18 14:00:00+08', true)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Inventory and movement history
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory (
  id, item_name, category, quantity, status, expiry_date, created_at, updated_at,
  sku, batch_no, supply_source, owner_role, unit, min_stock_level, reorder_quantity
) VALUES
  ('01111111-1111-4111-8111-111111111111', 'Iron + Folic Acid', 'Medicines', 12, 'Low', '2026-11-30', '2026-02-01 08:00:00+08', '2026-04-28 08:00:00+08', 'IFA-001', 'BATCH-001', 'DOH', 'BHW', 'tablet', 15, 40),
  ('02222222-2222-4222-8222-222222222222', 'Ferrous Sulfate 325mg', 'Medicines', 18, 'Low', '2027-01-31', '2026-02-01 08:00:00+08', '2026-04-28 08:00:00+08', 'FS-002', 'BATCH-002', 'DOH', 'BHW', 'tablet', 20, 50),
  ('03333333-3333-4333-8333-333333333333', 'Vitamin A 200,000 IU', 'Medicines', 45, 'Normal', '2027-03-31', '2026-02-05 08:00:00+08', '2026-04-28 08:00:00+08', 'VA-003', 'BATCH-003', 'LGU', 'BHW', 'capsule', 10, 30),
  ('04444444-4444-4444-8444-444444444444', 'Paracetamol 500mg', 'Medicines', 32, 'Normal', '2027-04-30', '2026-02-05 08:00:00+08', '2026-04-28 08:00:00+08', 'PCM-004', 'BATCH-004', 'LGU', 'BHW', 'tablet', 12, 30),
  ('05555555-5555-4555-8555-555555555555', 'Amoxicillin 500mg', 'Medicines', 8, 'Critical', '2026-10-31', '2026-02-10 08:00:00+08', '2026-04-28 08:00:00+08', 'AMX-005', 'BATCH-005', 'Hospital Donation', 'BHW', 'capsule', 10, 25),
  ('06666666-6666-4666-8666-666666666666', 'Oral Rehydration Salts', 'Medicines', 60, 'Normal', '2027-02-28', '2026-02-10 08:00:00+08', '2026-04-28 08:00:00+08', 'ORS-006', 'BATCH-006', 'LGU', 'BHW', 'sachet', 20, 40),
  ('07777777-7777-4777-8777-777777777777', 'Zinc Syrup', 'Medicines', 14, 'Low', '2026-12-31', '2026-02-12 08:00:00+08', '2026-04-28 08:00:00+08', 'ZNC-007', 'BATCH-007', 'LGU', 'BHW', 'bottle', 15, 20),
  ('08888888-8888-4888-8888-888888888888', 'Multivitamins', 'Nutrition', 25, 'Normal', '2027-05-31', '2026-02-15 08:00:00+08', '2026-04-28 08:00:00+08', 'MVT-008', 'BATCH-008', 'LGU', 'BNS', 'tablet', 10, 30),
  ('09999999-9999-4999-8999-999999999999', 'Tetanus Vaccine', 'Vaccines', 6, 'Critical', '2026-09-30', '2026-02-20 08:00:00+08', '2026-04-28 08:00:00+08', 'TTV-009', 'BATCH-009', 'DOH', 'BHW', 'dose', 8, 20),
  ('0aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'BP Apparatus', 'Supplies', 3, 'Critical', NULL, '2026-02-20 08:00:00+08', '2026-04-28 08:00:00+08', 'BPA-010', 'BATCH-010', 'LGU', 'BHW', 'unit', 5, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_movements (
  id, inventory_id, movement_type, quantity_change, quantity_before, quantity_after,
  reason, reference_type, reference_id, created_by, created_at, notes
) VALUES
  ('10111111-1111-4111-8111-111111111111', '01111111-1111-4111-8111-111111111111', 'OUT', -8, 20, 12, 'Requisition approval', 'requestion', '1', NULL, '2026-04-01 08:30:00+08', 'Seeded request deduction'),
  ('10222222-2222-4222-8222-222222222222', '02222222-2222-4222-8222-222222222222', 'OUT', -7, 25, 18, 'Requisition approval', 'requestion', '2', NULL, '2026-04-03 09:30:00+08', 'Seeded request deduction'),
  ('10333333-3333-4333-8333-333333333333', '03333333-3333-4333-8333-333333333333', 'OUT', -5, 50, 45, 'Vitamin A distribution', 'dispense', '3', NULL, '2026-04-20 10:00:00+08', 'Maternal and child clinic'),
  ('10444444-4444-4444-8444-444444444444', '04444444-4444-4444-8444-444444444444', 'OUT', -3, 35, 32, 'Consultation use', 'dispense', '4', NULL, '2026-04-22 11:00:00+08', 'Routine clinic usage'),
  ('10555555-5555-4555-8555-555555555555', '05555555-5555-4555-8555-555555555555', 'OUT', -2, 10, 8, 'Emergency dispense', 'direct-dispense', '5', NULL, '2026-04-24 13:00:00+08', 'High demand item'),
  ('10666666-6666-4666-8666-666666666666', '06666666-6666-4666-8666-666666666666', 'OUT', -12, 72, 60, 'ORS distribution', 'dispense', '6', NULL, '2026-04-18 09:00:00+08', 'Stock used during sessions'),
  ('10777777-7777-4777-8777-777777777777', '07777777-7777-4777-8777-777777777777', 'ADJUSTMENT', 4, 10, 14, 'Physical count correction', 'adjustment', '7', NULL, '2026-04-25 16:00:00+08', 'Adjusted after inventory audit'),
  ('10888888-8888-4888-8888-888888888888', '08888888-8888-4888-8888-888888888888', 'OUT', -5, 30, 25, 'Nutrition program issue', 'dispense', '8', NULL, '2026-04-12 10:30:00+08', 'Routine supplement release'),
  ('10999999-9999-4999-8999-999999999999', '09999999-9999-4999-8999-999999999999', 'WASTE', -2, 8, 6, 'Expired vial disposal', 'waste', '9', NULL, '2026-04-27 15:00:00+08', 'Removed expired stock'),
  ('10aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '0aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ADJUSTMENT', 1, 2, 3, 'Added delivered unit', 'adjustment', '10', NULL, '2026-04-28 12:00:00+08', 'Device count corrected')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Follow-up visits, requests, and activity log
-- -----------------------------------------------------------------------------
INSERT INTO public.follow_up_visit (
  id, date, "time", reason, status, created_at, notes, patient_display_id, confirmed_by, visit_type
) VALUES
  ('20111111-1111-4111-8111-111111111111', '2026-05-04', '09:00 AM', 'Prenatal follow-up', 'Scheduled', '2026-04-28 10:30:00+08', 'Blood pressure monitoring', 'P-2026-001', NULL, 'maternal'),
  ('20222222-2222-4222-8222-222222222222', '2026-05-05', '10:30 AM', 'Prenatal follow-up', 'Scheduled', '2026-04-26 14:30:00+08', 'Check iron compliance', 'P-2026-002', NULL, 'maternal'),
  ('20333333-3333-4333-8333-333333333333', '2026-05-06', '08:30 AM', 'Immunization review', 'Scheduled', '2026-04-20 11:30:00+08', 'Bring child vaccination card', 'C-2026-003', NULL, 'child'),
  ('20444444-4444-4444-8444-444444444444', '2026-05-07', '01:30 PM', 'Nutrition counseling', 'Scheduled', '2026-04-24 09:15:00+08', 'Weight gain counseling', 'C-2026-004', NULL, 'child'),
  ('20555555-5555-4555-8555-555555555555', '2026-05-08', '02:00 PM', 'Postpartum check', 'Scheduled', '2026-04-18 14:40:00+08', 'Discuss breastfeeding and vitamins', 'P-2026-005', NULL, 'maternal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.requestions (
  id, created_at, worker_id, request_type, target_table, request_data, status, target_record_id, role_source
) VALUES
  (1, '2026-04-01 07:50:00+08', NULL, 'Add', 'inventory', jsonb_build_object('item_name','Iron + Folic Acid','category','Medicines','quantity',50,'unit','tablet','sku','IFA-011','batch_no','BATCH-011','supply_source','DOH','expiry_date','2027-01-31','min_stock_level',15,'reorder_quantity',50,'owner_role','BHW'), 'Approved', '01111111-1111-4111-8111-111111111111', 'BHW'),
  (2, '2026-04-03 08:15:00+08', NULL, 'Update', 'inventory', jsonb_build_object('quantity',18,'min_stock_level',20,'reorder_quantity',50,'item_name','Ferrous Sulfate 325mg'), 'Approved', '02222222-2222-4222-8222-222222222222', 'BHW'),
  (3, '2026-04-05 09:10:00+08', NULL, 'Delete', 'inventory', jsonb_build_object('item_name','Expired Vitamin A vials'), 'Denied', '03333333-3333-4333-8333-333333333333', 'BNS'),
  (4, '2026-04-07 10:05:00+08', NULL, 'Update', 'mother_records', jsonb_build_object('first_name','Angela','last_name','Reyes','weeks',29,'risk_level','MID RISK'), 'Approved', '22222222-2222-4222-8222-222222222222', 'BHW'),
  (5, '2026-04-09 11:00:00+08', NULL, 'Add', 'child_records', jsonb_build_object('child_id','C-2026-006','first_name','Hanna','last_name','Bautista','nutrition_status','Normal'), 'Pending', 'a5555555-5555-4555-8555-555555555555', 'BNS'),
  (6, '2026-04-11 08:45:00+08', NULL, 'Update', 'inventory', jsonb_build_object('quantity',6,'status','Critical','item_name','Tetanus Vaccine'), 'Approved', '09999999-9999-4999-8999-999999999999', 'BHW'),
  (7, '2026-04-14 09:25:00+08', NULL, 'Add', 'mother_records', jsonb_build_object('first_name','Rhea','last_name','Cruz','risk_level','NORMAL'), 'Pending', '11111111-1111-4111-8111-111111111111', 'BHW'),
  (8, '2026-04-16 10:40:00+08', NULL, 'Update', 'child_records', jsonb_build_object('child_id','C-2026-004','nutrition_status','Underweight'), 'Approved', 'a4444444-4444-4444-8444-444444444444', 'BNS'),
  (9, '2026-04-18 13:05:00+08', NULL, 'Add', 'inventory', jsonb_build_object('item_name','Zinc Syrup','category','Medicines','quantity',20,'unit','bottle'), 'Approved', '07777777-7777-4777-8777-777777777777', 'BHW'),
  (10, '2026-04-22 15:20:00+08', NULL, 'Update', 'mother_records', jsonb_build_object('first_name','Joanna','last_name','Villanueva','weeks',37,'risk_level','HIGH RISK'), 'Approved', '44444444-4444-4444-8444-444444444444', 'BHW')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.activity_log (
  id, created_at, action, details, is_read, user_id
) VALUES
  ('30111111-1111-4111-8111-111111111111', '2026-04-01 08:00:00+08', 'Inventory Added', 'Added Iron + Folic Acid stock for BHW clinic', false, NULL),
  ('30222222-2222-4222-8222-222222222222', '2026-04-03 08:20:00+08', 'Inventory Updated', 'Adjusted Ferrous Sulfate stock after physical count', false, NULL),
  ('30333333-3333-4333-8333-333333333333', '2026-04-05 09:20:00+08', 'Request Denied', 'Denied deletion request for Vitamin A vials', false, NULL),
  ('30444444-4444-4444-8444-444444444444', '2026-04-07 10:10:00+08', 'Maternal Record Updated', 'Updated Angela Reyes pregnancy status', false, NULL),
  ('30555555-5555-4555-8555-555555555555', '2026-04-09 11:10:00+08', 'Child Record Created', 'New child record queued for review', false, NULL),
  ('30666666-6666-4666-8666-666666666666', '2026-04-11 08:50:00+08', 'Inventory Critical', 'Tetanus Vaccine dropped below threshold', false, NULL),
  ('30777777-7777-4777-8777-777777777777', '2026-04-14 09:30:00+08', 'Maternal Record Added', 'New maternal profile queued for approval', false, NULL),
  ('30888888-8888-4888-8888-888888888888', '2026-04-16 10:45:00+08', 'Child Nutrition Updated', 'Updated nutrition status for Sophia Villanueva', false, NULL),
  ('30999999-9999-4999-8999-999999999999', '2026-04-18 13:10:00+08', 'Inventory Added', 'Added Zinc Syrup to medicines stock', false, NULL),
  ('30aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-04-22 15:25:00+08', 'Maternal Risk Escalated', 'Joanna Villanueva marked HIGH RISK', false, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval('public.requestions_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.requestions), 1), true);

COMMIT;