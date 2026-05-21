-- KIKW12 review #1b/#2: magic-link access tokens for cotización tracker.
-- Replaces the old `?email=` query-string credential with a hashed,
-- single-use, TTL-bounded token that the cliente receives via email
-- and exchanges for a signed JWT session cookie.

CREATE TABLE "TOKENSACCESOCOTIZACION" (
    "id" SERIAL NOT NULL,
    "id_cotizacion" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TOKENSACCESOCOTIZACION_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TOKENSACCESOCOTIZACION_token_hash_key"
    ON "TOKENSACCESOCOTIZACION"("token_hash");

CREATE INDEX "TOKENSACCESOCOTIZACION_id_cotizacion_idx"
    ON "TOKENSACCESOCOTIZACION"("id_cotizacion");

ALTER TABLE "TOKENSACCESOCOTIZACION"
    ADD CONSTRAINT "TOKENSACCESOCOTIZACION_id_cotizacion_fkey"
    FOREIGN KEY ("id_cotizacion") REFERENCES "COTIZACIONES"("id_cotizacion")
    ON DELETE CASCADE ON UPDATE CASCADE;
