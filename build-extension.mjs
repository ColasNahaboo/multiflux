import { build } from 'vite'
import { cp, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')
const staticFiles = [
	'manifest.json',
	'background.js',
	'options.html',
	'options.js',
]

await build()

for (const file of staticFiles) {
	await cp(path.join(rootDir, file), path.join(distDir, file))
}
await cp(path.join(rootDir, 'icons'), path.join(distDir, 'icons'), {
	recursive: true,
})

for (const file of [...staticFiles, 'index.html']) {
	await stat(path.join(distDir, file))
}
for (const directory of ['assets', 'icons']) {
	if (!(await readdir(path.join(distDir, directory))).length) {
		throw new Error(`Missing generated files in ${directory}`)
	}
}

console.log(`Extension build complete: ${distDir}`)
