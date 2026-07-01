/**
 * Genera carpeta release/GranizadosImpresora lista para copiar al PC de caja.
 * Incluye: Node portable, app compilada, .exe lanzador, INSTALAR.bat
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createWriteStream } from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_ROOT = path.resolve(__dirname, "..");
const RELEASE_NAME = "GranizadosImpresora";
const RELEASE_DIR = path.join(BRIDGE_ROOT, "release", RELEASE_NAME);
const NODE_VERSION = "v20.18.0";
const NODE_ZIP = `node-${NODE_VERSION}-win-x64.zip`;
const NODE_URL = `https://nodejs.org/dist/${NODE_VERSION}/${NODE_ZIP}`;
const CACHE_DIR = path.join(BRIDGE_ROOT, ".cache");

function log(msg) {
  console.log(`[pack] ${msg}`);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close();
          return download(res.headers.location, dest).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

async function extractNodeZip(zipPath, destDir) {
  const extractTo = path.join(CACHE_DIR, "node-extract");
  rmSync(extractTo, { recursive: true, force: true });
  mkdirSync(extractTo, { recursive: true });
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractTo.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" },
  );
  const inner = path.join(extractTo, `node-${NODE_VERSION}-win-x64`);
  rmSync(destDir, { recursive: true, force: true });
  cpSync(inner, destDir, { recursive: true });
}

async function main() {
  log("Compilando TypeScript...");
  execSync("npm run build", { cwd: BRIDGE_ROOT, stdio: "inherit" });

  log("Preparando carpeta release...");
  rmSync(RELEASE_DIR, { recursive: true, force: true });
  mkdirSync(RELEASE_DIR, { recursive: true });

  const nodeDir = path.join(RELEASE_DIR, "node");
  mkdirSync(CACHE_DIR, { recursive: true });
  const zipPath = path.join(CACHE_DIR, NODE_ZIP);
  if (!existsSync(zipPath)) {
    log(`Descargando Node ${NODE_VERSION}...`);
    await download(NODE_URL, zipPath);
  } else {
    log("Usando Node en caché...");
  }
  log("Extrayendo Node portable (completo, para npm install)...");
  await extractNodeZip(zipPath, nodeDir);

  const appDir = path.join(RELEASE_DIR, "app");
  mkdirSync(appDir, { recursive: true });
  cpSync(path.join(BRIDGE_ROOT, "dist"), path.join(appDir, "dist"), {
    recursive: true,
  });

  const pkg = JSON.parse(
    readFileSync(path.join(BRIDGE_ROOT, "package.json"), "utf8"),
  );
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    type: pkg.type,
    dependencies: pkg.dependencies,
  };
  writeFileSync(
    path.join(appDir, "package.json"),
    JSON.stringify(prodPkg, null, 2),
  );
  const lockPath = path.join(BRIDGE_ROOT, "package-lock.json");
  if (existsSync(lockPath)) {
    cpSync(lockPath, path.join(appDir, "package-lock.json"));
  }

  const appModules = path.join(appDir, "node_modules");
  if (existsSync(appModules)) {
    log("Limpiando node_modules anterior en app/...");
    rmSync(appModules, { recursive: true, force: true });
  }

  log("Instalando dependencias con Node portable (driver nativo correcto)...");
  const npmCmd = path.join(nodeDir, "npm.cmd");
  execSync(`"${npmCmd}" install --omit=dev --legacy-peer-deps`, {
    cwd: appDir,
    stdio: "inherit",
  });

  cpSync(
    path.join(BRIDGE_ROOT, ".env.example"),
    path.join(RELEASE_DIR, ".env.example"),
  );
  cpSync(path.join(BRIDGE_ROOT, "Iniciar.bat"), path.join(RELEASE_DIR, "Iniciar.bat"));
  cpSync(path.join(BRIDGE_ROOT, "INSTALAR.bat"), path.join(RELEASE_DIR, "INSTALAR.bat"));
  cpSync(
    path.join(BRIDGE_ROOT, "LEEME-CAJA.txt"),
    path.join(RELEASE_DIR, "LEEME-CAJA.txt"),
  );
  mkdirSync(path.join(RELEASE_DIR, "scripts"), { recursive: true });
  cpSync(
    path.join(BRIDGE_ROOT, "scripts", "setup-windows.ps1"),
    path.join(RELEASE_DIR, "scripts", "setup-windows.ps1"),
  );

  log("Generando GranizadosImpresora.exe...");
  const exeOut = path.join(RELEASE_DIR, "GranizadosImpresora.exe");
  const pkgTargets = ["node18-win-x64", "node20-win-x64"];
  let exeBuilt = false;
  for (const target of pkgTargets) {
    try {
      execSync(
        `npx --yes @yao-pkg/pkg@6 launcher/launcher.cjs --targets ${target} -o "${exeOut}"`,
        { cwd: BRIDGE_ROOT, stdio: "inherit" },
      );
      exeBuilt = true;
      break;
    } catch {
      log(`pkg (${target}) no disponible, probando otro target...`);
    }
  }
  if (!exeBuilt) {
    log("Sin .exe — los accesos directos usarán Iniciar.bat (funciona igual).");
  }

  log("");
  log("Listo! Carpeta para el PC de caja:");
  log(RELEASE_DIR);
  log("");
  log("Pasos: copiar carpeta → INSTALAR.bat → abrir /caja en Vercel");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
