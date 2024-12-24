create extension if not exists "vector" with schema "public" version '0.8.0';

create sequence "public"."migrations_id_seq";

create table "public"."apikey" (
    "id" uuid not null default uuid_generate_v4(),
    "apiKey" character varying not null,
    "apiSecret" character varying not null,
    "keyName" character varying not null,
    "updatedDate" timestamp without time zone not null default now()
);


create table "public"."assistant" (
    "id" uuid not null default uuid_generate_v4(),
    "credential" uuid not null,
    "details" text not null,
    "iconSrc" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "type" text
);


create table "public"."chat_flow" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying not null,
    "flowData" text not null,
    "deployed" boolean,
    "isPublic" boolean,
    "apikeyid" character varying,
    "chatbotConfig" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "apiConfig" text,
    "analytic" text,
    "category" text,
    "speechToText" text,
    "type" text,
    "followUpPrompts" text
);


create table "public"."chat_message" (
    "id" uuid not null default uuid_generate_v4(),
    "role" character varying not null,
    "chatflowid" uuid not null,
    "content" text not null,
    "sourceDocuments" text,
    "createdDate" timestamp without time zone not null default now(),
    "chatType" character varying not null default 'INTERNAL'::character varying,
    "chatId" character varying not null,
    "memoryType" character varying,
    "sessionId" character varying,
    "usedTools" text,
    "fileAnnotations" text,
    "fileUploads" text,
    "leadEmail" text,
    "agentReasoning" text,
    "action" text,
    "artifacts" text,
    "followUpPrompts" text
);


create table "public"."chat_message_feedback" (
    "id" uuid not null default uuid_generate_v4(),
    "chatflowid" uuid not null,
    "content" text,
    "chatId" character varying not null,
    "messageId" uuid not null,
    "rating" character varying not null,
    "createdDate" timestamp without time zone not null default now()
);


create table "public"."credential" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying not null,
    "credentialName" character varying not null,
    "encryptedData" text not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
);


create table "public"."custom_template" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying not null,
    "flowData" text not null,
    "description" character varying,
    "badge" character varying,
    "framework" character varying,
    "usecases" character varying,
    "type" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
);


create table "public"."document_store" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying not null,
    "description" character varying,
    "loaders" text,
    "whereUsed" text,
    "status" character varying not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "vectorStoreConfig" text,
    "embeddingConfig" text,
    "recordManagerConfig" text
);


create table "public"."document_store_file_chunk" (
    "id" uuid not null default uuid_generate_v4(),
    "docId" uuid not null,
    "chunkNo" integer not null,
    "storeId" uuid not null,
    "pageContent" text,
    "metadata" text
);


create table "public"."documents" (
    "id" text not null,
    "content" text,
    "metadata" jsonb,
    "embedding" vector(1536)
);


create table "public"."lead" (
    "id" uuid not null default uuid_generate_v4(),
    "chatflowid" character varying not null,
    "chatId" character varying not null,
    "name" text,
    "email" text,
    "phone" text,
    "createdDate" timestamp without time zone not null default now()
);


create table "public"."migrations" (
    "id" integer not null default nextval('migrations_id_seq'::regclass),
    "timestamp" bigint not null,
    "name" character varying not null
);


create table "public"."ollama_documents" (
    "id" text not null,
    "content" text,
    "metadata" jsonb,
    "embedding" vector(786)
);


create table "public"."tool" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying not null,
    "description" text not null,
    "color" character varying not null,
    "iconSrc" character varying,
    "schema" text,
    "func" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
);


create table "public"."upsert_history" (
    "id" uuid not null default uuid_generate_v4(),
    "chatflowid" character varying not null,
    "result" text not null,
    "flowData" text not null,
    "date" timestamp without time zone not null default now()
);


create table "public"."variable" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying not null,
    "value" text not null,
    "type" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
);


alter sequence "public"."migrations_id_seq" owned by "public"."migrations"."id";

CREATE INDEX "IDX_9acddcb7a2b51fe37669049fc6" ON public.chat_message_feedback USING btree ("chatId");

CREATE INDEX "IDX_e213b811b01405a42309a6a410" ON public.document_store_file_chunk USING btree ("storeId");

CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON public.chat_message USING btree (chatflowid);

CREATE INDEX "IDX_e76bae1780b77e56aab1h2asd4" ON public.document_store_file_chunk USING btree ("docId");

