# Question review — ages 8–12 (Hebrew bank), 2026-11-27

EDITORIAL REVIEW — Hebrew bank, ages 8–12 (file: /private/tmp/claude-501/-Users-ronbacher-Desktop-Phraser--claude-worktrees-game-standalone-app-266648/06d56424-f07b-4b43-a756-fd0d35056f5b/scratchpad/review-he-b.txt). Read in full (all 1305 lines); nothing was edited.

## OVERALL VERDICT

The bank is factually clean: I found no keyed answer that is flatly wrong against the Tanakh, only a handful of imprecisions (findings 1–6). The weakness is difficulty and voice, not accuracy.

- **Too easy for 8–12, and the curve is inverted.** Roughly two thirds of the cards are pure picture-reading ("what is on his shoulders", "what is he about to do") with absurd distractors. The Samson scenes at ranks 6.5–8 are easier than the `age/b/*` and `connection/*` cards at ranks 2–4. A 10–12-year-old who has studied Genesis–Judges will find the last maps trivial.
- **Answers leak inside a scene.** The opener prompt, or a neighbouring card, often states the answer to a later card word for word (findings 8–16).
- **Explanations read like art-direction notes.** Many WHY lines are translated-sounding and above the age ("המחווה מפנה את המבט", "מחלקים את הידע בין הדמויות", "המוקד כאן הוא") and do not teach the story. The `age/b/*` WHY lines, which paraphrase the verse and cite it, are the right model.

## FINDINGS (most serious first)

**1. life-noah-7/0, and the same label as a distractor in life-noah-1/0, 2/0, 3/0, 8/0, 4/0, 5/0 — cat. 2.** "המים מתחילים לרדת" reads naturally as "the rain starts falling". In life-noah-3/0 (המבול: "גשם מכסה את הארץ במים") a child can defend it as the correct answer.
- Replace the label everywhere with: «מי המבול מתמעטים»
- Prompt for 7/0: «הגשם פסק ורוח עוברת על הארץ. מה קורה עכשיו למי המבול?»

**2. life-moses-1/2 — cat. 1/2.** "מה עושה בת פרעה… ✔ מושיטה יד אל התיבה" follows the midrash. The plain text of Ex 2:5 is "ותשלח את אמתה ותקחה", which state schools teach as "she sent her maidservant" (Rashi gives both). I cannot see the picture; if it shows her own hand, keep the option but fix the WHY:
- «בתורה כתוב "ותשלח את אמתה ותקחה". לפי הפשט שלחה את שפחתה, ולפי המדרש הושיטה את ידה. (שמות ב׳, ה׳)»
- Safer prompt: «התיבה עדיין סגורה. מה רואים באיור רגע לפני שפותחים אותה?»

**3. life-samson-7/1, 7/2, 7/3, 7/4 — cat. 1/6.** Four near-identical cards about the physical state of the rope at rank 7, with no biblical content. The wording ("אחרי הקריעה", "נשארו לולאות על זרועות שמשון") also does not match Judges 15:14, where the ropes became "כפשתים אשר בערו באש וימסו אסוריו מעל ידיו". Tearing ropes belongs to the Delilah story (16:9, 16:12). Keep one picture card and replace the others:
- «מי קשר את שמשון ומסר אותו לפלשתים?» ✔ «אנשי שבט יהודה» ✘ «אחיו משבט דן» ✘ «שומרי העיר עזה». WHY: «שלושת אלפים איש מיהודה קשרו את שמשון בשני עבותים חדשים. (שופטים ט״ו, י״א–י״ג)»
- «למה דומים החבלים שעל זרועות שמשון כשרוח ה׳ באה עליו?» ✔ «לפשתן שנשרף באש» ✘ «לשרשרות ברזל» ✘ «לענפי גפן ירוקים». WHY: «העבותים נעשו "כפשתים אשר בערו באש" ונשרו מעל ידיו. (שופטים ט״ו, י״ד)»

