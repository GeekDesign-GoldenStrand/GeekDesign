-- Velocidad de avance en mm/s — aplica solo a materiales hoja (individuales y
-- variantes). Categorías y grupos lo dejan en NULL.
ALTER TABLE "MATERIALES"
ADD COLUMN "velocidad_avance" DECIMAL(10, 2);