CREATE INDEX "IDX_f56c36fe42894d57e5c664d229" ON public.chat_message USING btree (chatflowid);

CREATE INDEX "IDX_f56c36fe42894d57e5c664d230" ON public.chat_message_feedback USING btree (chatflowid);

CREATE UNIQUE INDEX "PK_37327b22b6e246319bd5eeb0e88" ON public.upsert_history USING btree (id);

CREATE UNIQUE INDEX "PK_3a5169bcd3d5463cefeec78be82" ON public.credential USING btree (id);

CREATE UNIQUE INDEX "PK_3bf5b1016a384916073184f99b7" ON public.tool USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7a044ac4c92764576cdbf" ON public.assistant USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7d047ac4b91764574cdbf" ON public.chat_flow USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7d087ac4b91764574cdbf" ON public.custom_template USING btree (id);

CREATE UNIQUE INDEX "PK_3cc0d85193aade457d3077dd06b" ON public.chat_message USING btree (id);

CREATE UNIQUE INDEX "PK_8c82d7f526340ab734260ea46be" ON public.migrations USING btree (id);

CREATE UNIQUE INDEX "PK_90005043dd774f54-9830ab78f9" ON public.document_store_file_chunk USING btree (id);

CREATE UNIQUE INDEX "PK_96109043dd704f53-9830ab78f0" ON public.apikey USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f0" ON public.lead USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f8" ON public.variable USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f9" ON public.chat_message_feedback USING btree (id);

CREATE UNIQUE INDEX "PK_98495043dd774f54-9830ab78f9" ON public.document_store USING btree (id);

CREATE UNIQUE INDEX "UQ_6352078b5a294f2d22179ea7956" ON public.chat_message_feedback USING btree ("messageId");

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX ollama_documents_pkey ON public.ollama_documents USING btree (id);

alter table "public"."apikey" add constraint "PK_96109043dd704f53-9830ab78f0" PRIMARY KEY using index "PK_96109043dd704f53-9830ab78f0";

alter table "public"."assistant" add constraint "PK_3c7cea7a044ac4c92764576cdbf" PRIMARY KEY using index "PK_3c7cea7a044ac4c92764576cdbf";

alter table "public"."chat_flow" add constraint "PK_3c7cea7d047ac4b91764574cdbf" PRIMARY KEY using index "PK_3c7cea7d047ac4b91764574cdbf";

alter table "public"."chat_message" add constraint "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY using index "PK_3cc0d85193aade457d3077dd06b";

alter table "public"."chat_message_feedback" add constraint "PK_98419043dd704f54-9830ab78f9" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f9";

alter table "public"."credential" add constraint "PK_3a5169bcd3d5463cefeec78be82" PRIMARY KEY using index "PK_3a5169bcd3d5463cefeec78be82";

alter table "public"."custom_template" add constraint "PK_3c7cea7d087ac4b91764574cdbf" PRIMARY KEY using index "PK_3c7cea7d087ac4b91764574cdbf";

alter table "public"."document_store" add constraint "PK_98495043dd774f54-9830ab78f9" PRIMARY KEY using index "PK_98495043dd774f54-9830ab78f9";

alter table "public"."document_store_file_chunk" add constraint "PK_90005043dd774f54-9830ab78f9" PRIMARY KEY using index "PK_90005043dd774f54-9830ab78f9";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."lead" add constraint "PK_98419043dd704f54-9830ab78f0" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f0";

alter table "public"."migrations" add constraint "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY using index "PK_8c82d7f526340ab734260ea46be";

alter table "public"."ollama_documents" add constraint "ollama_documents_pkey" PRIMARY KEY using index "ollama_documents_pkey";

alter table "public"."tool" add constraint "PK_3bf5b1016a384916073184f99b7" PRIMARY KEY using index "PK_3bf5b1016a384916073184f99b7";

alter table "public"."upsert_history" add constraint "PK_37327b22b6e246319bd5eeb0e88" PRIMARY KEY using index "PK_37327b22b6e246319bd5eeb0e88";

alter table "public"."variable" add constraint "PK_98419043dd704f54-9830ab78f8" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f8";

alter table "public"."chat_message_feedback" add constraint "UQ_6352078b5a294f2d22179ea7956" UNIQUE using index "UQ_6352078b5a294f2d22179ea7956";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.match_ollama_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (ollama_documents.embedding <=> query_embedding) as similarity
  from ollama_documents
  where metadata @> filter
  order by ollama_documents.embedding <=> query_embedding
  limit match_count;
