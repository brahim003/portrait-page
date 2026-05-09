// =============================================================
//  script.js — Core Generation Logic (Matched to File 2 Style)
// =============================================================

window.executeCoreLogic = async function (croppedImageSrc, userText) {

    // ----------------------------------------------------------
    // 1. SETTINGS (Resolution 150 for high detail, matching File 2)
    // ----------------------------------------------------------
    const resolution = 150; 
    const myText = userText.replace(/[.,]/g, "")
    .replace(/\s+/g, ' ').trim() + " ";

    // ----------------------------------------------------------
    // 2. LOAD THE CROPPED IMAGE
    // ----------------------------------------------------------
    const img = new Image();
    img.src = croppedImageSrc;

    await new Promise((resolve, reject) => {
        img.onload  = resolve;
        img.onerror = () => reject(new Error("Failed to load the cropped image."));
    });

    // ----------------------------------------------------------
    // 3. HTML ART GENERATION (For Preview on Page)
    // ----------------------------------------------------------
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    const width  = resolution;
    const scale  = img.height / img.width;
    const height = Math.floor(width * scale); // Removed the * 0.98 multiplier to match File 2

    canvas.width  = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;

    let htmlOutput = "";
    let charIndex  = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];

            const char = myText[charIndex % myText.length];
            charIndex++;

            htmlOutput += `<span style="color: rgb(${r},${g},${b})">${char}</span>`;
        }
        htmlOutput += "\n";
    }

    const container = document.getElementById('portrait-container');
    if (container) {
        container.innerHTML = htmlOutput;
    }

    // ----------------------------------------------------------
    // 4. PDF GENERATION (Standardized spacing & size)
    // ----------------------------------------------------------
    try {
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth  = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        // Black background
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pdfWidth, pdfHeight, 'F');

        // Normal line spacing (1.0) so lines don't overlap vertically
        const lineSpacing = 1.5; 
        const w = resolution;
        const h = Math.floor(w * scale / lineSpacing);

        const stepX = pdfWidth / w;
        const stepY = stepX * lineSpacing;

        // Normal weight text (removed bold) to match HTML default
        doc.setFont("courier", "bold"); 
        
        // Lower multiplier (2.5 - 3.0) gives normal HTML-like character sizing
        doc.setFontSize(stepX * 6.0); 

        const pdfCanvas = document.createElement('canvas');
        const pdfCtx    = pdfCanvas.getContext('2d');
        pdfCanvas.width  = w;
        pdfCanvas.height = h;
        pdfCtx.drawImage(img, 0, 0, w, h);

        const pdfImageData = pdfCtx.getImageData(0, 0, w, h).data;
        let pdfCharIndex   = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const r = pdfImageData[i];
                const g = pdfImageData[i + 1];
                const b = pdfImageData[i + 2];

                // Removed the dark-pixel skip logic. Every pixel prints a letter now.

                const char = myText[pdfCharIndex % myText.length];
                pdfCharIndex++;

                doc.setTextColor(r, g, b);
                
                // Standard baseline positioning
                doc.text(char, x * stepX, (y * stepY) + stepY);
            }
        }

        // Force-download logic
        const pdfBlob            = doc.output('blob');
        const blobUrl            = URL.createObjectURL(pdfBlob);
        const downloadLink       = document.createElement('a');
        downloadLink.href        = blobUrl;
        downloadLink.download    = 'Portrait.pdf';
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);
        
        console.log("PDF generated with File 2 aesthetic!");

    } catch (error) {
        console.error("PDF Error: ", error);
        throw error; 
    }
};