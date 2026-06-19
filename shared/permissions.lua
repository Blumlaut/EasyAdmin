-- All EasyAdmin permissions are defined here.
-- New permissions MUST be added to this table before they will be recognised
-- by the admin session handshake (EasyAdmin:amiadmin) and exposed to clients.
--
-- Convention: "category.action.detail" (e.g. "player.ban.temporary")
-- The "easyadmin." prefix is added automatically by DoesPlayerHavePermission().
--
-- Plugins add their own permissions via:
--   Citizen.CreateThread(function()
--       permissions["plugin.name"] = false
--   end)

permissions = {
	["player.ban.temporary"] = false,
	["player.ban.permanent"] = false,
	["player.ban.view"] = false,
	["player.ban.edit"] = false,
	["player.ban.remove"] = false,
	["player.kick"] = false,
	["player.spectate"] = false,
	["player.teleport.single"] = false,
	["player.slap"] = false,
	["player.freeze"] = false,
	["player.bucket.join"] = false,
	["player.bucket.force"] = false,
	["player.screenshot"] = false,
	["player.mute"] = false,
	["player.warn"] = false,
	["player.actionhistory.view"] = false,
	["player.actionhistory.add"] = false,
	["player.actionhistory.delete"] = false,
	["player.adminnotes.view"] = false,
	["player.adminnotes.add"] = false,
	["player.adminnotes.delete"] = false,
	["player.namehistory.view"] = false,
	["player.aliases.add"] = false,
	["player.aliases.delete"] = false,
	["player.teleport.everyone"] = false,
	["player.reports.view"] = false,
	["player.reports.claim"] = false,
	["player.reports.process"] = false,

	["bot.history"] = false,
	["bot.notes"] = false,

	["server.statistics.view"] = false,
	["server.metrics.view"] = false,

	["server.cleanup.cars"] = false,
	["server.cleanup.props"] = false,
	["server.cleanup.peds"] = false,
	["server.shortcut.add"] = false,
	["server.reminder.add"] = false,
	["server.announce"] = false,
	["server.convars"] = false,
	["server.resources.start"] = false,
	["server.resources.stop"] = false,
	["server.resources.monitor"] = false,
	["server.chat"] = false,

	["immune"] = false,
	["anon"] = false,
}