**4. connection/joseph-grain — cat. 1/6.** "✔ לפתוח את המחסנים ולתת אוכל": Gen 41:56 says "וישבר למצרים", so he sold it. It is also trivial for rank 8 and repeats finale/0.
- Option: «לפתוח את המחסנים ולמכור תבואה»
- WHY: «כשהתחיל הרעב פתח יוסף את המחסנים ומכר תבואה למצרים. (בראשית מ״א, נ״ו)»
- Move to rank 3–4.

**5. age/b/bricks-shinar — cat. 1/3.** "חיפשו מקום שטוח" is not in the text (Gen 11:2: "וימצאו בקעה בארץ שנער"), and "שטוח" gives away "בקעה".
- Prompt: «בני האדם נסעו מקדם והגיעו לארץ שנער. איפה התיישבו והתחילו לבנות?»

**6. age/b/gideon-drink — cat. 1 (minor) / 4.** The WHY says "מן הקבוצה שליקקה… נבחרו שלוש מאות", but all the lappers were the 300 (Judges 7:6–7). The prompt "על איזה הבדל הסתכל?" is clumsy.
- Prompt: «גדעון הוריד את אנשיו אל המים. לפי מה נבחרו הלוחמים שנשארו איתו?» ✔ «לפי הדרך שבה שתו»
- WHY: «שלוש מאות האנשים שליקקו את המים מכף ידם הם שנשארו עם גדעון. (שופטים ז׳, ד׳–ז׳)»

**7. life-noah-1/3, 2/0, 2/1, 3/1, 6/2 — cat. 4.** "כבש" (ramp) is a rare word and an unvocalised homograph of "כבש" (sheep). life-noah-2/1 reads "מי עולה בכבש ממש לפני הכבשים?", which a child will read as "in the sheep… before the sheep".
- Use «רמפה» or «מעלה העץ», or at least vocalise «כֶּבֶשׁ».
- 2/1: «מי עולה ברמפה ממש לפני הכבשים?»
- 1/3 option: «יעלו ברמפה המשופעת»

**8. life-samson-7/0 — cat. 3 (rank 7).** The prompt "קשורות בחבלים בלחי" contains the answer "חבלי שמשון בלחי" word for word.
- «אנשי יהודה קשרו את שמשון בשני עבותים חדשים ומסרו אותו לפלשתים. איזה סיפור מתחיל כאן?»

**9. life-samson-2/0 — cat. 3/4 (rank 6.5).** "חידה" appears twice in the prompt and only "חידת שמשון" matches. "סיפר על חידה" is also not Hebrew.
- «במשתה החתונה שמשון מאתגר את האורחים: "מעז יצא מתוק". איזה סיפור זה?»

**10. life-moses-3/0 (rank 4), life-moses-5/0 (rank 6), life-moses-9/0 (rank 5), gen-abram/0 (rank 1), life-moses-6/0 (rank 3) — cat. 3.** Each opener prompt repeats the answer label.
- 3/0 ("יצאו ממצרים" → "יציאת מצרים"): «משפחות עוזבות את בתיהן בחיפזון, והבצק עוד לא הספיק לתפוח. איזה אירוע מתחיל?»
- 5/0: «מנהיג זקן מניח את ידיו על ראש ממשיכו לעיני כל העם. איזה אירוע מצויר כאן?»
- 9/0: change "איזה מעמד זה?" to «איזה אירוע זה?»
- gen-abram/0: «משפחה עוזבת את חרן עם כל רכושה והולכת אל ארץ שאלוהים הבטיח. איזה סיפור מתחיל?»
- 6/0: «זר עוזר לשבע אחיות להשקות את הצאן אחרי שהרועים גירשו אותן. איזה מפגש מצויר כאן?»

