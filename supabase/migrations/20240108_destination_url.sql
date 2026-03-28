-- Add destination URL and WhatsApp number per-campaign
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS destination_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

COMMENT ON COLUMN campaigns.destination_url IS 'URL de destino del anuncio (ej: landing page, producto)';
COMMENT ON COLUMN campaigns.whatsapp_number IS 'Número de WhatsApp para anuncios de mensajes (con código de país)';
