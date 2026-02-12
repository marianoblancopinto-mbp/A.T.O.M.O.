import fs from 'fs';

const targetFile = "C:\\Users\\USUARIO\\Documents\\teg\\src\\components\\TegMap.tsx";

try {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Order matters! Specific to generic.
    const replacements = [
        // Specific artifact for 'É' observed in logs
        { pattern: /\\uFFFD0/g, replacement: "É" },

        // Specific words
        { pattern: /A\\uFFFDO/g, replacement: "AÑO" },
        { pattern: /a\\uFFFDo/g, replacement: "año" },
        { pattern: /Espa\\uFFFDol/g, replacement: "Español" },
        { pattern: /espa\\uFFFDol/g, replacement: "español" },
        { pattern: /Espa\\uFFFDa/g, replacement: "España" },
        { pattern: /Pr\\uFFFDximo/g, replacement: "Próximo" },
        { pattern: /pr\\uFFFDximo/g, replacement: "próximo" },

        // Suffixes - ION
        { pattern: /CI\\uFFFDN/g, replacement: "CIÓN" },
        { pattern: /SI\\uFFFDN/g, replacement: "SIÓN" },
        { pattern: /GI\\uFFFDN/g, replacement: "GIÓN" },
        { pattern: /ci\\uFFFDn/g, replacement: "ción" },
        { pattern: /si\\uFFFDn/g, replacement: "sión" },

        // Suffixes - IA
        { pattern: /LOG\\uFFFDA/g, replacement: "LOGÍA" },
        { pattern: /QU\\uFFFDA/g, replacement: "QUÍA" },
        { pattern: /R\\uFFFDA/g, replacement: "RÍA" }, // Mayoría, Batería...
        { pattern: /log\\uFFFDA/g, replacement: "logía" },

        // Specifics from memory/context
        { pattern: /B\\uFFFDSFORO/g, replacement: "BÓSFORO" },
        { pattern: /ANT\\uFFFDTICA/g, replacement: "ANTÁRTICA" },
        { pattern: /Am\\uFFFDrica/g, replacement: "América" },
        { pattern: /Est\\uFFFDn/g, replacement: "Están" },

        // Catch-alls for common patterns if context allows
        { pattern: /\\uFFFDA/g, replacement: "ÍA" }, // High probability at end of words
        { pattern: /\\uFFFDo/g, replacement: "ñ" }, // Risky? A\uFFFDo -> Año.

        // Attempt to cleanup remaining single Replace Chars if likely:
        // "M\uFFFD" -> "MÍ"? "MÁ"?
    ];

    let fixedContent = content;
    let totalRepairs = 0;

    replacements.forEach(rep => {
        const matches = fixedContent.match(rep.pattern);
        if (matches) {
            totalRepairs += matches.length;
            fixedContent = fixedContent.replace(rep.pattern, rep.replacement);
        }
    });

    // Write back
    fs.writeFileSync(targetFile, fixedContent, 'utf8');

    // Check remaining
    const remaining = fixedContent.match(/\\uFFFD/g);
    console.log(`Repaired ${totalRepairs} patterns.`);
    if (remaining) {
        console.log(`Still ${remaining.length} artifacts remaining.`);
        // formatting samples
        const regex = /.{0,15}\\uFFFD.{0,15}/g;
        let m;
        let c = 0;
        while ((m = regex.exec(fixedContent)) !== null && c < 20) {
            console.log(m[0]);
            c++;
        }
    } else {
        console.log("Clean match.");
    }

} catch (err) {
    console.error(err);
}
