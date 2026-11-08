// Builds the release folder that goes to the server (phase 11, D38). Run it on a machine WITH
// internet (npm downloads the packages), from the repository root:
//   node deploy/build-release.mjs [--out <folder>]
// Result: <out>/esms-<version>-<date>-<commit>/ and an archive next to it (.zip on Windows,
// .tar.gz on Linux/macOS), holding everything the server needs and nothing it must download:
//   backend/   src, scripts, package.json, package-lock.json, node_modules (production only)
//   frontend/dist/   the built app (calls its own origin: /api/v1)
//   deploy/    install, backup and restore scripts, configs, guides
//   .nvmrc, VERSION, CHANGELOG.md
// <version> is the version of the three package.json files (2.0.0 for v2, D77); when they differ,
// the build stops. The backend packages are plain JavaScript (no native modules), so one release
// runs on Windows and Linux alike. Copy the archive to the server (USB stick, file share) and
// follow deploy/README.md.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** The release version: the same in backend/, frontend/ and e2e/package.json, or an error. */
export function releaseVersion(dir = root) {
  const versions = ['backend', 'frontend', 'e2e'].map(
    (app) => JSON.parse(fs.readFileSync(path.join(dir, app, 'package.json'), 'utf8')).version
  )
  if (new Set(versions).size !== 1) {
    throw new Error(`The package.json versions differ (backend, frontend, e2e): ${versions.join(', ')}`)
  }
  return versions[0]
}

/** The folder and archive name: esms-<version>-<date>-<commit>[-modified] */
export function releaseName({ version, date, commit, dirty }) {
  return `esms-${version}-${date}-${commit}${dirty ? '-modified' : ''}`
}

const run = (cmd, args, cwd, env = process.env) => {
  console.log(`> ${cmd} ${args.join(' ')}   (${path.relative(root, cwd) || '.'})`)
  // npm is a .cmd file on Windows, which only a shell can start; the arguments here are fixed
  // words, so one command line is safe.
  const shell = process.platform === 'win32' && cmd === 'npm'
  const result = shell
    ? spawnSync([cmd, ...args].join(' '), { cwd, env, stdio: 'inherit', shell: true })
    : spawnSync(cmd, args, { cwd, env, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`)
}

const git = (args) =>
  spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout?.trim() ?? ''

function build() {
  const argOut = process.argv.indexOf('--out')
  const outRoot = path.resolve(argOut > 0 ? process.argv[argOut + 1] : path.join(root, 'release'))

  const version = releaseVersion()
  const commit = git(['rev-parse', '--short', 'HEAD']) || 'unknown'
  const dirty = git(['status', '--porcelain']) !== ''
  const date = new Date().toISOString().slice(0, 10)
  const name = releaseName({ version, date, commit, dirty })
  const out = path.join(outRoot, name)

  if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(out, { recursive: true })

  // 1. Frontend. VITE_API_URL is set empty on purpose: it overrides a developer's frontend/.env,
  //    so the built app calls its own origin (/api/v1), whatever that machine's dev settings say.
  const frontend = path.join(root, 'frontend')
  run('npm', ['ci'], frontend)
  run('npm', ['run', 'build'], frontend, { ...process.env, VITE_API_URL: '' })
  const dist = path.join(frontend, 'dist')
  for (const file of fs.readdirSync(path.join(dist, 'assets'))) {
    if (!file.endsWith('.js')) continue
    const code = fs.readFileSync(path.join(dist, 'assets', file), 'utf8')
    // Vite writes the value it used into the bundle: it must be empty (→ /api/v1).
    const baked = /VITE_API_URL:"([^"]+)"/.exec(code)
    if (baked) {
      throw new Error(`${file} has VITE_API_URL=${baked[1]}: the build picked up another API URL`)
    }
  }
  fs.cpSync(dist, path.join(out, 'frontend', 'dist'), { recursive: true })

  // 2. Backend: the code and its production packages, never .env, uploads or tests.
  const backendOut = path.join(out, 'backend')
  for (const part of ['src', 'scripts', 'package.json', 'package-lock.json', '.env.example']) {
    fs.cpSync(path.join(root, 'backend', part), path.join(backendOut, part), { recursive: true })
  }
  run('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund'], backendOut)

  // 3. Deploy scripts and guides, the Node version, the changelog, and what this release is.
  fs.cpSync(path.join(root, 'deploy'), path.join(out, 'deploy'), {
    recursive: true,
    filter: (src) => !src.startsWith(outRoot),
  })
  fs.copyFileSync(path.join(root, '.nvmrc'), path.join(out, '.nvmrc'))
  fs.copyFileSync(path.join(root, 'CHANGELOG.md'), path.join(out, 'CHANGELOG.md'))
  fs.writeFileSync(
    path.join(out, 'VERSION'),
    `ESMS ${version}\nrelease ${name}\n` +
      `commit ${commit}${dirty ? ' (with uncommitted changes)' : ''}\n` +
      `built ${new Date().toISOString()} with Node ${process.versions.node}\n`
  )

  // 4. One archive to carry to the server. On Windows, Windows' own tar (bsdtar) writes the
  //    .zip; another tar on the PATH (Git's) cannot.
  const windows = process.platform === 'win32'
  const archive = windows ? `${name}.zip` : `${name}.tar.gz`
  const systemRoot = process.env.SystemRoot ?? 'C:\\Windows'
  const tar = windows ? path.join(systemRoot, 'System32', 'tar.exe') : 'tar'
  run(tar, windows ? ['-a', '-c', '-f', archive, name] : ['-c', '-z', '-f', archive, name], outRoot)
  console.log(`\nRelease ready:\n  ${out}\n  ${path.join(outRoot, archive)}`)
  if (dirty) console.warn('Note: built from a checkout with uncommitted changes.')
}

// Only when run as a script; the tests import releaseVersion and releaseName
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  build()
}
