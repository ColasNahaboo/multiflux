import { build } from 'vite'
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
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

const firefoxOnly = ['browser_specific_settings']

async function readManifest() {
	return JSON.parse(await readFile(path.join(rootDir, 'manifest.json'), 'utf8'))
}

async function writeChromeManifest(manifest, outDir) {
	const chrome = JSON.parse(JSON.stringify(manifest))
	for (const key of firefoxOnly) delete chrome[key]
	if (chrome.version_name) delete chrome.version_name
	if (chrome.background?.scripts) delete chrome.background.scripts
	await writeFile(
		path.join(outDir, 'manifest.json'),
		JSON.stringify(chrome, null, 2) + '\n'
	)
}

async function copyStatic(outDir, manifest) {
	for (const file of staticFiles) {
		await cp(path.join(rootDir, file), path.join(outDir, file))
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
	const filename = `threeflux-${versionName}-${label}.zip`
	execSync(`npx web-ext build --source-dir=${outDir} --filename=${filename}`, {
		stdio: 'inherit',
	})
}

async function buildTarget(label) {
	const manifest = await readManifest()
	const versionName = manifest.version_name || manifest.version
	const distDir = path.join(rootDir, `dist-${label}`)

	console.log(`\n=== Building Threeflux for ${label.toUpperCase()} ===`)

	await mkdir(distDir, { recursive: true })

	await copyStatic(distDir, manifest)

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
