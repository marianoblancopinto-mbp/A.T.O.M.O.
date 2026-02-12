import fs from 'fs';

const targetFile = "C:\\Users\\USUARIO\\Documents\\teg\\src\\components\\TegMap.tsx";

try {
    let content = fs.readFileSync(targetFile, 'utf8');

    const replacements = [
        // Words/Suffixes observed or inferred
        { pattern: /QU\\uFFFDA/g, replacement: "QUÍA" }, // TURQUÍA
        { pattern: /LOG\\uFFFDA/g, replacement: "LOGÍA" }, // TECNOLOGÍA
        { pattern: /CI\\uFFFDN/g, replacement: "CIÓN" }, // REFUNDACIÓN, OPCIÓN
        { pattern: /SI\\uFFFDN/g, replacement: "SIÓN" }, // MISIÓN, VISIÓN
        { pattern: /GI\\uFFFDN/g, replacement: "GIÓN" }, // REGIÓN
        { pattern: /B\\uFFFDSFORO/g, replacement: "BÓSFORO" }, // BÓSFORO
        { pattern: /ANT\\uFFFDTICA/g, replacement: "ANTÁRTICA" }, // ANTÁRTICA
        { pattern: /Am\\uFFFDrica/g, replacement: "América" }, // América
        { pattern: /Refundaci\\uFFFDn/g, replacement: "Refundación" }, // Refundación
        { pattern: /refundaci\\uFFFDn/g, replacement: "refundación" }, // refundación
        { pattern: /Est\\uFFFDn/g, replacement: "Están" }, // Están? Maybe
        // Check for specific single chars if bounded?
        // Let's handle known single words
        { pattern: /S\\uFFFDLO/g, replacement: "SÓLO" },
        { pattern: /s\\uFFFDlo/g, replacement: "sólo" },
        { pattern: /M\\uFFF3/g, replacement: "MÁS" }, // MÁS? Wait, \uFFF3 might be wrong guess, stick to FFFD if that's what user sees.

        // Common Spanish ending fixes if FFFD is generic
        { pattern: /a\\uFFFD/g, replacement: "añ" }, // Espa\uFFFD -> Españ? (E.g. España)
        // Wait, \uFFFD is 65533. 
    ];

    let fixedContent = content;
    let replacementCount = 0;

    replacements.forEach(rep => {
        // Count occurrences
        const matches = fixedContent.match(rep.pattern);
        if (matches) {
            replacementCount += matches.length;
            fixedContent = fixedContent.replace(rep.pattern, rep.replacement);
            console.log(`Replaced ${matches.length} occurrences of ${rep.pattern}`);
        }
    });

    // Check for remaining \uFFFD
    const remaining = fixedContent.match(/\\uFFFD/g);
    if (remaining) {
        console.log(`WARNING: There are still ${remaining.length} occurrences of \\uFFFD remaining.`);

        // Extract context for remaining ones to help debug
        let match;
        const regex = /.{0,10}\\uFFFD.{0,10}/g;
        console.log("Samples of remaining artifacts:");
        let sampleCount = 0;
        while ((match = regex.exec(fixedContent)) !== null && sampleCount < 10) {
            console.log(match[0]);
            sampleCount++;
        }
    } else {
        console.log("SUCCESS: No occurrences of \\uFFFD remain.");
    }

    fs.writeFileSync(targetFile, fixedContent, 'utf8');
    console.log(`File saved. Total known repairs: ${replacementCount}`);

} catch (err) {
    console.error(err);
}
