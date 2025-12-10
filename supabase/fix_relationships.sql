-- Adiciona a constraint de chave estrangeira se ela ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_checklists_users') THEN
    ALTER TABLE public.checklists
    ADD CONSTRAINT fk_checklists_users
    FOREIGN KEY (created_by)
    REFERENCES public.users (id);
  END IF;
END $$;