**11. life-samson-5/4 — cat. 3/5 (rank 8).** The answer "כוח פעם נוספת" is verbatim in the scene's opener ("מבקש מאלוהים כוח פעם נוספת"). The prompt and answer do not fit grammatically, and the WHY never says what he prayed.
- Opener: «שמשון עומד בין שני עמודים בבית מלא פלשתים ופונה אל אלוהים. איזה רגע זה?»
- Card: «מה ביקש שמשון מאלוהים בתפילתו האחרונה?» ✔ «שיחזק אותו רק עוד פעם אחת» ✘ «שיחזיר לו את שערו הארוך» ✘ «שיפתח לו את שערי בית האסורים»
- WHY: «שמשון התפלל: "זכרני נא וחזקני נא אך הפעם הזה". (שופטים ט״ז, כ״ח)»

**12. life-moses-5/2 — cat. 3/6 (rank 6).** "מי מניח עליו ידיים? ✔ משה" is stated in the opener ("משה מניח ידיים על יהושע").
- «לפני מי העמיד משה את יהושע כשמינה אותו?» ✔ «לפני אלעזר הכוהן וכל העדה» ✘ «לפני אהרן הכוהן» ✘ «לפני זקני מדיין»
- WHY: «אהרן כבר מת, ובנו אלעזר היה הכוהן. משה העמיד את יהושע לפניו ולפני כל העדה וסמך עליו את ידיו. (במדבר כ״ז, י״ח–כ״ג)»

**13. life-samson-9/3 and life-samson-9/2 — cat. 3/6 (rank 8).**
- 9/3 "✔ כדי לטחון את הגרגירים" is verbatim in the opener ("שמשון טוחן גרגירים"). Replace: «מי כלא את שמשון והכריח אותו לטחון?» ✔ «הפלשתים» ✘ «אנשי יהודה» ✘ «המצרים». WHY: «הפלשתים הורידו את שמשון לעזה, "ויהי טוחן בבית האסורים". (שופטים ט״ז, כ״א)»
- 9/2 restates its own prompt ("הזמן שעבר" → "עבר זמן"). Replace: «שערו של שמשון התחיל לצמוח שוב. למה זה פרט חשוב בסיפור?» ✔ «זה רמז שכוחו עשוי לחזור» ✘ «זה סימן שהוא משתחרר מחר» ✘ «זה מראה שדלילה התחרטה». This reading is interpretive but standard for 16:22.

**14. life-samson-4/4, 4/1, 4/3 — cat. 6 (rank 8).** The Delilah scene has no content question. "ישן" is given by the opener hint ("האיש הישן") and by 4/2 ("עיניו עצומות").
- Replace 4/4: «מה גילה שמשון לדלילה בסוף על סוד כוחו?» ✔ «שהוא נזיר ושערו לא נגזר מעולם» ✘ «שכוחו בא מהדבש שאכל» ✘ «שכוחו בא מהחבלים החדשים». WHY: «שמשון אמר: "מורה לא עלה על ראשי כי נזיר אלוהים אני". (שופטים ט״ז, י״ז)»
- Replace 4/1: «כמה פעמים הטעה שמשון את דלילה לפני שגילה את האמת?» ✔ «שלוש» ✘ «פעם אחת» ✘ «שבע». (שופטים ט״ז, ו׳–ט״ו)

**15. life-samson-8/2, 8/3, 8/4 — cat. 6 (rank 7).** "מה הוא מתכונן לעשות? ✔ לשתות" and "מרים מים אל פיו" need no thought, and 8/4 repeats 8/1.
- Replace 8/3: «למה נקרא המעיין "עין הקורא"?» ✔ «כי שמשון קרא שם אל אלוהים» ✘ «כי ציפור קוראת גרה לידו» ✘ «כי רועים קראו שם לצאן»
- Replace 8/4: «מי פתח לשמשון את מקור המים בלחי?» ✔ «אלוהים, אחרי ששמשון קרא אליו» ✘ «אנשי יהודה שחפרו באר» ✘ «נער שהביא כד». WHY: «"ויבקע אלוהים את המכתש אשר בלחי ויצאו ממנו מים". (שופטים ט״ו, י״ח–י״ט)»

