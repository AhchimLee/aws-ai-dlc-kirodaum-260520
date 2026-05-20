--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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

--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.stores VALUES ('852c9522-9cc2-4309-aa61-f28010f385b8', 'tasty', '맛있는식당', '2026-05-20 06:57:57.685847+00', '2026-05-20 06:57:57.685851+00');
INSERT INTO public.stores VALUES ('63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 'dragon', '용궁반점', '2026-05-20 07:05:54.539399+00', '2026-05-20 07:05:54.539402+00');
INSERT INTO public.stores VALUES ('26c4314f-922a-4c35-9e3e-c7a5aaf27055', 'sushi', '스시오마카세', '2026-05-20 07:05:54.830209+00', '2026-05-20 07:05:54.830211+00');
INSERT INTO public.stores VALUES ('9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 'morning', '모닝카페', '2026-05-20 07:05:55.10872+00', '2026-05-20 07:05:55.108723+00');


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admins VALUES ('a235e87f-58ab-4639-9469-200d72acbe44', '852c9522-9cc2-4309-aa61-f28010f385b8', 'admin', '$2b$12$lief17mAgP3qWaEyWeOcu.A.M2sKweS0tm09W90YoEi0h6z6bTssS', '2026-05-20 06:57:57.961622+00');
INSERT INTO public.admins VALUES ('d1f0d1da-f463-4a30-8dac-8051e751aaaa', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 'admin', '$2b$12$5ZNY/K1.L9HJ8SNAMshaROjP6s8DHfHhq576leSs95/SerkEnz5IG', '2026-05-20 07:05:54.791505+00');
INSERT INTO public.admins VALUES ('5133bf4c-86a8-4365-884e-0dcc78d77cf6', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 'admin', '$2b$12$Tbhb7UQypXYz5JrOChO.bOWeLTXe70w3WxVhplRJGHyCIzVLazJb2', '2026-05-20 07:05:55.073931+00');
INSERT INTO public.admins VALUES ('bf556a81-aa33-47ce-801c-62a904af11ee', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 'admin', '$2b$12$8Ns8YGsEW7UGNMQA/ysxsOFdE3RY7ipZe.jJoXtEuPLaoapL5mK6a', '2026-05-20 07:05:55.36301+00');


--
-- Data for Name: idempotency_keys; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.idempotency_keys VALUES ('5b5b3506-7050-417c-8742-e4440d81a5f3', '5662ce71-0478-48c7-99e4-361b133f532a', '852c9522-9cc2-4309-aa61-f28010f385b8', '11111111-1111-1111-1111-111111111111', '2026-05-20 07:00:39.664093+00', '2026-05-21 07:00:39.664094+00');
INSERT INTO public.idempotency_keys VALUES ('d3cfd1d5-c78c-4b80-bb2d-79e78ee1a378', 'be16db3c-5d61-46a2-b2fd-71149233ec67', '852c9522-9cc2-4309-aa61-f28010f385b8', '11111111-1111-1111-1111-111111111111', '2026-05-20 07:10:42.13915+00', '2026-05-21 07:10:42.139151+00');


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.menu_items VALUES ('e7d4d8d2-5217-4f1f-a917-1f8f4d313b53', '852c9522-9cc2-4309-aa61-f28010f385b8', '김치찌개', 9000, '돼지고기 김치찌개', '메인', '', false, '2026-05-20 06:57:58.33271+00', '2026-05-20 06:57:58.332711+00');
INSERT INTO public.menu_items VALUES ('d7f8f74e-9d13-41d3-a7bd-50f38e90eb44', '852c9522-9cc2-4309-aa61-f28010f385b8', '된장찌개', 8000, '두부 된장찌개', '메인', '', false, '2026-05-20 06:57:58.368003+00', '2026-05-20 06:57:58.368004+00');
INSERT INTO public.menu_items VALUES ('14f4d74a-7a7d-4696-a6b0-0e8ae965a39f', '852c9522-9cc2-4309-aa61-f28010f385b8', '제육볶음', 11000, '매콤 제육볶음', '메인', '', false, '2026-05-20 06:57:58.402254+00', '2026-05-20 06:57:58.402255+00');
INSERT INTO public.menu_items VALUES ('47e5f7ce-d51e-4241-b0a5-d45618c80ff8', '852c9522-9cc2-4309-aa61-f28010f385b8', '공기밥', 1000, '흰쌀밥', '사이드', '', false, '2026-05-20 06:57:58.436611+00', '2026-05-20 06:57:58.436612+00');
INSERT INTO public.menu_items VALUES ('304ca667-d5a1-41aa-b8a7-0770934727af', '852c9522-9cc2-4309-aa61-f28010f385b8', '계란말이', 5000, '부드러운 계란말이', '사이드', '', false, '2026-05-20 06:57:58.47507+00', '2026-05-20 06:57:58.475072+00');
INSERT INTO public.menu_items VALUES ('263cbeda-0e00-42e7-88d2-b6717486bc00', '852c9522-9cc2-4309-aa61-f28010f385b8', '콜라', 2000, '코카콜라 355ml', '음료', '', false, '2026-05-20 06:57:58.510328+00', '2026-05-20 06:57:58.510329+00');
INSERT INTO public.menu_items VALUES ('5075d9b3-4bc2-4761-8487-ebd2f9545bb8', '852c9522-9cc2-4309-aa61-f28010f385b8', '사이다', 2000, '칠성사이다 355ml', '음료', '', false, '2026-05-20 06:57:58.544015+00', '2026-05-20 06:57:58.544016+00');
INSERT INTO public.menu_items VALUES ('34a71745-e4dc-488d-9257-6cf679eb229e', '852c9522-9cc2-4309-aa61-f28010f385b8', '소주', 5000, '참이슬', '주류', '', false, '2026-05-20 06:57:58.580426+00', '2026-05-20 06:57:58.580429+00');
INSERT INTO public.menu_items VALUES ('5ccb2291-10ef-4cd2-856c-ea78a0711e38', '852c9522-9cc2-4309-aa61-f28010f385b8', '맥주', 5000, '카스 500ml', '주류', '', false, '2026-05-20 06:57:58.63184+00', '2026-05-20 06:57:58.631849+00');
INSERT INTO public.menu_items VALUES ('cd983b40-fec5-4635-84dd-5c629f3033aa', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '짜장면', 8000, '춘장 짜장면', '면류', '', false, '2026-05-20 07:06:38.429847+00', '2026-05-20 07:06:38.429848+00');
INSERT INTO public.menu_items VALUES ('d3454bc3-e58d-47a3-804a-10586a73ecbb', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '짬뽕', 9000, '해물 짬뽕', '면류', '', false, '2026-05-20 07:06:38.441872+00', '2026-05-20 07:06:38.441873+00');
INSERT INTO public.menu_items VALUES ('0d51ebf2-9506-4a6a-a6c3-7d087d4809ca', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '볶음밥', 9000, '새우 볶음밥', '밥류', '', false, '2026-05-20 07:06:38.453324+00', '2026-05-20 07:06:38.453325+00');
INSERT INTO public.menu_items VALUES ('f129cb2e-6cea-4925-b8c7-7a4e8d3f59e1', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '탕수육', 18000, '바삭 탕수육 (대)', '요리', '', false, '2026-05-20 07:06:38.465362+00', '2026-05-20 07:06:38.465363+00');
INSERT INTO public.menu_items VALUES ('ab912741-6730-42b5-b0f8-f3dfd57c4b0c', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '깐풍기', 20000, '매콤 깐풍기', '요리', '', false, '2026-05-20 07:06:38.476906+00', '2026-05-20 07:06:38.476908+00');
INSERT INTO public.menu_items VALUES ('cb593152-effc-4845-966c-041ad19c44e6', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '군만두', 6000, '고기 군만두 8개', '사이드', '', false, '2026-05-20 07:06:38.488307+00', '2026-05-20 07:06:38.488308+00');
INSERT INTO public.menu_items VALUES ('da63a5ad-0f8a-40a6-85fc-55e7b9e76d23', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '콜라', 2000, '코카콜라', '음료', '', false, '2026-05-20 07:06:38.500159+00', '2026-05-20 07:06:38.50016+00');
INSERT INTO public.menu_items VALUES ('664deac8-13bd-4411-b9c2-485f322a00f0', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', '칭따오', 6000, '칭따오 맥주', '주류', '', false, '2026-05-20 07:06:38.512577+00', '2026-05-20 07:06:38.512578+00');
INSERT INTO public.menu_items VALUES ('e2cf2177-39d1-465e-b227-2f9859091620', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '연어초밥', 3000, '노르웨이 연어', '초밥', '', false, '2026-05-20 07:06:38.789606+00', '2026-05-20 07:06:38.789607+00');
INSERT INTO public.menu_items VALUES ('aeca2487-3418-4ee2-bb5e-128efe4f14f8', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '참치초밥', 4000, '참다랑어', '초밥', '', false, '2026-05-20 07:06:38.802747+00', '2026-05-20 07:06:38.802748+00');
INSERT INTO public.menu_items VALUES ('64bbc826-baa8-4ce0-a6ef-5735ea0b7964', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '새우초밥', 2500, '보탄새우', '초밥', '', false, '2026-05-20 07:06:38.814628+00', '2026-05-20 07:06:38.814629+00');
INSERT INTO public.menu_items VALUES ('650688e0-3775-4161-898c-a2c3e3ab36e3', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '장어초밥', 4500, '민물장어 구이', '초밥', '', false, '2026-05-20 07:06:38.826286+00', '2026-05-20 07:06:38.826288+00');
INSERT INTO public.menu_items VALUES ('8020f7ca-742d-4fea-a7f8-7d2373f0c02a', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '우동', 9000, '가쓰오부시 우동', '면류', '', false, '2026-05-20 07:06:38.838381+00', '2026-05-20 07:06:38.838382+00');
INSERT INTO public.menu_items VALUES ('d1eadfd9-c32b-4cbd-a1d1-df46124aa79f', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '미소시루', 3000, '두부 미소된장국', '사이드', '', false, '2026-05-20 07:06:38.852145+00', '2026-05-20 07:06:38.852146+00');
INSERT INTO public.menu_items VALUES ('b56c59d6-1a44-4abb-a5e7-eb06319aa116', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '사케', 12000, '준마이 다이긴조', '주류', '', false, '2026-05-20 07:06:38.864925+00', '2026-05-20 07:06:38.864926+00');
INSERT INTO public.menu_items VALUES ('8c092c9f-22c3-4ae4-af5e-1b94837a1bdd', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', '아사히', 6000, '아사히 생맥주', '주류', '', false, '2026-05-20 07:06:38.876314+00', '2026-05-20 07:06:38.876315+00');
INSERT INTO public.menu_items VALUES ('822ae4b8-3d44-4302-a9d2-c07f8f11a8cd', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '아메리카노', 4500, '에스프레소 + 물', '커피', '', false, '2026-05-20 07:06:39.152266+00', '2026-05-20 07:06:39.152267+00');
INSERT INTO public.menu_items VALUES ('6fd69f36-91b3-4e65-a450-65d9c8f3e860', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '카페라떼', 5000, '에스프레소 + 우유', '커피', '', false, '2026-05-20 07:06:39.166255+00', '2026-05-20 07:06:39.166256+00');
INSERT INTO public.menu_items VALUES ('61389d77-9e08-4595-b3c9-33c311fdb557', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '바닐라라떼', 5500, '바닐라 시럽 라떼', '커피', '', false, '2026-05-20 07:06:39.179793+00', '2026-05-20 07:06:39.179794+00');
INSERT INTO public.menu_items VALUES ('a43134bc-72c1-4054-9a5d-04fdbd404b8a', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '녹차라떼', 5500, '제주 녹차 라떼', '논커피', '', false, '2026-05-20 07:06:39.19079+00', '2026-05-20 07:06:39.190791+00');
INSERT INTO public.menu_items VALUES ('0b56cfae-7c8e-45d0-acf8-1944236038a8', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '크로와상', 4000, '버터 크로와상', '베이커리', '', false, '2026-05-20 07:06:39.202521+00', '2026-05-20 07:06:39.202522+00');
INSERT INTO public.menu_items VALUES ('e4122442-9874-4096-a5c5-a8684d733c23', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '치즈케이크', 6500, '바스크 치즈케이크', '베이커리', '', false, '2026-05-20 07:06:39.214294+00', '2026-05-20 07:06:39.214295+00');
INSERT INTO public.menu_items VALUES ('73e1bab4-9eb8-4722-911c-78a0cbca46e5', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '오렌지주스', 5000, '생과일 오렌지', '음료', '', false, '2026-05-20 07:06:39.225632+00', '2026-05-20 07:06:39.225633+00');
INSERT INTO public.menu_items VALUES ('c6a3055c-d143-470b-b9d6-dfab1e4c824e', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', '스무디', 6000, '딸기 바나나 스무디', '음료', '', false, '2026-05-20 07:06:39.237403+00', '2026-05-20 07:06:39.237405+00');


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111111', '852c9522-9cc2-4309-aa61-f28010f385b8', 1, 'table1', '2026-05-20 06:58:18.858958+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111112', '852c9522-9cc2-4309-aa61-f28010f385b8', 2, 'table2', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111113', '852c9522-9cc2-4309-aa61-f28010f385b8', 3, 'table3', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111114', '852c9522-9cc2-4309-aa61-f28010f385b8', 4, 'table4', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111115', '852c9522-9cc2-4309-aa61-f28010f385b8', 5, 'table5', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111116', '852c9522-9cc2-4309-aa61-f28010f385b8', 6, 'table6', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111117', '852c9522-9cc2-4309-aa61-f28010f385b8', 7, 'table7', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111118', '852c9522-9cc2-4309-aa61-f28010f385b8', 8, 'table8', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-111111111119', '852c9522-9cc2-4309-aa61-f28010f385b8', 9, 'table9', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('11111111-1111-1111-1111-11111111111a', '852c9522-9cc2-4309-aa61-f28010f385b8', 10, 'table10', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222221', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 1, 'table1', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222222', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 2, 'table2', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222223', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 3, 'table3', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222224', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 4, 'table4', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222225', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 5, 'table5', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222226', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 6, 'table6', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222227', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 7, 'table7', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222228', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 8, 'table8', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-222222222229', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 9, 'table9', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('22222222-2222-2222-2222-22222222222a', '63da7dd1-61b2-4ee0-84ea-9f6ede3654ca', 10, 'table10', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333331', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 1, 'table1', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333332', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 2, 'table2', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333333', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 3, 'table3', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333334', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 4, 'table4', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333335', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 5, 'table5', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333336', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 6, 'table6', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333337', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 7, 'table7', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333338', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 8, 'table8', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-333333333339', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 9, 'table9', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('33333333-3333-3333-3333-33333333333a', '26c4314f-922a-4c35-9e3e-c7a5aaf27055', 10, 'table10', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444441', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 1, 'table1', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444442', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 2, 'table2', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444443', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 3, 'table3', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444444', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 4, 'table4', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444445', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 5, 'table5', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444446', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 6, 'table6', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444447', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 7, 'table7', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444448', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 8, 'table8', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-444444444449', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 9, 'table9', '2026-05-20 07:06:18.132657+00');
INSERT INTO public.tables VALUES ('44444444-4444-4444-4444-44444444444a', '9e6006b6-e9d7-4fc5-a2b7-63510b2dc9ac', 10, 'table10', '2026-05-20 07:06:18.132657+00');


--
-- Data for Name: table_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.table_sessions VALUES ('09cce8db-de0f-4daf-8f69-84c9bbc7f83b', '11111111-1111-1111-1111-111111111111', '852c9522-9cc2-4309-aa61-f28010f385b8', 'ACTIVE', '2026-05-20 07:00:39.658948+00', NULL);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders VALUES ('ae3345ea-b562-49df-baae-b633fc61c95c', 'ORD-1FB974AF', '852c9522-9cc2-4309-aa61-f28010f385b8', '11111111-1111-1111-1111-111111111111', '09cce8db-de0f-4daf-8f69-84c9bbc7f83b', 'PREPARING', 29000, '2026-05-20 07:10:42.138435+00', '2026-05-20 07:10:51.227087+00');


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items VALUES ('b7655eeb-495b-4025-8aa1-fa11b77a3db3', 'ae3345ea-b562-49df-baae-b633fc61c95c', 'e7d4d8d2-5217-4f1f-a917-1f8f4d313b53', '김치찌개', 9000, 1);
INSERT INTO public.order_items VALUES ('e4bc014c-7a0d-472c-b949-0be84a6d3720', 'ae3345ea-b562-49df-baae-b633fc61c95c', 'd7f8f74e-9d13-41d3-a7bd-50f38e90eb44', '된장찌개', 8000, 2);
INSERT INTO public.order_items VALUES ('7bf19862-796c-4d91-9a33-1508094f454d', 'ae3345ea-b562-49df-baae-b633fc61c95c', '263cbeda-0e00-42e7-88d2-b6717486bc00', '콜라', 2000, 1);
INSERT INTO public.order_items VALUES ('fed394b7-8b48-48a8-b78b-86f812bdb471', 'ae3345ea-b562-49df-baae-b633fc61c95c', '5075d9b3-4bc2-4761-8487-ebd2f9545bb8', '사이다', 2000, 1);


--
-- PostgreSQL database dump complete
--


