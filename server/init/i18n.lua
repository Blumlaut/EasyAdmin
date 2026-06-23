-- Server-side i18n initialization
-- Runs synchronously during resource startup, before any other server code
-- (server/init/*.lua is the first server script group after shared_scripts)
I18nLoad()