end;
$function$
;

grant delete on table "public"."apikey" to "anon";

grant insert on table "public"."apikey" to "anon";

grant references on table "public"."apikey" to "anon";

grant select on table "public"."apikey" to "anon";

grant trigger on table "public"."apikey" to "anon";

grant truncate on table "public"."apikey" to "anon";

grant update on table "public"."apikey" to "anon";

grant delete on table "public"."apikey" to "authenticated";

grant insert on table "public"."apikey" to "authenticated";

grant references on table "public"."apikey" to "authenticated";

grant select on table "public"."apikey" to "authenticated";

grant trigger on table "public"."apikey" to "authenticated";

grant truncate on table "public"."apikey" to "authenticated";

grant update on table "public"."apikey" to "authenticated";

grant delete on table "public"."apikey" to "service_role";

grant insert on table "public"."apikey" to "service_role";

grant references on table "public"."apikey" to "service_role";

grant select on table "public"."apikey" to "service_role";

grant trigger on table "public"."apikey" to "service_role";

grant truncate on table "public"."apikey" to "service_role";

grant update on table "public"."apikey" to "service_role";

grant delete on table "public"."assistant" to "anon";

grant insert on table "public"."assistant" to "anon";

grant references on table "public"."assistant" to "anon";

grant select on table "public"."assistant" to "anon";

grant trigger on table "public"."assistant" to "anon";

grant truncate on table "public"."assistant" to "anon";

grant update on table "public"."assistant" to "anon";

grant delete on table "public"."assistant" to "authenticated";

grant insert on table "public"."assistant" to "authenticated";

grant references on table "public"."assistant" to "authenticated";

grant select on table "public"."assistant" to "authenticated";

grant trigger on table "public"."assistant" to "authenticated";

grant truncate on table "public"."assistant" to "authenticated";

grant update on table "public"."assistant" to "authenticated";

grant delete on table "public"."assistant" to "service_role";

grant insert on table "public"."assistant" to "service_role";

grant references on table "public"."assistant" to "service_role";

grant select on table "public"."assistant" to "service_role";

grant trigger on table "public"."assistant" to "service_role";

grant truncate on table "public"."assistant" to "service_role";

grant update on table "public"."assistant" to "service_role";

grant delete on table "public"."chat_flow" to "anon";

grant insert on table "public"."chat_flow" to "anon";

grant references on table "public"."chat_flow" to "anon";

grant select on table "public"."chat_flow" to "anon";

grant trigger on table "public"."chat_flow" to "anon";

grant truncate on table "public"."chat_flow" to "anon";

grant update on table "public"."chat_flow" to "anon";

grant delete on table "public"."chat_flow" to "authenticated";

grant insert on table "public"."chat_flow" to "authenticated";

grant references on table "public"."chat_flow" to "authenticated";

grant select on table "public"."chat_flow" to "authenticated";

grant trigger on table "public"."chat_flow" to "authenticated";

grant truncate on table "public"."chat_flow" to "authenticated";

grant update on table "public"."chat_flow" to "authenticated";

grant delete on table "public"."chat_flow" to "service_role";

grant insert on table "public"."chat_flow" to "service_role";

grant references on table "public"."chat_flow" to "service_role";

grant select on table "public"."chat_flow" to "service_role";

grant trigger on table "public"."chat_flow" to "service_role";

grant truncate on table "public"."chat_flow" to "service_role";

grant update on table "public"."chat_flow" to "service_role";

grant delete on table "public"."chat_message" to "anon";

grant insert on table "public"."chat_message" to "anon";

grant references on table "public"."chat_message" to "anon";

grant select on table "public"."chat_message" to "anon";

grant trigger on table "public"."chat_message" to "anon";

grant truncate on table "public"."chat_message" to "anon";

grant update on table "public"."chat_message" to "anon";

grant delete on table "public"."chat_message" to "authenticated";

grant insert on table "public"."chat_message" to "authenticated";

grant references on table "public"."chat_message" to "authenticated";

grant select on table "public"."chat_message" to "authenticated";

grant trigger on table "public"."chat_message" to "authenticated";

grant truncate on table "public"."chat_message" to "authenticated";

grant update on table "public"."chat_message" to "authenticated";

