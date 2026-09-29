/**
 * PID lock: keeps two recordings of the same video from writing into the same
 * frames directory at the same time. Interleaved frames destroy the timeline
 * (the encoder rebuilds it from capture timestamps), so a collision must fail
 * loudly instead of producing a broken mp4.
 */

import fs from 'node:fs'

function isRunning(pid) {
	try {
		process.kill(pid, 0)
		return true
	} catch (err) {
		return err.code === 'EPERM' // exists, owned by someone else
	}
}

/**
 * Take the lock for `file`. Returns a release function.
 * Throws if another live process holds it; steals stale locks from dead ones.
 */
export function acquireLock(file, label = file) {
	const claim = () => {
		fs.writeFileSync(file, `${process.pid}\n`, { flag: 'wx' })
		return () => fs.rmSync(file, { force: true })
	}
	try {
		return claim()
	} catch (err) {
		if (err.code !== 'EEXIST') throw err
	}
	let owner = 0
	try {
		owner = Number(fs.readFileSync(file, 'utf8').trim()) || 0
	} catch {
		owner = 0
	}
	if (owner && owner !== process.pid && isRunning(owner)) {
		throw new Error(`${label} is already running (pid ${owner}).\n`
			+ '  Wait for it to finish, or use a different --out directory.')
	}
	fs.rmSync(file, { force: true })
	return claim()
}
