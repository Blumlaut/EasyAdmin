const esbuild = require('esbuild')

esbuild.build({
	entryPoints: ['bot/**/*.js'],
	bundle: true,
	minify: false,
	platform: 'node',
	target: 'node22', 
	outdir: '../dist',
	treeShaking: true,
	ignoreAnnotations: true,
	define: { 'process.env.NODE_ENV': '"production"' },
	external: ['zlib-sync'], 
}).catch(() => process.exit(1))
