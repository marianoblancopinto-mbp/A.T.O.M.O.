import fs from 'fs';

const targetFile = "C:\\Users\\USUARIO\\Documents\\teg\\src\\components\\TegMap.tsx";

try {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Debug: Find "REFUNDACI" and print next 20 chars
    const idx = content.indexOf("REFUNDACI");
    if (idx !== -1) {
        console.log("Snippet around REFUNDACI:");
        console.log(content.substring(idx, idx + 20));
        // Check for double backslash
        if (content.substring(idx, idx + 20).includes("\\\\u")) {
            console.log("DETECTED DOUBLE BACKSLASH!");
        }
    }

    // Manual string replacements (safer than regex)
    const pairs = [
        ["CI\\uFFFDN", "CIÓN"],
        ["SI\\uFFFDN", "SIÓN"],
        ["GI\\uFFFDN", "GIÓN"],
        ["A\\uFFFDO", "AÑO"],
        ["DISE\\uFFFDO", "DISEÑO"],
        ["\\uFFFD0", "É"], // The 0 artifact
        ["TURQU\\uFFFDA", "TURQUÍA"],
        ["TECNOLOG\\uFFFDA", "TECNOLOGÍA"],
        ["B\\uFFFDSFORO", "BÓSFORO"],
        ["REFUNDACI\\uFFFDN", "REFUNDACIÓN"],
        ["DETENCI\\uFFFDN", "DETENCIÓN"],
        ["INTRODUCCI\\uFFFDN", "INTRODUCCIÓN"],
        ["DESCRIPCI\\uFFFDN", "DESCRIPCIÓN"],
        ["OPERACI\\uFFFDN", "OPERACIÓN"],
        ["ACTUALIZACI\\uFFFDN", "ACTUALIZACIÓN"],
        ["Am\\uFFFDrica", "América"],
        ["ANT\\uFFFDTICA", "ANTÁRTICA"],
        ["Pr\\uFFFDximo", "Próximo"],
        ["pr\\uFFFDximo", "próximo"],
        ["Espa\\uFFFDol", "Español"],
        ["Espa\\uFFFDa", "España"],
        ["Est\\uFFFDn", "Están"],

        // Lowercase variants
        ["ci\\uFFFDn", "ción"],
        ["si\\uFFFDn", "sión"],
        ["diSe\\uFFFDo", "diseño"], // unlikely casing
        ["a\\uFFFDo", "año"], // "Año" covered?

        // Fallbacks for remaining
        ["\\uFFFDO", "ÑO"], // RISK?
        ["\\uFFFDA", "ÍA"],
        ["\\uFFFDN", "ÓN"]
    ];

    let fixed = content;
    pairs.forEach(([bad, good]) => {
        const parts = fixed.split(bad);
        if (parts.length > 1) {
            console.log(`Fixing ${parts.length - 1} instances of '${bad}' -> '${good}'`);
            fixed = parts.join(good);
        }
    });

    // Write
    fs.writeFileSync(targetFile, fixed, 'utf8');

    // Scan remaining
    const remaining = fixed.match(/\\uFFFD/g);
    if (remaining) {
        console.log(`Still ${remaining.length} artifacts.`);
    } else {
        console.log("CLEAN!");
    }

} catch (err) {
    console.error(err);
}
