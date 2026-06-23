import { spawn } from 'node:child_process'
import process from 'node:process'

let watchers = []

function runInstall() {
	return new Promise((resolve, reject) => {
		const child = spawn('npm', ['run', 'install:all'], {
			stdio: 'inherit',
			shell: true,
		})

		child.on('exit', (code) => {
			if (code !== 0 && code !== null) {
				reject(new Error(`install:all exited with code ${code}`))
			} else {
				resolve()
			}
		})
	})
}

function startWatchers() {
	const tasks = [
		{ name: 'bot', cmd: 'npm', args: ['--prefix', 'bot', 'run', 'watch'] },
		{ name: 'nui', cmd: 'npm', args: ['--prefix', 'nui', 'run', 'watch'] },
	]

	watchers = tasks.map(({ name, cmd, args }) => {
		const child = spawn(cmd, args, {
			stdio: 'inherit',
			shell: true,
			env: { ...process.env, TASK_NAME: name },
		})

		child.on('exit', (code) => {
			if (code !== 0 && code !== null) {
				console.error(`\x1b[31m[${name}] exited with code ${code}\x1b[0m`)
			}
		})

		return { child, name }
	})
}

async function main() {
	console.log('Installing dependencies...')
	await runInstall()
	console.log('Starting watchers...\n')
	startWatchers()
}

main().catch((err) => {
	console.error(err.message)
	process.exit(1)
})

process.on('SIGINT', () => {
	console.log('\nShutting down watchers...')
	watchers.forEach(({ child, name }) => {
		console.log(`Stopping ${name}...`)
		child.kill('SIGTERM')
	})
	setTimeout(() => process.exit(1), 5000)
})
