--
-- PostgreSQL database dump
--

\restrict LQk23b1N1XxIWZm39YJ0ZCSG1aeyeJm2Vm26X4OhfoG6jBfoAtbIgodSiKb4dY3

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.articles (
    id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    content text NOT NULL,
    price integer NOT NULL,
    category character varying(100) NOT NULL,
    author character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.articles OWNER TO postgres;

--
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    author character varying(255) NOT NULL,
    price integer NOT NULL,
    category character varying(100) NOT NULL,
    cover_url character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.books OWNER TO postgres;

--
-- Name: daily_practices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_practices (
    id character varying(50) NOT NULL,
    date character varying(10) NOT NULL,
    orientation_text text NOT NULL,
    orientation_author character varying(255) NOT NULL,
    insight_text text NOT NULL,
    reflection_prompt text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_practices OWNER TO postgres;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchases (
    id character varying(50) NOT NULL,
    user_id character varying(50) NOT NULL,
    article_id character varying(50),
    book_id character varying(50),
    amount integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    stripe_payment_id character varying(255)
);


ALTER TABLE public.purchases OWNER TO postgres;

--
-- Name: quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotes (
    id character varying(50) NOT NULL,
    text text NOT NULL,
    author character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    date_scheduled character varying(10) NOT NULL
);


ALTER TABLE public.quotes OWNER TO postgres;

--
-- Name: return_followups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_followups (
    id character varying(50) NOT NULL,
    return_id character varying(50) NOT NULL,
    note_text text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.return_followups OWNER TO postgres;

--
-- Name: return_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_reactions (
    id character varying(50) NOT NULL,
    return_id character varying(50) NOT NULL,
    user_id character varying(50) NOT NULL,
    reaction_type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.return_reactions OWNER TO postgres;

--
-- Name: returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returns (
    id character varying(50) NOT NULL,
    user_id character varying(50) NOT NULL,
    practice_date character varying(10) NOT NULL,
    reflection_text text NOT NULL,
    commitment_text text NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    delete_allowed_until timestamp without time zone NOT NULL
);


ALTER TABLE public.returns OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    user_id character varying(50) NOT NULL,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    status character varying(50) NOT NULL,
    plan character varying(50) NOT NULL,
    current_period_end timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    verification_token character varying(255),
    verification_token_expires timestamp without time zone,
    reset_token character varying(255),
    reset_token_expires timestamp without time zone,
    social_provider character varying(50),
    social_id character varying(255),
    timezone character varying(64) DEFAULT 'UTC'::character varying NOT NULL,
    interests text DEFAULT '[]'::text NOT NULL,
    founding_member boolean DEFAULT false NOT NULL,
    founding_discount_percent integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.articles (id, title, description, content, price, category, author, created_at, updated_at) FROM stdin;
article_1	The Power of Mindset	Mindset shapes outcomes.	Full content here...	0	Mindset	Return	2026-02-28 13:05:38.607175	2026-02-28 13:05:38.607175
article_2	Building Discipline	Discipline builds freedom.	Full content here...	0	Discipline	Return	2026-02-28 13:05:38.607175	2026-02-28 13:05:38.607175
article_3	Conscious Awareness	Awareness changes action.	Full content here...	0	Consciousness	Return	2026-02-28 13:05:38.607175	2026-02-28 13:05:38.607175
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, title, description, author, price, category, cover_url, created_at) FROM stdin;
\.


--
-- Data for Name: daily_practices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_practices (id, date, orientation_text, orientation_author, insight_text, reflection_prompt, created_at) FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchases (id, user_id, article_id, book_id, amount, created_at, stripe_payment_id) FROM stdin;
\.


--
-- Data for Name: quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotes (id, text, author, source, category, date_scheduled) FROM stdin;
quote_1772244540	Discipline is the bridge between intention and transformation.	Return	Return Daily Quote	Mindset	2026-02-28
\.


--
-- Data for Name: return_followups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_followups (id, return_id, note_text, created_at) FROM stdin;
\.


--
-- Data for Name: return_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_reactions (id, return_id, user_id, reaction_type, created_at) FROM stdin;
\.


--
-- Data for Name: returns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returns (id, user_id, practice_date, reflection_text, commitment_text, is_public, created_at, deleted_at, delete_allowed_until) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password_hash, created_at, email_verified, verification_token, verification_token_expires, reset_token, reset_token_expires, social_provider, social_id, timezone, interests, founding_member, founding_discount_percent) FROM stdin;
user_1772239711338	test1@return.app	Test User	$2b$10$IgkIiEk.u/2kbazgMc98S.sNZIIsvHWrccwTmNCkLEt8xzMci1r8G	2026-02-28 00:48:31.341408	f	9d0bb40dea72a22bb882679ae72eca1023738fa3bd8d55d1f342fd8c2819face	2026-03-01 00:48:31.338	\N	\N	\N	\N	UTC	[]	f	0
user_1772250267121	test4@return.app	Test User 4	$2b$10$4fakt..iTtWD3CqyqBi5Z.NVdxftEd/IpHh.tqOu2FrAnV3PSt19u	2026-02-28 03:44:27.123183	f	4e9882cafb8844e3c1d7fdc2acc094bc531d67ec21b712cf2ac56e9e6d897053	2026-03-01 03:44:27.121	\N	\N	\N	\N	UTC	["Mindset","Discipline","Consciousness"]	f	0
user_1772242660935	sorinvladutpetrariu@gmail.com	Test User	$2b$10$9rAa/z6zIZAn8DTGxCu.gOe8e/dZvZRI6ClVOhFSnonzKCrFTgLVi	2026-02-28 01:37:40.950503	t	\N	\N	\N	\N	\N	\N	UTC	["Mindset","Discipline","Consciousness"]	f	0
\.


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: daily_practices daily_practices_date_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_practices
    ADD CONSTRAINT daily_practices_date_unique UNIQUE (date);


--
-- Name: daily_practices daily_practices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_practices
    ADD CONSTRAINT daily_practices_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: return_followups return_followups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_followups
    ADD CONSTRAINT return_followups_pkey PRIMARY KEY (id);


--
-- Name: return_reactions return_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_reactions
    ADD CONSTRAINT return_reactions_pkey PRIMARY KEY (id);


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict LQk23b1N1XxIWZm39YJ0ZCSG1aeyeJm2Vm26X4OhfoG6jBfoAtbIgodSiKb4dY3

