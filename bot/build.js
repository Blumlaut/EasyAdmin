const esbuild = require('esbuild')

const isWatch = process.argv.includes('--watch')

async function main() {
	const ctx = await esbuild.context({
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
		await ctx.watch()
		console.log('[bot] Watching for changes...')
	} else {
		await ctx.rebuild()
		await ctx.dispose()
	}
}

main().catch(() => process.exit(1))
