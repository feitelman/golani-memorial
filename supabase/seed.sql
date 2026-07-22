-- ════════════════════════════════════════════════════════
--  Example seed — illustrative content only.
--  Locations are real points in the Gaza Envelope; narratives
--  and soldier names are placeholders to be replaced with
--  verified material via the admin dashboard.
-- ════════════════════════════════════════════════════════

insert into battles (id, slug, title, kind, time, lng, lat, location_name, unit, summary, description) values
('kissufim-base','kissufim-base','ההגנה על בסיס כיסופים','battle','06:29',34.4021,31.3672,'בסיס כיסופים','גדוד 13 — מסגרת מ"פ','ההגנה הראשונית על שער הבסיס מול חדירת מחבלים','עם פתיחת מטח הרקטות ב-06:29 הופעלה אזעקה בבסיס כיסופים. תוך דקות זוהו עשרות מחבלים חמושים שניסו לפרוץ את שער הבסיס. כוח כוננות של הגדוד תפס עמדות ופתח באש לבלימת ההסתערות.'),
('ein-hashlosha','ein-hashlosha','הקרב על עין השלושה','battle','07:40',34.3922,31.3452,'קיבוץ עין השלושה','גדוד 13 — פלוגה א׳','סריקות והיתקלויות בין בתי הקיבוץ','כוח מהגדוד הגיע לעין השלושה לאחר דיווחים על מחבלים בקיבוץ. הלחימה התנהלה מבנה אחר מבנה תוך תיאום עם כיתת הכוננות.'),
('nirim','nirim','חילוץ תושבים בנירים','rescue','08:30',34.3945,31.3373,'קיבוץ נירים','גדוד 13 — צוות חילוץ','פינוי משפחות תחת אש','צוות חילוץ פעל לפינוי משפחות מהממ״דים בנירים, אסף תושבים והובילם לנקודת כינוס מוגנת.')
on conflict (slug) do nothing;

insert into timeline_events (battle_id, time, title, detail) values
('kissufim-base','06:29','פתיחת מטח רקטות','אזעקות ברחבי העוטף'),
('kissufim-base','06:45','מגע ראשון בשער',null),
('kissufim-base','07:55','הגעת תגבורת ראשונה',null),
('ein-hashlosha','07:40','הגעה לשער הקיבוץ',null),
('ein-hashlosha','09:30','חבירה לכיתת כוננות',null),
('nirim','08:30','תחילת מבצע החילוץ',null),
('nirim','14:00','סיום פינוי הגזרה',null);

insert into soldiers (battle_id, full_name, rank, age, hometown, memorial) values
('kissufim-base','פלוני א׳','סמל',20,'צפון הארץ','שם לדוגמה — יוחלף בנתונים מאומתים.'),
('ein-hashlosha','פלוני ג׳','רב״ט',19,'השפלה','שם לדוגמה — יוחלף בנתונים מאומתים.');