grant delete on table "public"."chat_message" to "service_role";

grant insert on table "public"."chat_message" to "service_role";

grant references on table "public"."chat_message" to "service_role";

grant select on table "public"."chat_message" to "service_role";

grant trigger on table "public"."chat_message" to "service_role";

grant truncate on table "public"."chat_message" to "service_role";

grant update on table "public"."chat_message" to "service_role";

grant delete on table "public"."chat_message_feedback" to "anon";

grant insert on table "public"."chat_message_feedback" to "anon";

grant references on table "public"."chat_message_feedback" to "anon";

grant select on table "public"."chat_message_feedback" to "anon";

grant trigger on table "public"."chat_message_feedback" to "anon";

grant truncate on table "public"."chat_message_feedback" to "anon";

grant update on table "public"."chat_message_feedback" to "anon";

grant delete on table "public"."chat_message_feedback" to "authenticated";

grant insert on table "public"."chat_message_feedback" to "authenticated";

grant references on table "public"."chat_message_feedback" to "authenticated";

grant select on table "public"."chat_message_feedback" to "authenticated";

grant trigger on table "public"."chat_message_feedback" to "authenticated";

grant truncate on table "public"."chat_message_feedback" to "authenticated";

grant update on table "public"."chat_message_feedback" to "authenticated";

grant delete on table "public"."chat_message_feedback" to "service_role";

grant insert on table "public"."chat_message_feedback" to "service_role";

grant references on table "public"."chat_message_feedback" to "service_role";

grant select on table "public"."chat_message_feedback" to "service_role";

grant trigger on table "public"."chat_message_feedback" to "service_role";

grant truncate on table "public"."chat_message_feedback" to "service_role";

grant update on table "public"."chat_message_feedback" to "service_role";

grant delete on table "public"."credential" to "anon";

grant insert on table "public"."credential" to "anon";

grant references on table "public"."credential" to "anon";

grant select on table "public"."credential" to "anon";

grant trigger on table "public"."credential" to "anon";

grant truncate on table "public"."credential" to "anon";

grant update on table "public"."credential" to "anon";

grant delete on table "public"."credential" to "authenticated";

grant insert on table "public"."credential" to "authenticated";

grant references on table "public"."credential" to "authenticated";

grant select on table "public"."credential" to "authenticated";

grant trigger on table "public"."credential" to "authenticated";

grant truncate on table "public"."credential" to "authenticated";

grant update on table "public"."credential" to "authenticated";

grant delete on table "public"."credential" to "service_role";

grant insert on table "public"."credential" to "service_role";

grant references on table "public"."credential" to "service_role";

grant select on table "public"."credential" to "service_role";

grant trigger on table "public"."credential" to "service_role";

grant truncate on table "public"."credential" to "service_role";

grant update on table "public"."credential" to "service_role";

grant delete on table "public"."custom_template" to "anon";

grant insert on table "public"."custom_template" to "anon";

grant references on table "public"."custom_template" to "anon";

grant select on table "public"."custom_template" to "anon";

grant trigger on table "public"."custom_template" to "anon";

grant truncate on table "public"."custom_template" to "anon";

grant update on table "public"."custom_template" to "anon";

grant delete on table "public"."custom_template" to "authenticated";

grant insert on table "public"."custom_template" to "authenticated";

grant references on table "public"."custom_template" to "authenticated";

grant select on table "public"."custom_template" to "authenticated";

grant trigger on table "public"."custom_template" to "authenticated";

grant truncate on table "public"."custom_template" to "authenticated";

grant update on table "public"."custom_template" to "authenticated";

grant delete on table "public"."custom_template" to "service_role";

grant insert on table "public"."custom_template" to "service_role";

grant references on table "public"."custom_template" to "service_role";

grant select on table "public"."custom_template" to "service_role";

grant trigger on table "public"."custom_template" to "service_role";

grant truncate on table "public"."custom_template" to "service_role";

grant update on table "public"."custom_template" to "service_role";

grant delete on table "public"."document_store" to "anon";

grant insert on table "public"."document_store" to "anon";

grant references on table "public"."document_store" to "anon";

grant select on table "public"."document_store" to "anon";

grant trigger on table "public"."document_store" to "anon";

grant truncate on table "public"."document_store" to "anon";

grant update on table "public"."document_store" to "anon";

grant delete on table "public"."document_store" to "authenticated";

grant insert on table "public"."document_store" to "authenticated";