**16. Give-away chains inside a scene — cat. 3.**
- gen-abram/3 ↔ gen-abram/4 (rank 1): 3's prompt ("אלוהים הראה לאברם כוכבים רבים") is 4's answer. Replace 4: «אברם הגיע לכנען ובנה שם מזבח. מה הבטיח לו אלוהים על הארץ הזאת?» ✔ «שייתן אותה לצאצאיו» ✘ «שיבנה בה מגדל» ✘ «שיחזור ממנה לחרן». (בראשית י״ב, ז׳)
- life-moses-1/1, 1/3, 1/4 (rank 3): the opener says "בין הקנים", 1/1 says "אחותו… מציצה", and 1/4 asks who watches from the reeds. Replace 1/4: «מה ראתה בת פרעה כשפתחה את התיבה?» ✔ «תינוק בוכה» ✘ «תינוק ישן» ✘ «תיבה ריקה». (שמות ב׳, ו׳)
- life-samson-1/1 ↔ 1/2 (rank 6.5): "לפני שמנוח מצטרף" gives both "אשת מנוח" and "מנוח, בעלה". 1/1: «למי התגלה המלאך בפעם הראשונה?» with distractors «למנוח לבדו» / «לשניהם יחד».
- life-moses-2/4 (rank 3): "הם נשארים שלמים" is verbatim in the opener. Opener: «רועה במדבר רואה שיח שעולה ממנו אש. איזה סיפור זה?»
- life-samson-2/1 and 2/2 (rank 6.5): the opener already says "האריה" and "מצא דבש".
- life-samson-5/2 ↔ 5/3 (rank 8): 5/2 says "הנער מוביל את שמשון אל העמוד", which is 5/3's answer.
- life-samson-3/1, 3/2, 3/4 (rank 7): the same answer ("הדלתות על כתפיו") three times. Replace 3/4: «לאן נשא שמשון את דלתות השער?» ✔ «אל ראש ההר שמול חברון» ✘ «אל חוף הים של עזה» ✘ «אל בית אביו בצרעה». (שופטים ט״ז, ג׳)

**17. connection/jordan-memory — cat. 3/6 (rank 8).** The prompt says "אחרי חציית הירדן" and the distractors are absurd ("נח אסף אבנים לתיבה").
- «איפה הקים יהושע את שתים עשרה האבנים שנלקחו מן הירדן?» ✔ «בגלגל» ✘ «ביריחו» ✘ «בשילה»
- WHY: «יהושע הקים את האבנים בגלגל, כדי שהילדים ישאלו "מה האבנים האלה?" וישמעו על מעבר הירדן. (יהושע ד׳, כ׳–כ״ב)»

**18. age/b/rain-dove-waits — cat. 3 (rank 2).** Circular: "בלי לנחות" → "לא מצאה מקום לנחות".
- Prompt: «נח שלח את היונה בפעם הראשונה, והיא חזרה מהר אל התיבה. למה?»

**19. connection/midwives-baby — cat. 3/5 (rank 3).** This is a vocabulary question (מיילדות → לידה). The WHY's "לפני סיפור התיבה" will be read as Noah's ark.
- «פרעה ציווה על שפרה ופועה לפגוע בבנים שנולדו. מה עשו המיילדות?» ✔ «השאירו את הילדים בחיים» ✘ «ברחו ממצרים» ✘ «הסתירו את הילדים בארמון»
- WHY: «המיילדות יראו את אלוהים ולא עשו כדבר פרעה. זה קרה עוד לפני שמשה נולד. (שמות א׳, ט״ו–י״ז)»

