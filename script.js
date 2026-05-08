const container = document.getElementById('portrait-container');
const img = new Image();

// --- إعدادات المستخدم ---
img.src = 'hind3.png'; // تأكد أن اسم صورتك يطابق هذا تماماً
const resolution = 150; // عدد الحروف عرضاً (زدها لزيادة الدقة)
const myText = "Sbah lkhir my baby boy Xti rani jit labsa hwaj dyal l3oman mn ltaht ghir mabghitix tkhlini osf hxuma 3lik wlah Baby boyyy sf ghir tl3 bla mantala9aw db hta tsaliw Bstini fajeatan o3jbatni htx kant bzrba drtiha bla matchawr m3aya Hadxi kakay3nix khsk tdir xihaja bla matchawr meaya In ur sweet dreams When u gonna be my Babe had promo ma3mrni n3tihlk mara akhra khtar blasa akhra limaslahtk Hado t9dr t9ihom when u gonna be my man and u are sleeping with me Babe xhal ohna m3a b3d ylh simana u kissed jbhti my hands hadxi rah bzaf for me Good morning my man Fin oulino Rah wakha xno man9ol khsni ntl9ak bax n3abarlk 3la had love likanhseb bih Dima kan9ol lyum antla9ah and im not gonna kiss him flkhr ana lima controlich U prp sleeping db hubinu dyali so maghadix tjawbji db ms rah tlft ma3fftx xni ndir lyum Deja barh khft 3lik bzaf jani feeling khayb mli kna jayin I want him ! Hadxi maka3nix bghito ghir bafdal lhalat lih bghito w hwa 3ayan bghito in his darker side i want him and i love him hta mli hwa he doesn't like him self bghit nxof onsma3 dahkato bghit nkhlih dima frhan bghit ykon m3aya onsa ga3 dakxi lim3sbo bghit nkon source of his happiness odima n3rih ghit feelings zwinin i promise him i will do my best for him and i to be the best version of ourselves Drtha with love wakha majatx kif bghit hitax zrbt but wa3ra Kanbghik Thank u for the memo lwa3rin today Kif sbh my pancake I miss him btw Oxhal knt baghah ykon m3aya lyuma Khsna nharbo b our love bax nokono m3a b3diyatna f future libghina rah man9drx nkon m3a another one sf ur my future Kanbghik wlah ma3rftx kifax anwslk my feelings db ms rah knt ka3ya bjhd ghir 9rit had msgs u make me happy bla manhes Ah knt an9olhalj maymknx xhal 3jbatni glsa d barh Twahaxt daddy I need his hug as fuck Lae ghir hanan mn 3ndk oxwiya mn 3ndi wahd love xihaja lkhrr Bjoj 3yanin maghadix n9dro ghir lhob aykon kafina nrtaho on3so m3n9in b3diyatna Ymkn mli antzwzo anhyajo w9t ghir love ohanan bih Ana nsm3lk Onfhmk on3an9ek fhal mamak bla manhkm 3lik Onta atfhmni fhal bntk"; // النص الذي سيبني الصورة
// -----------------------

img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // حساب الأبعاد للحفاظ على النسبة (Aspect Ratio)
    const width = resolution;
    const scale = img.height / img.width;
    const height = Math.floor(width * scale);

    canvas.width = width;
    canvas.height = height;

    // رسم الصورة على الكانفاس لتسهيل قراءة البيانات
    ctx.drawImage(img, 0, 0, width, height);
    
    // الحصول على بيانات الألوان (RGBA)
    const imageData = ctx.getImageData(0, 0, width, height).data;

    let htmlOutput = "";
    let charIndex = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // كل بكسل يأخذ 4 خانات في مصفوفة imageData (R, G, B, A)
            const i = (y * width + x) * 4;
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];

            // اختيار الحرف التالي من النص المخصص
            const char = myText[charIndex % myText.length];
            charIndex++;

            // بناء HTML: تلوين الحرف بلون البكسل
            htmlOutput += `<span style="color: rgb(${r},${g},${b})">${char}</span>`;
        }
        htmlOutput += "\n"; // الانتقال لسطر جديد بعد انتهاء العرض
    }

    container.innerHTML = htmlOutput;
    console.log("Art Generated Successfully!");
};

img.onerror = () => {
    container.innerHTML = "<h2 style='color:white;'>خطأ: لم يتم العثور على الصورة 'me.jpg'</h2>";
};