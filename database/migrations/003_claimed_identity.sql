-- The name or organization a scammer claimed to be (e.g. "John from KCB Bank"), as told by the reporter.
-- Sender checks show these claimed names so users can see when one number poses as several organizations.
alter table public.scam_reports add column if not exists claimed_identity text check (char_length(claimed_identity) <= 120);