**20. connection/bezalel-wood — cat. 3 (rank 3).** Only the correct option repeats "עץ" from the prompt.
- «בצלאל ידע לעבוד בזהב, באבן ובעץ. מה בנה למשכן מעצי שיטים?» ✔ «את ארון הברית» ✘ «את לוחות הברית» ✘ «את בגדי הכוהן». (שמות ל״ז, א׳)

**21. age/b/bethel-on-map — cat. 5.** The WHY explains "באר שבע" and "חרן", which are not among the options (בבל, יריחו).
- Restore them as distractors (appropriate for this age), or cut the WHY to: «יעקב קרא למקום בית אל כשקם משנתו. (בראשית כ״ח, י״ט)»

**22. life-noah-5/1 — cat. 5/4.** The WHY is incomprehensible and does not explain the answer: "המים והעננים מתאימים לאות של הבטחה הנוגעת למבול הרסני…".
- «אחרי הגשם מופיעה בענן קשת צבעונית. היא האות להבטחה שלא יהיה עוד מבול על הארץ. (בראשית ט׳, י״ג–ט״ו)»

**23. gen-babel/3 and gen-babel/2 — cat. 4 (rank 0).** The WHY vocabulary is far above an 8-year-old ("פוגע בתקשורת הדרושה למיזם המשותף", "הכתוב פותח בתיאור").
- 3: «אלוהים בלבל את שפתם, והבונים כבר לא הבינו זה את זה. כשלא מבינים, קשה לבנות יחד. (בראשית י״א, ז׳)»
- 2: «הסיפור מתחיל במילים "ויהי כל הארץ שפה אחת". (בראשית י״א, א׳)»

**24. life-samson-4/2 — cat. 4/5.** "מחמיץ את הסימן" is translationese, and the WHY ("מחלקים את הידע בין הדמויות") is designer-speak.
- Prompt: «למה שמשון לא רואה את הסימן שדלילה נותנת לאיש שבפתח?»
- WHY: «דלילה יישנה את שמשון על ברכיה ורק אז קראה לאיש. שמשון ישן ולא ראה דבר. (שופטים ט״ז, י״ט)»

**25. WHY lines that describe the picture's composition instead of the story — cat. 5.**
- life-noah-8/3: «התיבה נחה על ההר, אבל הארץ עוד לא יבשה. נח ומשפחתו חיכו בתיבה עד שאלוהים אמר להם לצאת. (בראשית ח׳, ט״ו–ט״ז)»
- life-moses-2/2: «אלוהים אמר למשה: "של נעליך מעל רגליך", כי המקום שהוא עומד עליו קדוש. (שמות ג׳, ה׳)»
- life-moses-5/3: «משה מינה את יהושע לעיני כל העדה, כדי שכולם ידעו וישמעו בקולו. (במדבר כ״ז, י״ט–כ׳)»
- life-noah-5/3: «הברית נכרתה עם נח ובניו וגם עם "כל נפש החיה" שיצאה מן התיבה. (בראשית ט׳, ט׳–י׳)»
- life-samson-2/4: «פתרון החידה: "מה מתוק מדבש ומה עז מארי". הדבש הוא המתוק והאריה הוא העז. (שופטים י״ד, י״ח)»
- life-samson-1/3: «המלאך עלה בלהב המזבח השמיימה, "אז ידע מנוח כי מלאך ה׳ הוא". (שופטים י״ג, כ׳–כ״א)»
- life-samson-1/4: «מנוח ואשתו ראו זאת "ויפלו על פניהם ארצה". (שופטים י״ג, כ׳)»
- life-moses-8/4: «כל משפחה אספה עומר אחד לכל אדם שבאוהל. (שמות ט״ז, ט״ז)»
- connection/joshua-sandal: «גם למשה ליד הסנה וגם ליהושע ליד יריחו נאמר שהמקום שהם עומדים עליו קדוש. (שמות ג׳, ה׳; יהושע ה׳, ט״ו)»
- life-samson-5/1: «שמשון כבר לא ראה, ולכן ביקש מהנער: "והמישני את העמודים". (שופטים ט״ז, כ״ו)»
- life-noah-2/3: «לזברה יש פסים שחורים ולבנים, וכך קל לזהות אותה בין החיות.»
- life-noah-7/2: delete the second sentence ("כדי למדוד שינוי צריך להשוות בין זמנים").
- gen-abram/2: «עם אברם יצאו שרי אשתו, לוט בן אחיו וכל אנשי ביתם. (בראשית י״ב, ה׳)»
- life-noah-4/1: «מסביב לתיבה עוד יש מים. רק ציפור יכולה לעוף מעליהם ולבדוק אם יש כבר יבשה.»