grant references on table "public"."document_store" to "authenticated";

grant select on table "public"."document_store" to "authenticated";

grant trigger on table "public"."document_store" to "authenticated";

grant truncate on table "public"."document_store" to "authenticated";

grant update on table "public"."document_store" to "authenticated";

grant delete on table "public"."document_store" to "service_role";

grant insert on table "public"."document_store" to "service_role";

grant references on table "public"."document_store" to "service_role";

grant select on table "public"."document_store" to "service_role";

grant trigger on table "public"."document_store" to "service_role";

grant truncate on table "public"."document_store" to "service_role";

grant update on table "public"."document_store" to "service_role";

grant delete on table "public"."document_store_file_chunk" to "anon";

grant insert on table "public"."document_store_file_chunk" to "anon";

grant references on table "public"."document_store_file_chunk" to "anon";

grant select on table "public"."document_store_file_chunk" to "anon";

grant trigger on table "public"."document_store_file_chunk" to "anon";

grant truncate on table "public"."document_store_file_chunk" to "anon";

grant update on table "public"."document_store_file_chunk" to "anon";

grant delete on table "public"."document_store_file_chunk" to "authenticated";

grant insert on table "public"."document_store_file_chunk" to "authenticated";

grant references on table "public"."document_store_file_chunk" to "authenticated";

grant select on table "public"."document_store_file_chunk" to "authenticated";

grant trigger on table "public"."document_store_file_chunk" to "authenticated";

grant truncate on table "public"."document_store_file_chunk" to "authenticated";

grant update on table "public"."document_store_file_chunk" to "authenticated";

grant delete on table "public"."document_store_file_chunk" to "service_role";

grant insert on table "public"."document_store_file_chunk" to "service_role";

grant references on table "public"."document_store_file_chunk" to "service_role";

grant select on table "public"."document_store_file_chunk" to "service_role";

grant trigger on table "public"."document_store_file_chunk" to "service_role";

grant truncate on table "public"."document_store_file_chunk" to "service_role";

grant update on table "public"."document_store_file_chunk" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."lead" to "anon";

grant insert on table "public"."lead" to "anon";

grant references on table "public"."lead" to "anon";

grant select on table "public"."lead" to "anon";

grant trigger on table "public"."lead" to "anon";

grant truncate on table "public"."lead" to "anon";

grant update on table "public"."lead" to "anon";

grant delete on table "public"."lead" to "authenticated";

grant insert on table "public"."lead" to "authenticated";

grant references on table "public"."lead" to "authenticated";

grant select on table "public"."lead" to "authenticated";

grant trigger on table "public"."lead" to "authenticated";

grant truncate on table "public"."lead" to "authenticated";

grant update on table "public"."lead" to "authenticated";

grant delete on table "public"."lead" to "service_role";

grant insert on table "public"."lead" to "service_role";

grant references on table "public"."lead" to "service_role";

grant select on table "public"."lead" to "service_role";

grant trigger on table "public"."lead" to "service_role";

grant truncate on table "public"."lead" to "service_role";

grant update on table "public"."lead" to "service_role";

grant delete on table "public"."migrations" to "anon";

grant insert on table "public"."migrations" to "anon";

grant references on table "public"."migrations" to "anon";

grant select on table "public"."migrations" to "anon";

grant trigger on table "public"."migrations" to "anon";

grant truncate on table "public"."migrations" to "anon";

grant update on table "public"."migrations" to "anon";

grant delete on table "public"."migrations" to "authenticated";

grant insert on table "public"."migrations" to "authenticated";

grant references on table "public"."migrations" to "authenticated";

grant select on table "public"."migrations" to "authenticated";

grant trigger on table "public"."migrations" to "authenticated";

grant truncate on table "public"."migrations" to "authenticated";

grant update on table "public"."migrations" to "authenticated";

grant delete on table "public"."migrations" to "service_role";

grant insert on table "public"."migrations" to "service_role";

grant references on table "public"."migrations" to "service_role";

grant select on table "public"."migrations" to "service_role";

grant trigger on table "public"."migrations" to "service_role";

grant truncate on table "public"."migrations" to "service_role";

grant update on table "public"."migrations" to "service_role";

grant delete on table "public"."ollama_documents" to "anon";

grant insert on table "public"."ollama_documents" to "anon";

grant references on table "public"."ollama_documents" to "anon";

