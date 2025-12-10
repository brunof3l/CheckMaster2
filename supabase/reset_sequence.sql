BEGIN;
CREATE OR REPLACE FUNCTION public.reset_checklist_seq_if_empty() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.checklists LIMIT 1) THEN
    EXECUTE 'ALTER SEQUENCE public.checklist_seq RESTART WITH 1';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reset_seq ON public.checklists;
CREATE TRIGGER trg_reset_seq
AFTER DELETE ON public.checklists
FOR EACH STATEMENT
EXECUTE FUNCTION public.reset_checklist_seq_if_empty();
COMMIT;
