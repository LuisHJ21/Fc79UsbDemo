const { withAppBuildGradle } = require("expo/config-plugins");

// Delimitadores del bloque inyectado. Permiten reemplazar una version anterior
// del bloque en vez de acumular copias o quedarse con una desactualizada.
const BEGIN = "// >>> release-apk auto publish (generado, no editar) >>>";
const END = "// <<< release-apk auto publish <<<";

const GRADLE_BLOCK = `
${BEGIN}
/**
 * Publicacion automatica del APK release.
 *
 * Bloque inyectado por plugins/withReleaseAutoPublish.js. No editar a mano:
 * cada \`expo prebuild\` lo vuelve a generar desde el plugin.
 *
 * Publicacion automatica y versionado del APK release.
 *
 * Corre en doLast, es decir SOLO cuando assembleRelease termina con exito
 * (si el build falla antes, nada de esto ocurre, asi que un build roto NO
 * sube la version). Lo dispara tanto \`gradlew assembleRelease\` como
 * \`npx expo run:android --variant release\` (installRelease depende de assemble).
 *
 * Orden:
 *   1. --auto : publica la version ACTUAL de app.json (copia el APK al backend
 *               como pallet-vX.X.X.apk y actualiza pallet_version.json).
 *   2. --bump : sube versionCode +1 y el patch de version, dejando app.json
 *               listo para el proximo build.
 *
 * Asi el APK publicado siempre coincide con su version, y la version solo
 * avanza tras un build exitoso. --auto es resiliente: si el backend no es
 * accesible solo avisa, no rompe el build.
 *
 * Interruptores:
 *   -Ppallet.autoPublishRelease=false    No publica al backend.
 *   -Ppallet.autoBumpVersionCode=false   No sube la version tras el build.
 */
def enableAutoPublish = (findProperty('pallet.autoPublishRelease') ?: 'true').toBoolean()
def enableAutoBump = (findProperty('pallet.autoBumpVersionCode') ?: 'true').toBoolean()
def releaseScriptDir = projectRoot

/**
 * Corre \`node scripts/release-apk.js <args>\` y reenvia su salida al log.
 *
 * Se usa ProcessBuilder y no el \`exec {}\` de Gradle porque ese metodo ya no
 * existe dentro de doLast en Gradle 9 (este proyecto usa 9.0.0). Nunca lanza
 * excepcion: un backend caido no debe romper un build que ya fue exitoso.
 */
def ejecutarRelease = { List<String> args ->
    try {
        def esWindows = System.getProperty('os.name').toLowerCase().contains('windows')
        def comando = esWindows
            ? (['cmd', '/c', 'node', 'scripts/release-apk.js'] + args)
            : (['node', 'scripts/release-apk.js'] + args)

        def pb = new ProcessBuilder(comando)
        pb.directory(new File(releaseScriptDir))
        pb.redirectErrorStream(true)

        def proc = pb.start()
        proc.inputStream.eachLine { linea -> println linea }
        def codigo = proc.waitFor()

        if (codigo != 0) {
            println "[release-apk] El script termino con codigo \${codigo} (se ignora, el build ya fue exitoso)."
        }
    } catch (Exception e) {
        println "[release-apk] No se pudo ejecutar el script: \${e.message}"
    }
}

tasks.configureEach { task ->
    if (task.name == 'assembleRelease') {
        task.doLast {
            def apk = new File(releaseScriptDir, "android/app/build/outputs/apk/release/app-release.apk")
            if (!apk.exists()) {
                println "[release-apk] No se encontro el APK release, se omite publicacion/versionado."
                return
            }

            if (enableAutoPublish) {
                println "[release-apk] Publicando APK release al backend..."
                ejecutarRelease(["--auto"])
            }

            if (enableAutoBump) {
                println "[release-apk] Preparando la siguiente version..."
                ejecutarRelease(["--bump"])
            }
        }
    }
}
${END}
`;

/** Quita una version anterior del bloque, si existe. */
function stripBlockAnterior(contents) {
  const inicio = contents.indexOf(BEGIN);
  if (inicio === -1) return contents;

  const fin = contents.indexOf(END, inicio);
  if (fin === -1) {
    // Bloque sin cierre (editado a mano): se corta desde el inicio.
    return contents.slice(0, inicio).trimEnd() + "\n";
  }

  const resto = contents.slice(fin + END.length);
  return (contents.slice(0, inicio).trimEnd() + "\n" + resto.trimStart()).trimEnd() + "\n";
}

/**
 * Agrega al final de android/app/build.gradle el hook que publica el APK
 * release y prepara la siguiente version.
 */
const withReleaseAutoPublish = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") {
      throw new Error(
        "withReleaseAutoPublish solo soporta build.gradle en Groovy, no Kotlin DSL.",
      );
    }

    cfg.modResults.contents = stripBlockAnterior(cfg.modResults.contents) + GRADLE_BLOCK;
    return cfg;
  });

module.exports = withReleaseAutoPublish;
