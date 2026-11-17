CREATE SEQUENCE IF NOT EXISTS public.trainers_id_seq;
ALTER SEQUENCE public.trainers_id_seq OWNED BY public.trainers.id;
ALTER TABLE public.trainers
  ALTER COLUMN id SET DEFAULT nextval('public.trainers_id_seq'::regclass);

SELECT setval(
  'public.trainers_id_seq'::regclass,
  COALESCE((SELECT MAX(id) FROM public.trainers), 1),
  EXISTS (SELECT 1 FROM public.trainers)
);
