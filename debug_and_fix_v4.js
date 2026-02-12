import fs from 'fs';

const targetFile = "C:\\Users\\USUARIO\\Documents\\teg\\src\\components\\TegMap.tsx";

try {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Normalize artifact to @@@ for easier matching
    // Handle both \uFFFD and potential case variants
    let standardized = content
        .replace(/\\uFFFD/gi, "@@@")
        .replace(/\\ufffd/gi, "@@@");

    const replacements = [
        // 1. The strange '0' artifact for É
        { pattern: /@@@0/g, replacement: "É" },

        // 2. Suffixes/Context
        { pattern: /CI@@@N/g, replacement: "CIÓN" },
        { pattern: /SI@@@N/g, replacement: "SIÓN" },
        { pattern: /GI@@@N/g, replacement: "GIÓN" },
        { pattern: /ci@@@n/g, replacement: "ción" },
        { pattern: /si@@@n/g, replacement: "sión" },

        { pattern: /LOG@@@A/g, replacement: "LOGÍA" },
        { pattern: /QU@@@A/g, replacement: "QUÍA" },
        { pattern: /log@@@a/g, replacement: "logía" },
        { pattern: /qu@@@a/g, replacement: "quía" },

        { pattern: /A@@@O/g, replacement: "AÑO" },
        { pattern: /a@@@o/g, replacement: "año" },

        // Specifics
        { pattern: /TURQU@@@/g, replacement: "TURQUÍA" },
        { pattern: /B@@@SFORO/g, replacement: "BÓSFORO" },
        { pattern: /ANT@@@TICA/g, replacement: "ANTÁRTICA" },
        { pattern: /Am@@@rica/g, replacement: "América" },
        { pattern: /Pr@@@ximo/g, replacement: "Próximo" },
        { pattern: /pr@@@ximo/g, replacement: "próximo" },
        { pattern: /Espa@@@ol/g, replacement: "Español" },
        { pattern: /Espa@@@a/g, replacement: "España" },
        { pattern: /espa@@@ol/g, replacement: "español" },
        { pattern: /Est@@@n/g, replacement: "Están" },
        { pattern: /M@@@S/g, replacement: "MÁS" }, // M@@@S -> MÁS

        // Risky Fallbacks
        { pattern: /@@@N/g, replacement: "ÓN" },
        { pattern: /@@@A/g, replacement: "ÍA" },
        { pattern: /@@@/g, replacement: "Ó" } // Blind guess for remaining? Or keep as marker?
        // Let's replace remaining @@@ with a distinct char to find them, or just assume Ó
    ];

    let fixed = standardized;
    let count = 0;
    replacements.forEach(rep => {
        const matches = fixed.match(rep.pattern);
        if (matches) {
            count += matches.length;
            fixed = fixed.replace(rep.pattern, rep.replacement);
        }
    });

    // Check remainders
    const remaining = fixed.match(/@@@/g);
    if (remaining) {
        console.log(`WARNING: ${remaining.length} un-repaired artifacts remain (will be left as @@@).`);
        // Log context
        const regex = /.{0,10}@@@.{0,10}/g;
        let m;
        let c = 0;
        while ((m = regex.exec(fixed)) !== null && c < 10) {
            console.log(m[0]);
            c++;
        }
    } else {
        console.log("ALL CLEARED.");
    }

    fs.writeFileSync(targetFile, fixed, 'utf8');
    console.log(`Saved. Repairs: ${count}`);

} catch (err) {
    console.error(err);
}
