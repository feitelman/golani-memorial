import { Battle, toMinutes } from "./types";

// ─────────────────────────────────────────────────────────
// תוכן אמיתי — קרבות מוצב נחל עוז, 7 באוקטובר 2023.
// יובא מאתר "מפת קרב" (Lovable / Supabase) — גדוד 13, חטיבת גולני וצוות הקרב הגדודי.
// תמונות הלוחמים מאוחסנות ב-Supabase Storage הציבורי של אותו פרויקט.
// ─────────────────────────────────────────────────────────

function build(b: Omit<Battle, "startMinute" | "endMinute">): Battle {
  return {
    ...b,
    // Marker reveals at the engagement time (the replay window can still open
    // earlier — that's handled separately in MapExperience).
    startMinute: toMinutes(b.time),
    endMinute: toMinutes(b.timeline[b.timeline.length - 1]?.time ?? b.time),
  };
}

export const BATTLES: Battle[] = [
  build({
    id: "nahal-oz-hamal",
    slug: "nahal-oz-hamal",
    title: "קרב חמ\"ל נחל עוז",
    kind: "battle",
    date: "2023-10-07",
    time: "07:30",
    coordinates: [34.500837924956, 31.4795462059209],
    locationName: "מוצב נחל עוז",
    unit: "גדוד 13, חטיבת גולני",
    summary: "קרב בלימה והגנה על חמ\"ל התצפיות במוצב נחל עוז",
    description: "בוקר השבת של ה-7 באוקטובר הפך את חמ\"ל התצפיות בנחל עוז לזירת קרב של גבורה עילאית ותנאים בלתי אפשריים. בעוד המחנה מוצף במאות מחבלים, התייצבו תצפיתניות, קציני מטה ולוחמים בקו ההגנה האחרון, נחושים להגן על \"העיניים של המדינה\" ועל חבריהם ליחידה.\nתחת אש כבדה, יצרו קציני המטה של גדוד 13 עמדת בלימה בפתח החמ\"ל, בעוד הסמב\"ציות פועלות תחת לחץ עצום להעברת תמונת מצב לחטיבה. אל הכוח הצטרפו סרן יוחאי דוכן וסרן נמרוד אלירז, יחד עם הגשש הבכיר רס\"ב איברהים ח'רובה והלוחם סמ\"ר איתי אברהם רון, לאחר שלחמו בחירוף נפש ברחבי המחנה. בנחיתות מספרית מובהקת ובנשק קל בלבד, ניהל הכוח קרב בלימה עיקש שארך שעות, כשהם הודפים גל אחר גל של מחבלים המצוידים בטילי נ\"ט ומטענים.\nבשעה 07:48 נדמו מכשירי הקשר, אך הרוח לא נשברה. סרן עידן בלוי, קצין הקשר הגדודי, המשיך לכוון כוחות מהאוויר ומהיבשה עד לרגעיו האחרונים. כשהתחמושת החלה לאזול והאויב קרא להם להיכנע, ענו הלוחמים בסירוב מוחלט. ברגע של תושייה עילאית וקרב פנים אל פנים, השתלטו הלוחמים בידיים חשופות על מחבל שניסה לפרוץ פנימה ונטרלו אותו באמצעות סכין.\nכשהבינו המחבלים כי לא יוכלו להכניע את הכוח בלחימה, השליכו לתוך החמ\"ל רימוני בערה שפלטו גזים רעילים והציתו אש תופת. בתוך חשיכה מוחלטת ועשן סמיך וחונק, סייעו הלוחמים והחיילות איש לרעהו, מגששים באפילה בניסיון נואש להציל חיים. שבעה ניצולים הצליחו לחלץ את עצמם דרך חלון השירותים הצר, בעוד חבריהם נותרים מאחור, נאבקים עד נשימתם האחרונה.\nבקרב זה נפלו גיבורי וגיבורות החמ\"ל:\nסגן יוחאי דוכן ז\"ל \nסרן עידן בלוי ז\"ל \nסרן שיר אילת ז\"ל \nרס\"ב איברהים ח'רובה ז\"ל \nסמ\"ר איתי אברהם רון ז\"ל \nסמ\"ר דניאל ראשד ז\"ל \nסמל אושר ברזילי ז\"ל \nסמ\"ר שיראל חיים-פור ז\"ל \nסמ\"ר ים גלס ז\"ל \nסמל יעל לייבושור ז\"ל \nרב\"ט מיה ויאלובו פולו ז\"ל \nסמל רוני אשל ז\"ל \nסמל שירה שוחט ז\"ל \nסמ\"ר עדי לנדמן ז\"ל \nסמל שיראל מור ז\"ל\n\nבמסירותם ובחוסנם, עמדו מגיני החמ\"ל כחומה בצורה מול אויב אכזר. הם לחמו יחד – קצינים, לוחמים ותצפיתניות – וכתבו בדם ובאש פרק של רעות וגבורה שייחרט לעד בתולדות ישראל. יהי זכרם ברוך.",
    media: [
    ],
    timeline: [
      { id: "nahal-oz-hamal-t0", time: "06:29", endTime: "07:30", title: "צבע אדום בכלל רחבי הגזרה, איוש מוגבר בחמ\"ל" },
      { id: "nahal-oz-hamal-t1", time: "07:30", endTime: "07:48", title: "ניסיונות מחבלים לחדור לחמ\"ל, לחימה עיקשת בכניסה." },
      { id: "nahal-oz-hamal-t2", time: "07:48", endTime: "11:00", title: "נופלת התקשורת בחמ\"ל" },
      { id: "nahal-oz-hamal-t3", time: "11:00", endTime: "11:30", title: "נופל החשמל בחמ\"ל" },
      { id: "nahal-oz-hamal-t4", time: "11:30", endTime: "12:00", title: "התחמושת אוזלת, הלוחמים החלו בלחימה בידיים חשופות כנגד המחבלים." },
      { id: "nahal-oz-hamal-t5", time: "12:00", endTime: "14:00", title: "המחבלים החלו לשרוף את החמ\"ל" },
      { id: "nahal-oz-hamal-t6", time: "14:00", endTime: "14:05", title: "החל מבצע חילוץ בפיקוד קציני חטיבת גולני, שבסופו חולצו שבעה חיילים מהחמ\"ל." },
    ],
    fallen: [
      {
        id: "7b8ab1e7",
        fullName: "עידן בלוי",
        rank: "סרן",
        age: 21,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/7b8ab1e7.jpg",
        hometown: "ראשון לציון",
        memorial: "פלס\"ם, גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "c2efb952",
        fullName: "שיר אילת",
        rank: "סרן",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/c2efb952.jpg",
        hometown: "כפר שמואל",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "23bae5e7",
        fullName: "יוחאי דוכן",
        rank: "סגן",
        age: 26,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/23bae5e7.jpg",
        hometown: "קריית ארבע",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "e218d50b",
        fullName: "איברהים ח'רובה",
        rank: "רס\"ב",
        age: 39,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/e218d50b.jpeg",
        hometown: "מע'אר",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "5158bc9a",
        fullName: "איתי אברהם רון",
        rank: "סמ\"ר",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/5158bc9a.jpg",
        hometown: "נס ציונה",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "e8147ff6",
        fullName: "דניאל ראשד",
        rank: "סמ\"ר",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/e8147ff6.jpg",
        hometown: "שפרעם",
        memorial: "פלס\"ם, גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "9f85239e",
        fullName: "אושר שמחה ברזילי",
        rank: "סמל",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/9f85239e.jpg",
        hometown: "מזכרת בתיה",
        memorial: "חטיבה צפונית",
        affiliation: "combat_team",
      },
      {
        id: "34309c7d",
        fullName: "שיראל חיים פור",
        rank: "סמ\"ר",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/34309c7d.jpg",
        hometown: "ראשון לציון",
        memorial: "חטיבה צפונית",
        affiliation: "combat_team",
      },
      {
        id: "e47bf80c",
        fullName: "ים גלס",
        rank: "סמ\"ר",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/e47bf80c.jpg",
        hometown: "מודיעין",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "1f3c92fe",
        fullName: "יעל לייבושור",
        rank: "סמל",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/1f3c92fe.jpg",
        hometown: "ירושלים",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "5f5bd432",
        fullName: "מיה ויאלובו פולו",
        rank: "רב\"ט",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/5f5bd432.jpg",
        hometown: "תל אביב",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "1f5d755f",
        fullName: "רוני אשל",
        rank: "סמל",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/1f5d755f.jpg",
        hometown: "צור יצחק",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "a6135e15",
        fullName: "שירה שוחט",
        rank: "סמל",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/a6135e15.jpg",
        hometown: "שריגים",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "8dc7fb10",
        fullName: "עדי לנדמן",
        rank: "סמ\"ר",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/8dc7fb10.jpg",
        hometown: "יקנעם עילית",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
      {
        id: "8afb3562",
        fullName: "שיראל מור",
        rank: "סמל",
        age: 19,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/8afb3562.jpg",
        hometown: "רעננה",
        memorial: "מערך הגנת הגבולות",
        affiliation: "combat_team",
      },
    ],
  }),
  build({
    id: "nahal-oz-assault",
    slug: "nahal-oz-assault",
    title: "ניסיון כיבוש המוצב",
    kind: "rescue",
    date: "2023-10-07",
    time: "08:20",
    coordinates: [34.5023344648505, 31.4785264578427],
    locationName: "מוצב נחל עוז",
    unit: "פלוגה ב', גדוד 13, חטיבת גולני",
    summary: "ניסיון כיבוש המוצב בחזרה על ידי חפ\"ק מ\"פ ב'",
    description: "בוקר השבת של ה-7 באוקטובר תפס את רס\"ן שילה הר-אבן, מפקד פלוגה ב' (\"גרנט\"), בעיצומה של היערכות לתרגיל כוננות בגזרת נחל עוז. בשעה 06:30, כשהשמיים התמלאו ב\"גשם סגול\", המציאות השתנתה באחת. בקור רוח האופייני לו, חדל שילה את התרגיל והכריז בקשר את המשפט שסימן את תחילתה של המערכה: \"זה לא תרגיל\".\nתחת אש כבדה ודיווחים על פריצות רבות בגדר, החל שילה לנהל קרב הגנה עיקש. הוא פיקד על \"צק\"ם נזמית\", שכלל נמ\"ר וטנק, והוביל אותם אל קו המגע. למרות פגיעות נ\"ט בכליו ותקלות מכאניות מורכבות שהגבילו את כושר התנועה, שילה לא נסוג. כאשר הבין כי סגן מפקד הגדוד נפצע, לקח על עצמו את הפיקוד על הגזרה כולה. \"אני לוקח פיקוד על האירוע\", הודיע בקשר, בעודו מנווט את כוחות הטנקים להגנה על קיבוץ כפר עזה \"בכל מחיר\".\nבמהלך הלחימה בתוך מחנה נחל עוז, תחת מטר של אש ומטענים, נפצע שילה בידו. למרות הפציעה, הוא חבש את עצמו בשטח, סירב להתפנות והמשיך לחתור למגע. בשעה 08:15, כשנודע לו על מחבלים שחדרו לבסיס והסכנה לחיי החיילים והתצפיתניות בחמ\"ל גוברת, קיבל שילה החלטה פיקודית עילאית: מכיוון שדלת הנמ\"ר נתקעה כתוצאה מפגיעה, הוא ולוחמיו יפרקו מהכלי וייכנסו לטיהור המחנה רגלית.\nבשורות הראשונות, בראש הכוח, הסתער שילה אל תוך המחנה. במשימה שהוגדרה \"להגן על הבית ולחסל כל אויב\", נתקל הכוח במארב מחבלים סמוך לשער הבסיס. בקרב פנים אל פנים, תוך גילוי גבורה יוצאת דופן ודבקות במשימה עד טיפת הדם האחרונה, נפלו שילה ולוחמיו.\nבקרב זה נפלו גיבורי פלוגה ב':\nרס\"ן שילה הר-אבן ז\"ל\nסמ\"ר יעד בן-יעקב ז\"ל\nסמ\"ר רועי ברקת ז\"ל\nסמ\"ר ישי פיטוסי ז\"ל\nסמ\"ר דביר זכאי ז\"ל\nסמ\"ר דור ירחי ז\"ל\nבמעשיהם ובפיקודם, בלמו לוחמי \"גרנט\" בגופם את התקדמות האויב, הצילו חיים רבים וכתבו בדם פרק מפואר של גבורה ומנהיגות בתולדות מדינת ישראל. יהי זכרם ברוך.",
    media: [
      { id: "26eeaa99", kind: "image", url: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/media/26eeaa99.jpg", caption: "" },
      { id: "3f105717", kind: "audio", url: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/media/3f105717.mp3", caption: "" },
    ],
    timeline: [
      {
        id: "nahal-oz-assault-t0",
        time: "08:20",
        endTime: "08:26",
        title: "כוח הלוחמים בפיקוד שילה הר אבן יצא להתקפה",
        // נתיב המחשה בלבד — להחלפה בנתונים מאומתים. הכוח נע מנקודת ההיערכות
        // לעבר הש.ג והבטונדות בכניסה למוצב.
        path: [
          { time: "08:20", coordinates: [34.5006, 31.4778] },
          { time: "08:23", coordinates: [34.5018, 31.4783] },
          { time: "08:26", coordinates: [34.50255, 31.47875] },
        ],
      },
      { id: "nahal-oz-assault-t1", time: "08:21", endTime: "08:22", title: "הכוח נמצא סמוך ל-ש.ג במרחב הבטונדות, הכוח מותקל, שילה מדווח על פצוע בכוח" },
      { id: "nahal-oz-assault-t2", time: "08:22", endTime: "08:22", title: "שילה מדווח: \"הותקלנו מלפנים. במספר מחבלים לא ידוע, לשכב מאחורי מחסות\". " },
      { id: "nahal-oz-assault-t3", time: "08:22", endTime: "08:26", title: "ניהול לחימה עם מחבלים רבים באזור הבטונדות בכניסה למוצב." },
      { id: "nahal-oz-assault-t4", time: "08:26", endTime: "08:26", title: "כלל הכוח הרגלי נופל." },
    ],
    fallen: [
      {
        id: "05b2ca38",
        fullName: "שילה הר אבן",
        rank: "רס\"ן",
        age: 25,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/05b2ca38.jpg",
        hometown: "ירושלים",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "24c2f70e",
        fullName: "יעד בן יעקב",
        rank: "סמ\"ר",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/24c2f70e.jpg",
        hometown: "פתח תקווה",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "bb0a4a4e",
        fullName: "רועי ברקת",
        rank: "סמ\"ר",
        age: 20,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/bb0a4a4e.jpg",
        hometown: "תל אביב",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "ef83ed72",
        fullName: "ישי פיטוסי",
        rank: "סמ\"ר",
        age: 21,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/ef83ed72.jpg",
        hometown: "טלמון",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "7b963a4d",
        fullName: "דביר זכאי",
        rank: "סמ\"ר",
        age: 21,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/7b963a4d.jpg",
        hometown: "טבריה",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
      {
        id: "c97461ba",
        fullName: "דור ירחי",
        rank: "סמ\"ר",
        age: 21,
        photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/c97461ba.jpg",
        hometown: "ראשון לציון",
        memorial: "פלוגה ב', גדוד 13",
        affiliation: "battalion_13",
      },
    ],
  }),

  // ═══════════════════════════════════════════════════════════
  //  מחנה פגה (מגן בארי) — 7 באוקטובר 2023
  //  פלוגה ג' 'דייגו' + מחלקת המרגמות (מסייעת) מגדוד 13 גולני,
  //  צוות טנק מגדוד 77 (שריון) וכוח חילוץ מפלוגה ב'.
  //  מרכז המוצב מאומת: [34.46953627726099, 31.451205390072268]
  //  (מגן בארי, דרומית לנחל עוז, ~300מ' מהגבול, מול ג'וחור א-דיכ).
  //  מוקדי המשנה מוקמו לפי הכיוונים בתחקיר (מרגמות ממערב, הטנקים בגזרת
  //  הגבול בדרום-מערב, ש"ג/חילוץ בדרום). ניתן לכוונון עדין בעורך המיקומים.
  // ═══════════════════════════════════════════════════════════
  build({
    id: "pgah-mortars",
    slug: "pgah-mortars",
    title: "קרב מתחם המרגמות",
    kind: "ambush",
    date: "2023-10-07",
    time: "06:55",
    coordinates: [34.46818, 31.45098], // מתחם המרגמות — ממערב למחנה, ליד רחבת הרק"ם
    locationName: "מחנה פגה",
    unit: "מחלקת המרגמות (מחלקת ה-7), פלוגה מסייעת, גדוד 13",
    summary: "מתקפת הפתע הראשונה על המחנה — הסתערות מחבלים על מתחם המרגמות",
    description: "עם שחר ה-7 באוקטובר החזיקה מחלקת המרגמות (מחלקת ה-7) של הפלוגה המסייעת כוננות ירי במתחם נפרד, ממערב למחנה 'פגה', ליד רחבת הרק\"ם. הכוח, בפיקוד סמל המחלקה סמ\"ר איתמר בן יהודה, מנה כעשרה לוחמים שהיו ערוכים ליד הנגמ\"שים, לבושים בשכפ\"צים ומוכנים לירי מרגמות לפי פקודה.\nבשעה 06:29, עם תחילת ירי התמ\"ס המסיבי, רצו הלוחמים למיגונית הגלילית הסמוכה. כשהבינו מהקשר שמדובר ב'אירוע מורכב', הכניסו מחסניות לנשקים, הביאו קסדות אישיות וקפצו לנגמ\"שים להכנת הכלים לירי. בשעה 06:45 ביקש סמל המחלקה מטרות לירי, ובשעה 06:51 ניתן אישור לירי פגזי נפיץ. בשעה 06:55 היה הכוח ערוך ומוכן.\nברגע זה הסתערו תשעה מחבלים על מתחם המרגמות משני כיוונים — הצפון-מערבי והדרום-מערבי. הלוחמים, שהופתעו בעודם ליד הנגמ\"שים, הצליחו לפגוע בחלק מהמחבלים, אך ספגו אבידות קשות. סמ\"ר חביב קיעאן נהרג מפגיעה בצווארו. המחבלים זרקו רימונים פנימה — סמ\"ר תומר ברק נפצע קשה, וסמל עידו ביננשטוק גרר אותו למחסה בין המכולות בעודו נלחם ונפצע, והמשיך להילחם עד נפילתו.\nסמל המחלקה איתמר בן יהודה נפצע בבטנו, והלוחם סמל יותם סרור חילץ אותו אחד-על-אחד תחת אש אל תוך מחנה 'פגה'. המפקד סמ\"ר יקיר לוי חזר פעם אחר פעם למתחם כדי לחלץ פצועים. שני פצועים נוספים, שהסתתרו מתחת לנגמ\"שים, חולצו לאחר שעות ארוכות בידי הכוח שעל 'נמ\"ר דייגו'.\nבמתחם המרגמות נפלו: סמל חביב קיעאן, סמל עידו ביננשטוק וסמ\"ר תומר ברק. סמל המחלקה סמ\"ר איתמר בן יהודה והלוחם סמ\"ר חיים מאיר עדן, שנפצעו אנושות בקרב זה, נפטרו לימים מפצעיהם. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "pgah-mortars-t0", time: "06:29", endTime: "06:45", title: "ירי תמ\"ס מסיבי — הלוחמים למיגונית, הכנת הכלים לירי מרגמות" },
      { id: "pgah-mortars-t2", time: "06:51", endTime: "06:55", title: "התקבל אישור ירי; הכוח ערוך ומוכן לירי" },
      { id: "pgah-mortars-t3", time: "06:55", endTime: "06:57", title: "תשעה מחבלים מסתערים על המתחם משני כיוונים" },
      { id: "pgah-mortars-t4", time: "06:57", endTime: "07:00", title: "לחימת פנים אל פנים; נפילת סמל חביב קיעאן, פצועים רבים" },
      { id: "pgah-mortars-t5", time: "07:00", endTime: "07:02", title: "פינוי פצועים אל הנאפ\"ל שבמחנה 'פגה'" },
      { id: "pgah-mortars-t6", time: "08:55", endTime: "09:00", title: "חילוץ שני הפצועים האחרונים מהמתחם ע\"י 'נמ\"ר דייגו'" },
    ],
    fallen: [
      { id: "pg-kian", fullName: "חביב קיעאן", rank: "סמל", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-kian.jpg", hometown: "חורה", memorial: "מחלקת המרגמות, גדוד 13", affiliation: "battalion_13" },
      { id: "pg-binen", fullName: "עידו דוד ביננשטוק", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-binen.jpg", hometown: "רמת גן", memorial: "מחלקת המרגמות, גדוד 13", affiliation: "battalion_13" },
      { id: "pg-barak", fullName: "תומר ברק", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-barak.jpg", hometown: "פתח תקווה", memorial: "מחלקת המרגמות, גדוד 13", affiliation: "battalion_13" },
      { id: "pg-benyehuda", fullName: "איתמר בן יהודה", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-benyehuda.jpg", hometown: "רחובות", memorial: "מחלקת המרגמות, גדוד 13", affiliation: "battalion_13" },
      { id: "pg-eden", fullName: "חיים מאיר עדן", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-eden.jpg", hometown: "רחובות", memorial: "מחלקת המרגמות, גדוד 13", affiliation: "battalion_13" },
    ],
  }),
  build({
    id: "pgah-tanks",
    slug: "pgah-tanks",
    title: "קרב הטנקים — צק\"מ סחף",
    kind: "battle",
    date: "2023-10-07",
    time: "06:33",
    coordinates: [34.46680, 31.44980], // עמדת הירי 91 — גזרת הגבול דרום-מערבית למחנה
    locationName: "מחנה פגה",
    unit: "מחלקת טנקים, גדוד 77 (שריון) — ת\"פ פלוגה ג'",
    summary: "בלימת החדירה בגדר בידי הטנקים ונפילת צוות טנק 2ב'",
    description: "מחלקת הטנקים של הצק\"מ בנחל 'סחף', בפיקוד מ\"מ השריון סגן יותם בבש ('טנק 2'), יצאה עם תחילת המתקפה לבלום את חדירת המחבלים בגדר. בשעה 06:33 פקד 'משנה דייגו' על 'טנק 2' לעלות לעמדה 106 ולהשמיד כל חמוש החוצה את ציר 'הוברס', ו'טנק 2' שלח את 'טנק 2ב' לעבר עמדה 91.\nהטנקים פגעו בעשרות מחבלים בגדר, אך בשעה 06:44 נפגע 'טנק 2' מרחפן-מטיל בעמדה 106 ונתקע כתוצאה מתקלה מכנית — צוותו נותר תקוע ומאוים בנ\"ט שעות ארוכות, עד שחולץ בסופו של דבר בידי 'טנק 3' לעבר צומת סעד.\nבשעה 06:56, תוך כדי הסתערות על חוליית מחבלים, נפגע 'טנק 2ב' מטיל נ\"ט קצר-טווח. המט\"ק סמ\"ר שי לוינסון נהרג במקום וגופתו נחטפה לעזה. התותחן סמל אריאל אליהו והטען סמל אופיר טסטה נפצעו אנושות. נהג הטנק, רב\"ט עידו סומך, נותר לבדו כשיר, ותחת פיקודו של הטען הפצוע ניתק הטנק מגע ונע דרומה, הרחק מהגבול, לאורך המרחב עד ציר 232 שבמרחב חורשת רעים ומסיבת 'הנובה'.\nבמהלך הנסיעה נפטר מפצעיו התותחן סמל אריאל אליהו. הטען סמל אופיר טסטה, בעודו פצוע, ירד מן הטנק והצטרף ללחימה במרחב המסיבה, מסר את נשקו למאבטח, ובניסיון לשוב אל הטנק נהרג מאש המחבלים. הנהג נלחם, דרס מחבלים, נמלט מלינץ' והסתתר עד שחולץ פצוע ומדמם. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "pgah-tanks-t0", time: "06:33", endTime: "06:36", title: "'טנק 2' עולה לעמדה 106; 'טנק 2ב' נע לעמדה 91" },
      { id: "pgah-tanks-t1", time: "06:42", endTime: "06:45", title: "הטנקים פוגעים בעשרות מחבלים בגדר; 'טנק 2' נתקע בע' 106 וצוותו שרד" },
      {
        id: "pgah-tanks-t2",
        time: "06:36",
        endTime: "08:06",
        title: "'טנק 2ב': עלייה לעמדה 91, פגיעת נ\"ט, ונסיעת הנהג לבדו עד מרחב הנובה",
        // נתיב 'טנק 2ב': תחילה עולה לעמדת הירי 91 (ע\"פ #6 — קודם לעמדה), נפגע
        // בנ\"ט, ואז הנהג מנתק מגע דרומה לאורך המרחב עד מסיבת 'הנובה' / חורשת
        // רעים (נ.צ. מאומת: 34.47168, 31.39777).
        path: [
          { time: "06:36", coordinates: [34.47050, 31.45150] }, // יוצא לעבר העמדה
          { time: "06:42", coordinates: [34.46680, 31.44980] }, // מגיע לעמדה 91
          { time: "06:56", coordinates: [34.46830, 31.44740] }, // נפגע, מנתק מגע
          { time: "07:20", coordinates: [34.47250, 31.43100] },
          { time: "07:45", coordinates: [34.47180, 31.41300] },
          { time: "08:06", coordinates: [34.47168, 31.39777] }, // מרחב הנובה / חורשת רעים
        ],
      },
      { id: "pgah-tanks-t3", time: "06:44", endTime: "06:50", title: "'טנק 2' נפגע מרחפן-מטיל בעמדה 106 ונתקע (הצוות חולץ מאוחר יותר לצומת סעד)" },
      { id: "pgah-tanks-t4", time: "06:56", endTime: "06:57", title: "'טנק 2ב' נפגע מנ\"ט; נפילת המט\"ק סמ\"ר שי לוינסון, פציעת הצוות" },
      { id: "pgah-tanks-t5", time: "08:06", endTime: "10:00", title: "נפילת התותחן והטען במרחב הנובה; הנהג נלחם וחולץ פצוע" },
    ],
    fallen: [
      { id: "pg-levinson", fullName: "שי לוינסון", rank: "סמ\"ר", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-levinson.jpg", hometown: "גבעת אבני", memorial: "מט\"ק טנק 2ב', גדוד 77 (שריון)", affiliation: "combat_team" },
      { id: "pg-eliyahu", fullName: "אריאל אליהו", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-eliyahu.jpg", hometown: "מצפה יריחו", memorial: "תותחן טנק 2ב', גדוד 77 (שריון)", affiliation: "combat_team" },
      { id: "pg-testa", fullName: "אופיר טסטה", rank: "סמל", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-testa.jpg", hometown: "ירושלים", memorial: "טען טנק 2ב', גדוד 77 (שריון)", affiliation: "combat_team" },
      { id: "pg-alatrash", fullName: "מחמד אלאטרש", rank: "רס\"מ", age: 39, hometown: "שבט אל-אטרש", memorial: "גשש, צק\"מ סחף — חטיבה צפונית (הושב מהשבי)", affiliation: "combat_team" },
    ],
  }),
  build({
    id: "pgah-camp",
    slug: "pgah-camp",
    title: "הגנת מחנה פגה",
    kind: "battle",
    date: "2023-10-07",
    time: "07:10",
    coordinates: [34.46954, 31.45121], // מרכז המוצב (מאומת)
    locationName: "מחנה פגה",
    unit: "פלוגה ג' 'דייגו', גדוד 13, חטיבת גולני",
    summary: "הקרב על עמדות המחנה וההתבצרות בחדר האוכל (הנאפ\"ל)",
    description: "עם הכרזת 'גשם סגול' בשעה 06:30 נכנסו הלוחמים במחנה 'פגה' לחדר האוכל המשמש כמרחב מוגן (נאפ\"ל). מפקד המחנה בפועל, המ\"מ סרן דקל סויסה, תפס פיקוד וחילק פקודות שתכליתן עיבוי עמדות ופתחים בקנים. בשעה 06:49 החל ירי ראשוני על חומות המחנה מכיוון גבעת סחיף ('פגה עליון') השולטת עליו.\nמשעה 07:00 החלה מתקפה רגלית ורכובה על המחנה מכיוון מתחם המרגמות, מתקן המודיעין וציר הגישה הדרום-מערבי. הלוחמים תפסו עמדות בפתח ה-7, בפתח הבונקר, בש\"ג הרגלי ובעמדות המפרם, בלמו גל אחר גל של מחבלים והרגו רבים מהם. בשעה 07:58, בעודו מנסה לירות טיל LAW על מחבלים בפילבוקס, נהרג הקלע סמל איתמר כהן מירי מדויק ומרימונים שהושלכו מתחת לעמדה.\nלאורך שעות ניהל הכוח לחימה משותפת עם 'נמ\"ר דייגו' שסבב את המחנה, השמיד מחבלים וחילץ פצועים. סביב השעה 10:35, במהלך קיפול העמדות אל הנאפ\"ל, נהרגו מפקד המחנה סרן דקל סויסה והלוחם סמל רועי פרי בלחימה בכניסה הראשית, לאחר שהצליחו להדוף את המחבלים ולחפות על נסיגת חבריהם.\nבין השעות 11:15–11:35 חדרו מחבלים למחנה, ניסו לכבוש את חדר האוכל, ומשנכשלו — הציתו אותו כדי להבריח את הלוחמים אל שטח השמדה. בעשן חונק ובחשכה, סביב השעה 13:00, הסתערו חמישה לוחמים החוצה אל מול עשרות מחבלים ונפלו בקרב: סמל ליאור עזיזוב, סמ\"ר עידן רז, סמ\"ר שלו ברנס, סמ\"ר איתי אופק גליסקו וסמ\"ר יקיר לוי. בגבורתם ובהגנתם העיקשת מנעו הלוחמים את נפילת המחנה. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "pgah-camp-t0", time: "06:30", endTime: "06:49", title: "הכרזת 'גשם סגול'; הלוחמים לנאפ\"ל, עיבוי עמדות בקנים" },
      { id: "pgah-camp-t1", time: "06:49", endTime: "07:10", title: "ירי ראשוני על חומות המחנה מגבעת סחיף" },
      { id: "pgah-camp-t2", time: "07:10", endTime: "07:58", title: "מתקפה על עמדות המחנה; פצועים ראשונים; לחימה בפתחים" },
      { id: "pgah-camp-t3", time: "07:58", endTime: "08:00", title: "נפילת הקלע סמל איתמר כהן בעמדת המפרם" },
      { id: "pgah-camp-t4", time: "08:00", endTime: "10:25", title: "לחימה משותפת עם 'נמ\"ר דייגו', חילוץ פצועים סביב המחנה" },
      { id: "pgah-camp-t5", time: "10:35", endTime: "10:40", title: "נפילת מפקד המחנה סרן דקל סויסה וסמל רועי פרי בכניסה" },
      { id: "pgah-camp-t6", time: "11:15", endTime: "11:35", title: "חדירת מחבלים והצתת חדר האוכל" },
      { id: "pgah-camp-t7", time: "13:00", endTime: "13:05", title: "הסתערות חמשת הלוחמים מחדר האוכל ונפילתם בקרב" },
    ],
    fallen: [
      { id: "pg-swissa", fullName: "דקל סויסה", rank: "סרן", age: 23, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-swissa.jpg", hometown: "מושב בר גיורא", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
      { id: "pg-cohen", fullName: "איתמר כהן", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-cohen.jpg", hometown: "כרמיאל", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
      { id: "pg-glisko", fullName: "איתי אופק גליסקו", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-glisko.jpg", hometown: "יקנעם עילית", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
      { id: "pg-barnes", fullName: "שלו ברנס", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-barnes.jpg", hometown: "כפר ברוך", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
      { id: "pg-levi", fullName: "יקיר לוי", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-levi.jpg", hometown: "מורשת", memorial: "מחלקת המרגמות, גדוד 13", affiliation: "battalion_13" },
      { id: "pg-raz", fullName: "עידן רז", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-raz.jpg", hometown: "עין המפרץ", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
      { id: "pg-peri", fullName: "רועי פרי", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-peri.jpg", hometown: "שוהם", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
      { id: "pg-azizov", fullName: "ליאור עזיזוב", rank: "סמל", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-azizov.jpg", hometown: "אשקלון", memorial: "פלוגה ג', גדוד 13", affiliation: "battalion_13" },
    ],
  }),
  build({
    id: "pgah-rescue",
    slug: "pgah-rescue",
    title: "חילוץ מחנה פגה",
    kind: "rescue",
    date: "2023-10-07",
    time: "16:20",
    coordinates: [34.46990, 31.45072], // ש"ג/כניסת המחנה בפאה הדרומית
    locationName: "מחנה פגה",
    unit: "כוח חילוץ — יחידת הלוט\"ר וקציני גולני; פלוגה ב', גדוד 13",
    summary: "טיהור המוצב וחילוץ הלוחמים; נפילת סמ\"ר דולב אמויאל",
    description: "לאורך היום ניסה 'משנה דייגו' להשיג סיוע וחילוץ לכוח הנצור במחנה 'פגה'. סביב השעה 15:00 הגיע מסוק קרב שירה על המחבלים הבודדים שנותרו במוצב, הרג את חלקם והבריח את היתר.\nבין השעות 16:20–16:50 הגיע כוח חילוץ בפיקוד רס\"ן מיכאל ביטן, יחד עם כוח מיחידת הלוט\"ר, שפרצו פנימה בחסות חיפוי של מסוק קרב וכטמ\"מ, טיהרו את המוצב ופינו את הפצועים וההרוגים. בעת הגעתם כבר לא היו מחבלים בתוך המחנה. הכוח חבר ללוחמים ששרדו בחדר האוכל ולאלה שהסתתרו בחמ\"ל ובמקרר.\nבסביבות השעה 18:00 יצאו רכבי 'פנתר' לחילוץ פצועים. הפנתר הראשון, שנשא חמישה לוחמי גדוד 13, נפגע מטיל 'קורנט' שנורה משג'אעייה כ-1.5 ק\"מ מהמוצב. סמ\"ר דולב אמויאל, לוחם פלוגה ב' שקפץ מביתו בבוקר כדי לחלץ את חבריו, נהרג מהפגיעה. בקרב על מחנה 'פגה' נפלו 14 לוחמים ומפקדים; כ-30 חיילים חולצו מהמחנה, רובם פצועים. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "pgah-rescue-t0", time: "15:00", endTime: "16:20", title: "מסוק קרב תוקף את המחבלים שנותרו במוצב" },
      { id: "pgah-rescue-t1", time: "16:20", endTime: "16:50", title: "כוח הלוט\"ר וקציני גולני מטהרים את המוצב ומפנים פצועים והרוגים" },
      { id: "pgah-rescue-t2", time: "18:00", endTime: "18:10", title: "פגיעת 'קורנט' ברכב החילוץ; נפילת סמ\"ר דולב אמויאל" },
    ],
    fallen: [
      { id: "pg-amoyal", fullName: "דולב אמויאל", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/pg-amoyal.jpg", hometown: "נתניה", memorial: "פלוגה ב', גדוד 13", affiliation: "battalion_13" },
    ],
  }),

  // ═══════════════════════════════════════════════════════════
  //  מחנה מעבר ארז — 7 באוקטובר 2023
  //  פלוגת פחת"ק 77/13 ('יוזם') מגדוד 13, בגזרת גדוד 77 (צפון העוטף).
  //  מרכז מאומת: מעבר ארז [34.5462261, 31.5577659] (סמוך למת"ק/מש"א ארז).
  //  ניתן לכוונון עדין בעורך המיקומים.
  // ═══════════════════════════════════════════════════════════
  build({
    id: "erez-camp",
    slug: "erez-camp",
    title: "הגנת מחנה מעבר ארז",
    kind: "battle",
    date: "2023-10-07",
    time: "06:30",
    coordinates: [34.5462261, 31.5577659], // מעבר ארז — לכוונון עדין
    locationName: "מחנה מעבר ארז",
    unit: "פלוגת פחת\"ק 77/13 ('יוזם'), גדוד 13",
    summary: "בלימת הפשיטה על מחנה מעבר ארז — קרב הבטונדות והמאבק במטבחון",
    description: "מחנה 'מעבר ארז', בצפון גזרת העוטף, היה מחנה רב-יחידתי שבו שהו כוח מנהלת התיאום והקישור (מת\"ק), לוחמי איסוף (בלון) ולוחמי פלוגת פחת\"ק 77/13 ('יוזם') מגדוד 13, ת\"פ גדוד 77. בשבת בבוקר, כשמ\"פ הפלוגה שהה בביתו, ניהל את הקרב מ\"מ מחלקת ה-5, סגן רותם ליטקה.\nבשעה 06:29 הוכרז 'גשם סגול' והלוחמים התכנסו במרחב המוגן (המטבחון). דיווחים על 'אירוע מורכב' בק.ד 27 שלחו את כוח 'כרמל א' לגדר, אך הכוח הוחזר במהירות משזוהתה פשיטה. עד השעה 07:04 פשטו עשרות מחבלים על המחנה. הכוח התפצל: כוח סגן רותם ליטקה יצא אל מרחב הבטונדות והמיגוניות שבחניית המחנה, וכוח סמל רועי וייזר יצא בעקבותיו.\nבמרחב הבטונדות התנהל הקרב הקטלני. תחת אש ורימונים נפצע הלוחם אריאל ארז, ובלחימה במיגונית נהרג הרס\"פ סמ\"ר דניאל דנינו לאחר שיצא מהדלת וחיפה על חבריו. סמל רועי וייזר, סמל מחלקת ה-8, נהרג מאש מטווח קצר בעודו מוביל את כוחו למגע. הלוחם אדיר טהר נפגע מפגיעת טיל כתף. לאורך שעות ניסו רותם ליטקה ולוחמיו לחלץ את אריאל ארז הפצוע ממבנה למבנה, עד שנהרג מאש מחבל בעת יציאת הכוח מהחדר.\nבמקביל התבצרו כעשרה לוחמים בפיקוד הלוחם עומרי סילנר במטבחון — המרחב המוגן היחיד — ולחמו בהגנה נחושה עד שעות אחר הצהריים, חסמו את הדלת ובלמו כל ניסיון חדירה, עד שחברו לכוח החילוץ (ס\"פ 2 ויחידת יהלו\"ם) בסביבות השעה 17:00, שטיהרו את המחנה ופינו את הפצועים וההרוגים. בקרב זה נפלו ארבעה מלוחמי הפלוגה. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "erez-camp-t0", time: "06:29", endTime: "06:32", title: "הכרזת 'גשם סגול' — הלוחמים למרחב המוגן (המטבחון)" },
      { id: "erez-camp-t1", time: "06:32", endTime: "06:40", title: "'אירוע מורכב' בק.ד 27 — כוח 'כרמל א' יוצא לגדר ומוחזר עם דיווח פשיטה" },
      { id: "erez-camp-t2", time: "06:41", endTime: "07:04", title: "חדירת מחבלים למעבר ארז; עשרות מחבלים על המחנה" },
      { id: "erez-camp-t3", time: "07:04", endTime: "07:10", title: "פשיטת כ-20 מחבלים על המחנה; פיצול הכוחות" },
      { id: "erez-camp-t4", time: "07:10", endTime: "07:30", title: "קרב הבטונדות/המיגוניות — נפילת הרס\"פ סמ\"ר דניאל דנינו, פציעת אריאל ארז ואדיר טהר" },
      { id: "erez-camp-t5", time: "07:30", endTime: "07:45", title: "נפילת סמל רועי וייזר מאש מטווח קצר" },
      { id: "erez-camp-t6", time: "07:45", endTime: "09:00", title: "ניסיונות חילוץ אריאל ארז הפצוע ממבנה למבנה; נפילתו בקרב" },
      { id: "erez-camp-t7", time: "09:00", endTime: "16:30", title: "התבצרות כעשרה לוחמים במטבחון בפיקוד עומרי סילנר — לחימת הגנה ממושכת" },
      { id: "erez-camp-t8", time: "16:30", endTime: "17:00", title: "חבירה לכוח החילוץ (ס\"פ 2 ויהלו\"ם), טיהור המחנה וחילוץ הפצועים וההרוגים" },
    ],
    fallen: [
      { id: "erez-danino", fullName: "דניאל משה דנינו", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/erez-danino.jpg", hometown: "חיפה", memorial: "פחת\"ק, גדוד 13", affiliation: "battalion_13" },
      { id: "erez-weiser", fullName: "רועי וייזר", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/erez-weiser.jpg", hometown: "אפרת", memorial: "פחת\"ק, גדוד 13", affiliation: "battalion_13" },
      { id: "erez-erez", fullName: "אריאל ארז", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/erez-erez.jpg", hometown: "מושב עמקה", memorial: "פחת\"ק, גדוד 13", affiliation: "battalion_13" },
      { id: "erez-tahar", fullName: "אדיר טהר", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/erez-tahar.jpg", hometown: "ירושלים", memorial: "פחת\"ק, גדוד 13", affiliation: "battalion_13" },
    ],
  }),

  // ═══════════════════════════════════════════════════════════
  //  מוצב נחל עוז — מוקדים משלימים (7 באוקטובר 2023)
  //  ש.ג, מיגונית פלוגה ב' וטנקי השריון — משלימים למוקדים שכבר קיימים
  //  (חמ"ל, בטונדות, צמ"ה, בלונאים, מיגונית התצפיתניות).
  //  קואורדינטות זמניות סמוך למרכז המחנה — לכוונון עדין בעורך המיקומים.
  // ═══════════════════════════════════════════════════════════
  build({
    id: "nz-shag",
    slug: "nz-shag",
    title: "קרב הש.ג",
    kind: "battle",
    date: "2023-10-07",
    time: "07:00",
    coordinates: [34.50120, 31.47905], // placeholder — שער המחנה
    locationName: "מוצב נחל עוז",
    unit: "פלוגה ב', גדוד 13, חטיבת גולני",
    summary: "הגנת שער המחנה (ש.ג) עד נפילת הלוחמים ופריצת המחבלים פנימה",
    description: "עם תחילת המתקפה עוּבּתה עמדת הש.ג של מחנה נחל עוז: לצד השומר הראשוני הוצבו שני לוחמים ומ\"כ מפלוגה ב'. הכוח ניהל חילופי אש כבדים מול מחבלים שתקפו את עמדת הש.ג ממספר כיוונים ובאמצעי לחימה מגוונים — נשק קל, רימונים ונ\"ט — כשלרשות המגִנים נשק אישי בלבד.\nסביב השעה 07:30 נפלו בעמדה סמ\"ר אדיר אישטו בוגלה, סמ\"ר דור לזימי וסמ\"ר אורי כרמי. נפילתם פתחה למחבלים את הכניסה דרך הש.ג ואפשרה להם לנוע בחופשיות בתוך המחנה. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "nz-shag-t0", time: "06:35", endTime: "07:00", title: "עיבוי עמדת הש.ג — שני לוחמים ומ\"כ מפלוגה ב'" },
      { id: "nz-shag-t1", time: "07:00", endTime: "07:30", title: "חילופי אש כבדים מול מחבלים ממספר כיוונים, בנשק אישי בלבד" },
      { id: "nz-shag-t2", time: "07:30", endTime: "07:35", title: "נפילת סמ\"ר בוגלה, סמ\"ר לזימי וסמ\"ר כרמי — הש.ג נפרץ" },
    ],
    fallen: [
      { id: "nz-karmi", fullName: "אורי כרמי", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-karmi.jpg", hometown: "ראשון לציון", memorial: "פלוגה ב', גדוד 13", affiliation: "battalion_13" },
      { id: "nz-lazimi", fullName: "דור לזימי", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-lazimi.jpg", hometown: "נוף הגליל", memorial: "פלוגה ב', גדוד 13", affiliation: "battalion_13" },
      { id: "nz-bugla", fullName: "אדיר אישטו בוגלה", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-bugla.jpg", hometown: "אריאל", memorial: "פלוגה ב', גדוד 13", affiliation: "battalion_13" },
    ],
  }),
  build({
    id: "nz-migunit-b",
    slug: "nz-migunit-b",
    title: "קרב מיגונית פלוגה ב'",
    kind: "battle",
    date: "2023-10-07",
    time: "06:35",
    coordinates: [34.50045, 31.47975], // placeholder — מיגונית פלוגה ב'
    locationName: "מוצב נחל עוז",
    unit: "פלוגה ב', גדוד 13, חטיבת גולני",
    summary: "לחימה מסביב למחנה ונפילת שני לוחמים במיגונית פלוגה ב'",
    description: "בשעה 06:35 יצאו המ\"מים סגן נמרוד אלירז וסרן יוחאי דוכן, יחד עם לוחמים מפלוגה ב', לחזק את העמדות מסביב למחנה. במרחב מיגונית פלוגה ב' לחמו כוחות לא-אורגניים — לוחמי הפלוגה, לוחם מחפ\"ק הסמג\"ד, כוח קטן מהלוט\"ר וכוח צלפים מסיירת צנחנים — אל מול המחבלים.\nהלוחם סמ\"ר דוד רתנר לחם במפנה המערבי של המחנה, רץ להזהיר את חיילי הפלס\"ם מפני פשיטה צפויה, תגבר את העמדה המזרחית, ובשובו נפגע אנוש מאש שנורתה ממספר כיוונים. גם סמ\"ר נאור סיבוני נפגע אנוש. שניהם טופלו במיגונית פלוגה ב' בידי החובשים, ומתו מפצעיהם סמוך לשעה 08:01. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "nz-migunit-b-t0", time: "06:35", endTime: "07:00", title: "יציאת המ\"מים והלוחמים לחיזוק העמדות סביב המחנה" },
      { id: "nz-migunit-b-t1", time: "07:00", endTime: "08:00", title: "לחימה עיקשת במפנה המערבי והמזרחי; רתנר וסיבוני נפגעים אנוש" },
      { id: "nz-migunit-b-t2", time: "08:01", endTime: "08:05", title: "סמ\"ר דוד רתנר וסמ\"ר נאור סיבוני מתו מפצעיהם במיגונית" },
    ],
    fallen: [
      { id: "nz-ratner", fullName: "דוד רתנר", rank: "סמ\"ר", age: 20, hometown: "אשדוד", memorial: "פלוגה ב', גדוד 13", affiliation: "battalion_13" },
      { id: "nz-siboni", fullName: "נאור סיבוני", rank: "סמ\"ר", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-siboni.jpg", hometown: "גילת", memorial: "פלוגה ב', גדוד 13", affiliation: "battalion_13" },
    ],
  }),
  build({
    id: "nz-tanks",
    slug: "nz-tanks",
    title: "קרב טנקי השריון",
    kind: "battle",
    date: "2023-10-07",
    time: "06:30",
    coordinates: [34.49950, 31.47930], // placeholder — מרחב הטנקים, מערב המחנה
    locationName: "מוצב נחל עוז",
    unit: "פלוגת טנקים, גדוד 77 (שריון) — כוננות במחנה נחל עוז",
    summary: "שני צוותי טנקים מגדוד 77 בלמו את החדירה בתוך המחנה וממערב לו",
    description: "במחנה נחל עוז שהו בכוננות שני טנקים מגדוד 77 (שריון): טנק ד' ('משנה חשאי', בפיקוד סגן עידו פאר) וטנק ג'1 (המלא\"ר, בפיקוד המ\"מ סרן דניאל פרץ). בשעה 06:30 פקד סמג\"ד 13 ('משנה נשרים') על הטנקים לעלות לעמדות ולהשמיד את המחבלים החודרים.\nהטנקים לחמו שעות במרחב הגדר, בעמדות ובתוך המחנה, פגעו במחבלים רבים ובלמו את החדירה. בשעה 08:53 נפגע טנק ד' משני טילי נ\"ט בתוך המחנה, סמוך למיגונית הפלס\"ם — התותחן סמל אור אביטל נהרג מהפגיעה, והמט\"ק-טען סמ\"ר יונתן גולן נהרג בעת ריצת הצוות למיגונית. חיילי הפלס\"ם מנעו את חטיפת הגופות עד להגעת כוח החילוץ.\nבשעה 09:01, ממערב למחנה, נפגע טנק ג'1 מטיל נ\"ט. המ\"מ סרן דניאל שמעון פרץ והתותחן סמ\"ר איתי חן נהרגו וגופותיהם נחטפו לעזה (הושבו לימים לישראל), הטען סמל תומר ליבוביץ נהרג, והנהג סמל מתן אנגרסט נחטף חי ופצוע. יהי זכרם ברוך.",
    media: [],
    timeline: [
      { id: "nz-tanks-t0", time: "06:30", endTime: "06:45", title: "פקודת משנה נשרים לטנקים: לעלות לעמדות ולהשמיד את המחבלים" },
      { id: "nz-tanks-t1", time: "06:45", endTime: "08:50", title: "הטנקים לוחמים בגדר, בעמדות ובתוך המחנה ובולמים את החדירה" },
      { id: "nz-tanks-t2", time: "08:53", endTime: "08:56", title: "טנק ד' נפגע משני נ\"ט במחנה — נפילת סמל אור אביטל וסמ\"ר יונתן גולן" },
      { id: "nz-tanks-t3", time: "09:01", endTime: "09:05", title: "טנק ג'1 נפגע מנ\"ט ממערב למחנה — נפילת סרן דניאל פרץ, סמ\"ר איתי חן וסמל תומר ליבוביץ" },
    ],
    fallen: [
      { id: "nz-golan", fullName: "יונתן גולן", rank: "סמ\"ר", age: 21, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-golan.jpg", hometown: "נווה מונוסון", memorial: "מט\"ק טנק ד', גדוד 77 (שריון)", affiliation: "combat_team" },
      { id: "nz-avital", fullName: "אור אביטל", rank: "סמל", age: 20, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-avital.jpg", hometown: "מרום גולן", memorial: "תותחן טנק ד', גדוד 77 (שריון)", affiliation: "combat_team" },
      { id: "nz-peretz", fullName: "דניאל שמעון פרץ", rank: "סרן", age: 22, hometown: "יד בנימין", memorial: "מ\"מ מלא\"ר (טנק ג'1), גדוד 77 (שריון) — הושב מהשבי", affiliation: "combat_team" },
      { id: "nz-chen", fullName: "איתי חן", rank: "סמ\"ר", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-chen.jpg", hometown: "נתניה", memorial: "תותחן טנק ג'1, גדוד 77 (שריון) — הושב מהשבי", affiliation: "combat_team" },
      { id: "nz-leibovitz", fullName: "תומר ליבוביץ", rank: "סמל", age: 19, photo: "https://szejkimsbjvdamittwlf.supabase.co/storage/v1/object/public/battle-media/fallen/nz-leibovitz.jpg", hometown: "תל אביב", memorial: "טען טנק ג'1, גדוד 77 (שריון)", affiliation: "combat_team" },
    ],
  }),
];

export function getBattleBySlug(slug: string) {
  return BATTLES.find((b) => b.slug === slug);
}

export function allFallen() {
  return BATTLES.flatMap((b) =>
    b.fallen.map((s) => ({ ...s, battle: b.title, battleSlug: b.slug })),
  );
}
