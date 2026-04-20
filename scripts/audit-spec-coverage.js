const fs = require('fs')
const path = require('path')

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function walk(dir, exts = ['.ts', '.tsx', '.js', '.jsx', '.json']) {
  const out = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...walk(full, exts))
    } else if (exts.includes(path.extname(e.name))) {
      out.push(full)
    }
  }
  return out
}

function normalize(p) {
  return p.split(path.sep).join('/')
}

async function main() {
  const specPath = path.join(__dirname, '..', 'docs', 'api-contracts', 'deployer-ui-api.json')
  if (!fs.existsSync(specPath)) {
    console.error('Spec file not found:', specPath)
    process.exit(2)
  }

  const spec = readJSON(specPath)
  const endpoints = spec.endpoints || {}
  const files = walk(path.join(__dirname, '..', 'src'))

  const results = {}
  for (const [key, info] of Object.entries(endpoints)) {
    const pathStr = info.path || ''
    const method = info.method || ''
    results[key] = { path: pathStr, method, matches: [] }
    for (const f of files) {
      try {
        const content = fs.readFileSync(f, 'utf8')
        if (content.includes(key) || content.includes(pathStr) || content.includes(pathStr.replace('{', '').replace('}', '')) ) {
          results[key].matches.push(normalize(path.relative(path.join(__dirname, '..'), f)))
        }
      } catch (e) {
        // ignore read errors
      }
    }
  }

  const outPath = path.join(__dirname, 'audit-output.json')
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), 'utf8')
  console.log('Wrote', outPath)
  // print a short summary
  for (const [k,v] of Object.entries(results)) {
    console.log(k, '-', v.matches.length, 'matches')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
