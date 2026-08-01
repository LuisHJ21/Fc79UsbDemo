const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Ruta raiz del proyecto Expo.
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Backend IIS que sirve el endpoint /pallets/api/version y la carpeta updates.
const DEFAULT_BACKEND_ROOT = "D:\\WEBSITES\\Pallets\\API";

// Nombre base del APK publicado: pallet-vX.X.X.apk
const APK_PREFIX = "pallet";

// Ruta HTTP (no ruta Windows) desde donde IIS sirve los APK.
const DOWNLOAD_BASE = "/pallets/api/updates";

// APK que genera Gradle cuando se ejecuta assembleRelease.
const APK_SOURCE = path.join(
  PROJECT_ROOT,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk",
);

function parseArgs(argv) {
  // Valores por defecto. Se pueden cambiar pasando flags por consola.
  const args = {
    mandatory: false,
    changes: [],
    backendRoot: DEFAULT_BACKEND_ROOT,
    build: false,
    copyApk: false,
    updateBackend: true,
    auto: false,
    bump: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--auto") {
      // Modo autonomo: lo invoca Gradle al terminar assembleRelease.
      args.auto = true;
    } else if (arg === "--bump") {
      // Sube version y versionCode para el proximo build.
      args.bump = true;
    } else if (arg === "--version") {
      args.version = next;
      i += 1;
    } else if (arg === "--code") {
      args.code = Number(next);
      i += 1;
    } else if (arg === "--mandatory") {
      args.mandatory = next === "true";
      i += 1;
    } else if (arg === "--change") {
      args.changes.push(next);
      i += 1;
    } else if (arg === "--backend") {
      args.backendRoot = next;
      i += 1;
    } else if (arg === "--build") {
      args.build = true;
    } else if (arg === "--copy-apk") {
      args.copyApk = true;
    } else if (arg === "--no-backend") {
      args.updateBackend = false;
    } else if (arg === "--help") {
      args.help = true;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Uso:
  node scripts/release-apk.js --version 1.0.3 --code 3 --change "Mejora X"

Opciones:
  --version <x.x.x>       Version nueva. Obligatorio en modo manual.
  --code <numero>         VersionCode nuevo. Obligatorio en modo manual.
  --change <texto>        Cambio visible en el changelog. Se puede repetir.
  --mandatory true|false  Actualizacion obligatoria. Default: false.
  --build                 Ejecuta gradlew assembleRelease.
  --copy-apk              Copia app-release.apk como ${APK_PREFIX}-vX.X.X.apk.
  --backend <ruta>        Ruta del backend. Default: ${DEFAULT_BACKEND_ROOT}.
  --no-backend            No actualiza pallet_version.json.
  --auto                  Modo autonomo (lo usa Gradle). Publica la version
                          que esta en app.json: copia el APK y actualiza el JSON.
  --bump                  Sube versionCode +1 y el patch de version en
                          app.json/package.json (lo usa Gradle tras el build).

Ejemplo completo:
  npm run release:apk -- --version 1.0.3 --code 3 --change "Correccion de escaneo" --build --copy-apk
`);
}

function assertValidArgs(args) {
  if (args.help) return;
  if (!args.version || !/^\d+\.\d+\.\d+$/.test(args.version)) {
    throw new Error(
      "Debes indicar --version con formato x.x.x. Ejemplo: --version 1.0.3",
    );
  }
  if (!Number.isInteger(args.code) || args.code <= 0) {
    throw new Error("Debes indicar --code como numero positivo. Ejemplo: --code 3");
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function updateProjectVersion(version, code) {
  // Estos tres archivos deben quedar con la misma version para evitar
  // que Android o Expo reporten una version distinta a la publicada.
  const appJsonPath = path.join(PROJECT_ROOT, "app.json");
  const packageJsonPath = path.join(PROJECT_ROOT, "package.json");
  const packageLockPath = path.join(PROJECT_ROOT, "package-lock.json");

  const appJson = readJson(appJsonPath);
  appJson.expo.version = version;

  // En bare workflow (la carpeta android/ vive en el repo) Expo no acepta
  // politicas como {"policy": "appVersion"}: exige un valor literal. Lo
  // mantenemos igual a la version para conservar esa misma semantica.
  appJson.expo.runtimeVersion = version;
  appJson.expo.android = appJson.expo.android ?? {};

  // Android usa versionCode para saber si un APK es mas nuevo que otro.
  // Siempre debe subir, aunque version cambie solo de 1.0.2 a 1.0.3.
  appJson.expo.android.versionCode = code;
  writeJson(appJsonPath, appJson);

  const packageJson = readJson(packageJsonPath);
  packageJson.version = version;
  writeJson(packageJsonPath, packageJson);

  if (fs.existsSync(packageLockPath)) {
    const packageLock = readJson(packageLockPath);
    packageLock.version = version;
    if (packageLock.packages?.[""]) {
      packageLock.packages[""].version = version;
    }
    writeJson(packageLockPath, packageLock);
  }
}

function readProjectVersion() {
  // Fuente de verdad de la version: app.json. El modo --auto la usa
  // para publicar exactamente lo que se acaba de compilar.
  const appJson = readJson(path.join(PROJECT_ROOT, "app.json"));
  return {
    version: appJson.expo?.version,
    code: appJson.expo?.android?.versionCode,
  };
}

function bumpPatch(version) {
  // Sube solo el ultimo numero: 1.0.2 -> 1.0.3.
  const parts = String(version || "1.0.0")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.slice(0, 3).join(".");
}

function bumpVersion() {
  // Auto-incremento que corre DESPUES de un build release exitoso.
  // Deja app.json, package.json y package-lock.json listos para el proximo build.
  const { version, code } = readProjectVersion();
  const nextCode = (Number(code) || 0) + 1;
  const nextVersion = bumpPatch(version);

  updateProjectVersion(nextVersion, nextCode);

  return {
    currentVersion: version,
    nextVersion,
    currentCode: code,
    nextCode,
  };
}

function updateBackendVersion(args) {
  // Este JSON es lo que devuelve el backend en /pallets/api/version.
  // La app lo consulta al iniciar para decidir si muestra el modal.
  const storageDir = path.join(args.backendRoot, "storage");
  const versionFile = path.join(storageDir, "pallet_version.json");
  const apkName = `${APK_PREFIX}-v${args.version}.apk`;

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Preserva el changelog anterior y solo agrega/actualiza la entrada
  // de esta version. Asi el modo --auto no borra el historial.
  let existing = {};
  if (fs.existsSync(versionFile)) {
    try {
      existing = readJson(versionFile);
    } catch {
      existing = {};
    }
  }

  const changelog = Array.isArray(existing.changelog) ? existing.changelog : [];
  const idx = changelog.findIndex((c) => c && c.version === args.version);
  const entry = {
    version: args.version,
    date: new Date().toISOString().slice(0, 10),
    changes:
      args.changes.length > 0
        ? args.changes
        : idx >= 0
          ? changelog[idx].changes
          : ["Cambios generales"],
  };

  if (idx >= 0) {
    changelog[idx] = entry;
  } else {
    changelog.unshift(entry);
  }

  const data = {
    version: args.version,
    versionCode: args.code,
    mandatory: args.mandatory,
    // Ruta HTTP relativa servida por IIS. No usar rutas Windows aqui.
    downloadUrl: `${DOWNLOAD_BASE}/${apkName}`,
    changelog,
  };

  writeJson(versionFile, data);
}

function buildApk() {
  // Compila el APK release. El resultado queda en android/app/build/outputs/apk/release.
  const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
  const result = spawnSync(gradle, ["assembleRelease"], {
    cwd: path.join(PROJECT_ROOT, "android"),
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error("Fallo la compilacion del APK.");
  }
}

function copyApk(args) {
  // Copia el app-release.apk generado al backend con el nombre versionado.
  if (!fs.existsSync(APK_SOURCE)) {
    throw new Error(`No existe el APK generado: ${APK_SOURCE}`);
  }

  const updatesDir = path.join(args.backendRoot, "updates");
  if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
  }

  const destination = path.join(updatesDir, `${APK_PREFIX}-v${args.version}.apk`);
  fs.copyFileSync(APK_SOURCE, destination);
  return destination;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  // Auto-incremento posterior al build: lo dispara Gradle una vez que el APK
  // de la version actual ya fue publicado.
  if (args.bump) {
    const r = bumpVersion();
    console.log(`[release-apk] version: ${r.currentVersion} -> ${r.nextVersion}`);
    console.log(`[release-apk] versionCode: ${r.currentCode} -> ${r.nextCode}`);
    return;
  }

  // Modo autonomo: lo dispara Gradle al terminar de ensamblar el APK release.
  // No bumpea versiones ni recompila; publica la version que ya esta en app.json.
  // Es resiliente: si el backend no es accesible solo avisa y no rompe el build.
  if (args.auto) {
    const { version, code } = readProjectVersion();
    if (!version || !Number.isInteger(code)) {
      console.warn(
        "[release-apk] app.json no tiene version/versionCode validos. Se omite la publicacion.",
      );
      return;
    }

    args.version = version;
    args.code = code;

    try {
      const destination = copyApk(args);
      console.log(`[release-apk] APK copiado: ${destination}`);
    } catch (error) {
      console.warn(`[release-apk] No se pudo copiar el APK: ${error.message}`);
    }

    if (args.updateBackend) {
      try {
        updateBackendVersion(args);
        console.log(
          `[release-apk] pallet_version.json actualizado -> ${version} (code ${code}).`,
        );
      } catch (error) {
        console.warn(`[release-apk] No se pudo actualizar el backend: ${error.message}`);
      }
    }

    return;
  }

  assertValidArgs(args);

  // 1. Actualiza versiones del proyecto.
  updateProjectVersion(args.version, args.code);

  // 2. Opcional: compila APK.
  if (args.build) {
    buildApk();
  }

  // 3. Opcional: copia APK al backend.
  let copiedApk = null;
  if (args.copyApk) {
    copiedApk = copyApk(args);
  }

  // 4. Actualiza el JSON que consume la app para detectar la nueva version.
  if (args.updateBackend) {
    updateBackendVersion(args);
  }

  console.log("Version actualizada correctamente.");
  console.log(`App: ${args.version}`);
  console.log(`versionCode: ${args.code}`);
  console.log(`APK esperado: ${APK_PREFIX}-v${args.version}.apk`);
  if (copiedApk) console.log(`APK copiado: ${copiedApk}`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