**26. Orphan citations — cat. 5.** Several WHY lines cite a verse the explanation never mentions (it belongs to the host picture), which will confuse a child who looks it up. Add a linking sentence or drop the citation.
- connection/deborah-barak (במדבר כ״ז), connection/jordan-memory and age/b/lasting-sign (בראשית ט׳), age/b/rahab-family (בראשית ז׳, ז׳), age/b/jordan-priests (שמות י״ד, כ״ב), age/b/gideon-drink (שופטים ט״ו), age/b/shepherd-leader (שמות ג׳, א׳), connection/hagar-water (שופטים ט״ו), connection/sarah-message (שופטים י״ג).
- age/b/cloud-camp: the natural parallel is שמות מ׳, ל״ו–ל״ז, not שמות י״ט, ט״ז.

**27. age/b/joseph-keeping-dream — cat. 2/4.** The subject of "מה עשה אחר כך?" is ambiguous (Jacob or Joseph).
- «יוסף סיפר את חלומו השני, ויעקב אביו גער בו. מה עשה יעקב אחר כך?» ✔ «שמר את הדבר בלבו»

**28. age/b/midian-witness — cat. 4.** "לחזור בזמן" means "on time", but the point of Ex 2:18 is that they came back early.
- «בנות כוהן מדיין חזרו מן הבאר מוקדם מהרגיל. מה עשה משה שעזר להן לסיים מהר?»

**29. "נוסע" for a traveller on foot — cat. 4.** gen-jacob/0 prompt and hint, and the life-samson-6/0 and life-samson-8/0 hints. In modern Hebrew "נוסע" is a passenger.
- gen-jacob/0: «איש בדרך ישן ליד אבן וחולם על סולם שראשו בשמיים. איזה סיפור זה?»
- Hints: «ההולך בדרך» / «האיש שעל השביל».
- Same family: life-moses-7/0 hint "מי מחזיק בכוח לסרב" → «מי מבקש, ומי יכול לסרב?»; life-samson-6/4 "דרכיהם נפגשות" → «הרגע שבו שמשון פוגש את האריה»; life-moses-8/1 WHY "מציע ש…" → «מראה ש…».

**30. life-samson-6/4 — cat. 6 (rank 6.5).** A vacuous "which moment" card. Replace:
- «מה היה בידו של שמשון כשגבר על האריה?» ✔ «שום דבר» ✘ «חרב» ✘ «מקל רועים»
- WHY: «"ומאומה אין בידו". שמשון גבר על האריה בידיים ריקות. (שופטים י״ד, ו׳)»

**31. life-moses-9/3 and 9/1 — cat. 4/6 (rank 5).** 9/3 is convoluted ("למה… יכולים לראות למה הוא מתכוון") and has no content. In 9/1 the distractors are not parts of the mountain.
- Replace 9/3: «העם ראה ברקים וענן כבד על ההר. איזה קול נשמע שם חזק מאוד?» ✔ «קול שופר» ✘ «קול תופים» ✘ «קול מים זורמים». (שמות י״ט, ט״ז)
- 9/1 distractors: «מרגלות ההר» / «אמצע המדרון».

