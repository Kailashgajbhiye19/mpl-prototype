--
-- PostgreSQL database dump
--


-- Dumped from database version 18.7
-- Dumped by pg_dump version 18.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    email character varying(100),
    name text,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    is_active boolean DEFAULT true
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    village text,
    block text,
    district text,
    state text DEFAULT 'Chhattisgarh'::text,
    pincode character varying(10),
    latitude double precision,
    longitude double precision,
    address_line text,
    created_at timestamp with time zone DEFAULT now(),
    district_cd integer,
    block_cd integer,
    city character varying(255),
    country_name character varying(255),
    country_code character varying(20),
    state_name character varying(255),
    state_code character varying(20)
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: mst_cluster; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mst_cluster (
    id integer NOT NULL,
    district_cd bigint,
    district_name character varying(50),
    block_cd bigint,
    block_name character varying(50),
    cluster_cd bigint,
    cluster_name character varying(50)
);


--
-- Name: mst_cluster_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mst_cluster_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mst_cluster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mst_cluster_id_seq OWNED BY public.mst_cluster.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants (
    id integer NOT NULL,
    trainer_id integer NOT NULL,
    name text NOT NULL,
    phone character varying(15),
    training text,
    caste text,
    village text,
    attendance_status character varying(20),
    age integer,
    education text,
    created_at timestamp with time zone DEFAULT now(),
    training_id integer,
    profile_image_url text,
    category text
);


--
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participants_id_seq OWNED BY public.participants.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: trainers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainers (
    id integer NOT NULL,
    name character varying(255),
    email character varying(255),
    phone character varying(50),
    bio text,
    profile_image_url text,
    created_at timestamp without time zone
);


--
-- Name: training_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_attendance (
    id integer NOT NULL,
    participant_id integer NOT NULL,
    training_id integer NOT NULL,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: training_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_attendance_id_seq OWNED BY public.training_attendance.id;


--
-- Name: training_center_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_center_photos (
    id integer NOT NULL,
    training_id integer NOT NULL,
    photo_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: training_center_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_center_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_center_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_center_photos_id_seq OWNED BY public.training_center_photos.id;


--
-- Name: training_participant_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_participant_photos (
    id integer NOT NULL,
    participant_id integer NOT NULL,
    training_id integer NOT NULL,
    photo_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: training_participant_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_participant_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_participant_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_participant_photos_id_seq OWNED BY public.training_participant_photos.id;


--
-- Name: trainings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainings (
    id integer NOT NULL,
    trainer_id integer NOT NULL,
    subject_id integer NOT NULL,
    location_id integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    max_participants integer DEFAULT 50,
    actual_participants integer DEFAULT 0,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    trainer_name character varying(255),
    subject character varying(255),
    village character varying(255),
    block character varying(255),
    district character varying(255),
    training_type text,
    CONSTRAINT trainings_status_check CHECK (((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('ongoing'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


--
-- Name: trainings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trainings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trainings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trainings_id_seq OWNED BY public.trainings.id;


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: mst_cluster id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mst_cluster ALTER COLUMN id SET DEFAULT nextval('public.mst_cluster_id_seq'::regclass);


--
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants ALTER COLUMN id SET DEFAULT nextval('public.participants_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: training_attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance ALTER COLUMN id SET DEFAULT nextval('public.training_attendance_id_seq'::regclass);


--
-- Name: training_center_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_center_photos ALTER COLUMN id SET DEFAULT nextval('public.training_center_photos_id_seq'::regclass);


--
-- Name: training_participant_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_participant_photos ALTER COLUMN id SET DEFAULT nextval('public.training_participant_photos_id_seq'::regclass);


--
-- Name: trainings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings ALTER COLUMN id SET DEFAULT nextval('public.trainings_id_seq'::regclass);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: mst_cluster mst_cluster_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mst_cluster
    ADD CONSTRAINT mst_cluster_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: trainers trainers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainers
    ADD CONSTRAINT trainers_pkey PRIMARY KEY (id);


--
-- Name: training_attendance training_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_pkey PRIMARY KEY (id);


--
-- Name: training_center_photos training_center_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_center_photos
    ADD CONSTRAINT training_center_photos_pkey PRIMARY KEY (id);


--
-- Name: training_participant_photos training_participant_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_participant_photos
    ADD CONSTRAINT training_participant_photos_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_users_username ON public.admin_users USING btree (username);


--
-- Name: idx_mst_cluster_block_cd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mst_cluster_block_cd ON public.mst_cluster USING btree (block_cd);


--
-- Name: idx_mst_cluster_cluster_cd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mst_cluster_cluster_cd ON public.mst_cluster USING btree (cluster_cd);


--
-- Name: idx_mst_cluster_cluster_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mst_cluster_cluster_name ON public.mst_cluster USING btree (cluster_name);


--
-- Name: idx_mst_cluster_district_cd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mst_cluster_district_cd ON public.mst_cluster USING btree (district_cd);


--
-- Name: idx_participant_photos_participant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participant_photos_participant ON public.training_participant_photos USING btree (participant_id);


--
-- Name: idx_training_center_photos_training; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_training_center_photos_training ON public.training_center_photos USING btree (training_id);


--
-- Name: idx_trainings_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainings_date ON public.trainings USING btree (start_date);


--
-- Name: idx_trainings_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainings_location ON public.trainings USING btree (location_id);


--
-- Name: idx_trainings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainings_status ON public.trainings USING btree (status);


--
-- Name: idx_trainings_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainings_subject ON public.trainings USING btree (subject_id);


--
-- Name: idx_trainings_trainer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainings_trainer ON public.trainings USING btree (trainer_id);


--
-- Name: participants fk_participants_training; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT fk_participants_training FOREIGN KEY (training_id) REFERENCES public.trainings(id);


--
-- Name: training_attendance training_attendance_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: training_center_photos training_center_photos_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_center_photos
    ADD CONSTRAINT training_center_photos_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: training_participant_photos training_participant_photos_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_participant_photos
    ADD CONSTRAINT training_participant_photos_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON DELETE CASCADE;


--
-- Name: trainings trainings_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: trainings trainings_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


