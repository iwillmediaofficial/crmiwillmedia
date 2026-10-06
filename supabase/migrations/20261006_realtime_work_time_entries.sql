-- Enable realtime publication for work_time_entries so admins receive live timer updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'work_time_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_time_entries;
  END IF;
END $$;