grant select on table "public"."ollama_documents" to "anon";

grant trigger on table "public"."ollama_documents" to "anon";

grant truncate on table "public"."ollama_documents" to "anon";

grant update on table "public"."ollama_documents" to "anon";

grant delete on table "public"."ollama_documents" to "authenticated";

grant insert on table "public"."ollama_documents" to "authenticated";

grant references on table "public"."ollama_documents" to "authenticated";

grant select on table "public"."ollama_documents" to "authenticated";

grant trigger on table "public"."ollama_documents" to "authenticated";

grant truncate on table "public"."ollama_documents" to "authenticated";

grant update on table "public"."ollama_documents" to "authenticated";

grant delete on table "public"."ollama_documents" to "service_role";

grant insert on table "public"."ollama_documents" to "service_role";

grant references on table "public"."ollama_documents" to "service_role";

grant select on table "public"."ollama_documents" to "service_role";

grant trigger on table "public"."ollama_documents" to "service_role";

grant truncate on table "public"."ollama_documents" to "service_role";

grant update on table "public"."ollama_documents" to "service_role";

grant delete on table "public"."tool" to "anon";

grant insert on table "public"."tool" to "anon";

grant references on table "public"."tool" to "anon";

grant select on table "public"."tool" to "anon";

grant trigger on table "public"."tool" to "anon";

grant truncate on table "public"."tool" to "anon";

grant update on table "public"."tool" to "anon";

grant delete on table "public"."tool" to "authenticated";

grant insert on table "public"."tool" to "authenticated";

grant references on table "public"."tool" to "authenticated";

grant select on table "public"."tool" to "authenticated";

grant trigger on table "public"."tool" to "authenticated";

grant truncate on table "public"."tool" to "authenticated";

grant update on table "public"."tool" to "authenticated";

grant delete on table "public"."tool" to "service_role";

grant insert on table "public"."tool" to "service_role";

grant references on table "public"."tool" to "service_role";

grant select on table "public"."tool" to "service_role";

grant trigger on table "public"."tool" to "service_role";

grant truncate on table "public"."tool" to "service_role";

grant update on table "public"."tool" to "service_role";

grant delete on table "public"."upsert_history" to "anon";

grant insert on table "public"."upsert_history" to "anon";

grant references on table "public"."upsert_history" to "anon";

grant select on table "public"."upsert_history" to "anon";

grant trigger on table "public"."upsert_history" to "anon";

grant truncate on table "public"."upsert_history" to "anon";

grant update on table "public"."upsert_history" to "anon";

grant delete on table "public"."upsert_history" to "authenticated";

grant insert on table "public"."upsert_history" to "authenticated";

grant references on table "public"."upsert_history" to "authenticated";

grant select on table "public"."upsert_history" to "authenticated";

grant trigger on table "public"."upsert_history" to "authenticated";

grant truncate on table "public"."upsert_history" to "authenticated";

grant update on table "public"."upsert_history" to "authenticated";

grant delete on table "public"."upsert_history" to "service_role";

grant insert on table "public"."upsert_history" to "service_role";

grant references on table "public"."upsert_history" to "service_role";

grant select on table "public"."upsert_history" to "service_role";

grant trigger on table "public"."upsert_history" to "service_role";

grant truncate on table "public"."upsert_history" to "service_role";

grant update on table "public"."upsert_history" to "service_role";

grant delete on table "public"."variable" to "anon";

grant insert on table "public"."variable" to "anon";

grant references on table "public"."variable" to "anon";

grant select on table "public"."variable" to "anon";

grant trigger on table "public"."variable" to "anon";

grant truncate on table "public"."variable" to "anon";

grant update on table "public"."variable" to "anon";

grant delete on table "public"."variable" to "authenticated";

grant insert on table "public"."variable" to "authenticated";

grant references on table "public"."variable" to "authenticated";

grant select on table "public"."variable" to "authenticated";

grant trigger on table "public"."variable" to "authenticated";

grant truncate on table "public"."variable" to "authenticated";

grant update on table "public"."variable" to "authenticated";

grant delete on table "public"."variable" to "service_role";

grant insert on table "public"."variable" to "service_role";

grant references on table "public"."variable" to "service_role";

grant select on table "public"."variable" to "service_role";

grant trigger on table "public"."variable" to "service_role";

grant truncate on table "public"."variable" to "service_role";

grant update on table "public"."variable" to "service_role";