**32. life-noah-2/2 — cat. 4/3.** The distractors use "אותן/להן" with no antecedent; only the correct option names "החיות".
- «כדי לשלוח את החיות ליער» / «כדי להראות לחיות את הירח».

**33. life-noah-9/2 and 9/3 — cat. 4/5.** Unvocalised "פניה" reads as "פנייה". "בהרים המשפחה נשארה" is unclear, and both WHY lines are designer-speak ("מייצגת את היציאה").
- 9/2 options: ✔ «המשפחה מביטה אל היבשה והפתח מאחוריה» ✘ «המשפחה מביטה אל הדלת הפתוחה»
- 9/3 prompt: «כשהתיבה נחה על ההר, המשפחה נשארה בפנים. מה היא יכולה לעשות עכשיו?»
- 9/3 WHY: «הארץ יבשה, ואלוהים אמר לנח לצאת מן התיבה עם משפחתו ועם החיות. (בראשית ח׳, י״ד–י״ט)»

**34. life-noah-7/4 — cat. 4.** Land does not "התבהר", so both distractors are malformed.
- «יש שמש, אבל התיבה עדיין מוקפת מים. מה קרה קודם?» ✔ «השמיים התבהרו» ✘ «האדמה התייבשה» ✘ «שניהם קרו באותו רגע»

**35. gen-abram/1 — cat. 2 (minor).** The distractor "את כל בני משפחתו" is partly true ("ומבית אביך", Gen 12:1).
- Replace it with «את שרי אשתו», and the keyed option with «את ארצו ואת בית אביו».

**36. connection/hagar-water — cat. 4 (minor).** The options lack the preposition the question requires ("במה…"), and the Torah's word is "חמת".
- ✔ «בנאד מים» ✘ «בסל פתוח» ✘ «בכף עץ»
- WHY: «…מילאה את החֵמֶת, כלומר נאד מעור, והשקתה את הילד.»

**37. Small wording fixes — cat. 4.**
- life-samson-2/2: "חתיכת דבש" → «חלת דבש».
- life-moses-7/2: "הכס" → «כיסא המלך».
- life-noah-1/1: "החלל שבתוך התיבה" (reads as outer space) → «את פנים התיבה».
- age/b/ark-pairs: "למה פתח נח את התיבה גם לחיות?" → «למה הכניס נח לתיבה גם חיות?»
- age/b/jordan-priests WHY: "על היבשה בתוך הירדן" → «על קרקע יבשה באמצע הירדן».
- Spelling: "גרגירים" (life-noah-6) vs "גרגרים" (life-moses-8); pick one.
- gen-joseph/0 hint: unvocalised "מראות" reads as mirrors → «שני חלומות».

**38. Rank outliers — cat. 6.**
- finale/3 (חומת יריחו, rank 8) and gen-jacob/3 ("מתי הוא רואה את הסולם? בחלום", rank 2.5, in a scene titled "חלום יעקב") are known to any second-grader.
- age/b/joseph-stores-by-town (rank 3) and age/b/joseph-keeping-dream (rank 3) are harder than everything in the Samson scenes at ranks 7–8.
- Suggest moving the `age/b` and `connection` text cards up, and pushing the pure picture cards down or replacing them as above.

**39. Typed-answer mode — a risk I cannot judge from the text.** Several opener ANSWER labels are not names a child would type unprompted: "חבלי שמשון בלחי", "איסוף המזון", "בשורת לידת שמשון", "התיבה נחה על הרי אררט", "המים מתחילים לרדת". Check that the matcher accepts natural variants ("שמשון והחבלים", "הר אררט", "המן").

## FIVE BEST CARDS

gen-joseph/4, connection/gideon-dew, age/b/rock-instruction, life-moses-4/4, finale/2.

Each needs real knowledge of the text or a comparison between two stories, every distractor is a plausible misreading rather than a joke, and the answer is not in the prompt.
