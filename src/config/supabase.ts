import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://plzqmhbklqvagugadksj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsenFtaGJrbHF2YWd1Z2Fka3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTc1MDUsImV4cCI6MjA4MDE3MzUwNX0.iPwVZgkp-SFw3L0CbXDUfi_LRAcjYfAit74oXUYQUPM'
)

