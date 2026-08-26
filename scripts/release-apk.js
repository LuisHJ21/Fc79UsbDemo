const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Ruta raiz del proyecto Expo.
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_BACKEND_ROOT = "D:\\WEBSITES\\Pallets\\API";
const APK_PREFIX = "pallet";
const DOWNLOAD_BASE = "/pallets/api/updates";

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
  const args = {
    mandatory: false,
    changes: [],
    backendRoot: DEFAULT_BACKEND_ROOT,
    build: false,
    copyApk: false,
    updateBackend: true,
    auto: false,
    bump: false,
    sync: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--auto") {
      args.auto = true;
    } else if (arg === "--bump") {
      args.bump = true;
    } else if (arg === "--sync") {
      args.sync = true;
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
                          app.json/package.json/build.gradle (lo usa Gradle
                          tras el build).
  --sync                  Copia version/versionCode de app.json a
                          android/app/build.gradle sin bumpear nada.

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
    throw new Error(
      "Debes indicar --code como numero positivo. Ejemplo: --code 3",
    );
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const APP_BUILD_GRADLE = path.join(
  PROJECT_ROOT,
  "android",
  "app",
  "build.gradle",
);

function updateAndroidGradleVersion(version, code) {
  if (!fs.existsSync(APP_BUILD_GRADLE)) return false;

  const original = fs.readFileSync(APP_BUILD_GRADLE, "utf8");

  let updated = original.replace(/versionCode\s+\d+/, `versionCode ${code}`);
  updated = updated.replace(
    /versionName\s+"[^"]*"/,
    `versionName "${version}"`,
  );

  if (updated === original) {
    console.warn(
      "[release-apk] No se encontro versionCode/versionName en android/app/build.gradle.",
    );
    return false;
  }

  fs.writeFileSync(APP_BUILD_GRADLE, updated, "utf8");
  return true;
}

function updateProjectVersion(version, code) {
  const appJsonPath = path.join(PROJECT_ROOT, "app.json");
  const packageJsonPath = path.join(PROJECT_ROOT, "package.json");
  const packageLockPath = path.join(PROJECT_ROOT, "package-lock.json");

  const appJson = readJson(appJsonPath);
  appJson.expo.version = version;
  appJson.expo.runtimeVersion = version;
  appJson.expo.android = appJson.expo.android ?? {};
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

  // Fuente de verdad real para el APK instalado.
  updateAndroidGradleVersion(version, code);
}

function readProjectVersion() {
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
  const storageDir = path.join(args.backendRoot, "storage");
  const versionFile = path.join(storageDir, "pallet_version.json");
  const apkName = `${APK_PREFIX}-v${args.version}.apk`;

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

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
    downloadUrl: `${DOWNLOAD_BASE}/${apkName}`,
    changelog,
  };

  writeJson(versionFile, data);
}

function buildApk() {
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
  if (!fs.existsSync(APK_SOURCE)) {
    throw new Error(`No existe el APK generado: ${APK_SOURCE}`);
  }

  const updatesDir = path.join(args.backendRoot, "updates");
  if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
  }

  const destination = path.join(
    updatesDir,
    `${APK_PREFIX}-v${args.version}.apk`,
  );
  fs.copyFileSync(APK_SOURCE, destination);
  return destination;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.sync) {
    const { version, code } = readProjectVersion();
    if (!version || !Number.isInteger(code)) {
      throw new Error("app.json no tiene version/versionCode validos.");
    }
    const ok = updateAndroidGradleVersion(version, code);
    console.log(
      ok
        ? `[release-apk] build.gradle sincronizado -> ${version} (code ${code}).`
        : "[release-apk] No se pudo sincronizar build.gradle.",
    );
    return;
  }

  if (args.bump) {
    const r = bumpVersion();
    console.log(
      `[release-apk] version: ${r.currentVersion} -> ${r.nextVersion}`,
    );
    console.log(`[release-apk] versionCode: ${r.currentCode} -> ${r.nextCode}`);
    return;
  }

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
        console.warn(
          `[release-apk] No se pudo actualizar el backend: ${error.message}`,
        );
      }
    }

    return;
  }

  assertValidArgs(args);

  updateProjectVersion(args.version, args.code);

  if (args.build) {
    buildApk();
  }

  let copiedApk = null;
  if (args.copyApk) {
    copiedApk = copyApk(args);
  }

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
