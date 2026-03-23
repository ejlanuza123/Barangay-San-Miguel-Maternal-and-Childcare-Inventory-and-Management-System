-- Strict non-redundancy: keep contact number only in child_records.
ALTER TABLE public.child_measurements
DROP COLUMN IF EXISTS contact_no;

-- Signature entry removed from weekly monitoring feature.
ALTER TABLE public.child_measurements
DROP COLUMN IF EXISTS signature;
