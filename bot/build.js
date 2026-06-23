const esbuild = require('esbuild')

const isWatch = process.argv.includes('--watch')

const ctx = esbuild.context({
	entryPoints: ['bot/bot.ts'],
	bundle: true,
	minify: false,
	platform: 'node',
	target: 'node22',
	outdir: './dist',
	treeShaking: true,
	ignoreAnnotations: true,
	define: { 'process.env.NODE_ENV': '"production"' },
	external: ['zlib-sync'],
})

if (isWatch) {
	ctx.watch().then(() => {
		console.log('[bot] Watching for changes...')
	}).catch(() => process.exit(1))
} else {
	ctx.rebuild().catch(() => process.exit(1)).finally(() => ctx.dispose())
}
