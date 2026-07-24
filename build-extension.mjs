import { build } from 'vite'
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'

const rootDir = process.cwd()
const target = process.argv[2] || 'both'

const staticFiles = [
	'background.js',
	'options.html',
	'options.js',
	'settings-utils.js',
	'storage-utils.js',
]

const polyfillJsFiles = ['background.js', 'options.js']

const polyfillSource = readFileSync(
	path.join(rootDir, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'),
	'utf8'
)

const firefoxOnly = ['browser_specific_settings']

async function readManifest() {
	return JSON.parse(await readFile(path.join(rootDir, 'manifest.json'), 'utf8'))
}

async function readVersionName() {
	const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'))
	return pkg.version
}

async function writeChromeManifest(manifest, outDir) {
	const chrome = JSON.parse(JSON.stringify(manifest))
	for (const key of firefoxOnly) delete chrome[key]
	if (chrome.background?.scripts) delete chrome.background.scripts
	await writeFile(
		path.join(outDir, 'manifest.json'),
		JSON.stringify(chrome, null, 2) + '\n'
	)
}

async function copyStatic(outDir, manifest, label) {
	for (const file of staticFiles) {
		const srcPath = path.join(rootDir, file)
		const dstPath = path.join(outDir, file)
		if (label === 'chrome' && polyfillJsFiles.includes(file)) {
			const content = await readFile(srcPath, 'utf8')
			await writeFile(dstPath, content.replace('\n\n', '\n\n' + polyfillSource + '\n'))
		} else {
			await cp(srcPath, dstPath)
		}
	}
	await writeFile(
		path.join(outDir, 'manifest.json'),
		JSON.stringify(manifest, null, 2) + '\n'
	)
	await cp(path.join(rootDir, 'icons'), path.join(outDir, 'icons'), {
		recursive: true,
	})
}

async function copyViteOutput(srcDir, outDir) {
	await cp(path.join(srcDir, 'index.html'), path.join(outDir, 'index.html'))
	await cp(path.join(srcDir, 'assets'), path.join(outDir, 'assets'), {
		recursive: true,
	})
}

async function verifyBuild(outDir) {
	for (const file of [...staticFiles, 'index.html', 'manifest.json']) {
		await stat(path.join(outDir, file))
	}
	for (const directory of ['assets', 'icons']) {
		if (!(await readdir(path.join(outDir, directory))).length) {
			throw new Error(`Missing generated files in ${outDir}/${directory}`)
		}
	}
}

async function packageExtension(outDir, label, versionName) {
	const outputDir = path.join(rootDir, 'web-ext-artifacts')
	await mkdir(outputDir, { recursive: true })
	const filename = `multiflux-${versionName}-${label}.zip`
	execSync(`npx web-ext build --source-dir=${outDir} --filename=${filename} --overwrite-dest`, {
		stdio: 'inherit',
	})
}

async function buildTarget(label) {
	const manifest = await readManifest()
	const versionName = await readVersionName()
	const distDir = path.join(rootDir, `dist-${label}`)

	console.log(`\n=== Building Multiflux for ${label.toUpperCase()} ===`)

	await mkdir(distDir, { recursive: true })

	await copyStatic(distDir, manifest, label)

	if (label === 'chrome') {
		await writeChromeManifest(manifest, distDir)
	}

	await copyViteOutput(path.join(rootDir, 'dist'), distDir)
	await verifyBuild(distDir)
	console.log(`Build complete: ${distDir}`)

	await packageExtension(distDir, label, versionName)
}

// ─── Main ──────────────────────────────────────────────

// Vite build (shared React app, produces dist/)
await build()

if (target === 'firefox' || target === 'both') {
	await buildTarget('firefox')
}
if (target === 'chrome' || target === 'both') {
	await buildTarget('chrome')
}
