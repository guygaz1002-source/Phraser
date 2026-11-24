import type { Language } from "./locale";
import { visualQuestionsFor } from "./round";
import type { Question, Stop, TierId } from "./types";

type Wording = [prompt: string, options: [string, string, string], explanation: string];
type Card = { answer: 0 | 1 | 2; he: Wording; en: Wording };
type Connection = { sources: Record<Language, string>; cards: Record<TierId, Card> };

// The fifth illustration shows the resolved scene. Each comparison starts from something in that painting.
const connections: Partial<Record<string, Connection>> = {
  "life-noah-6": {
    sources: { he: "בראשית ו׳, כ״א; רות ב׳, ט״ו–י״ח", en: "Genesis 6:21 and Ruth 2:15–18" },
    cards: {
      a: { answer: 1,
        he: ["בסלים של נח יש אוכל גם לחיות. רות הביאה אוכל הביתה לנעמי. איזה סל היה עוזר לנעמי להכין לחם?", ["סל של צמר", "סל של גרגירי שעורה", "סל של קש"], "רות ליקטה שיבולים בשדה, הוציאה מהן את גרגירי השעורה והביאה אותם הביתה."],
        en: ["Noah packs food for the animals too. Ruth brings food home to Naomi. Which basket could help Naomi make bread?", ["A basket of wool", "A basket of barley grain", "A basket of straw"], "Ruth gathered stalks in the field, beat out the barley grain and took it home."],
      },
      b: { answer: 2,
        he: ["נח מכניס מזון לתיבה. רות הולכת אחרי הקוצרים. למה היא מחכה שיעברו?", ["כדי להחזיר לקוצרים את מה שהפילו", "כדי לטחון את השעורה לפני הקציר", "כדי ללקט שיבולים שנשארו בשדה"], "בועז ביקש מהקוצרים להשאיר לרות שיבולים. כך היה לה מה להביא לנעמי."],
        en: ["Noah brings food into the ark. Ruth walks behind the reapers. Why does she let them go ahead?", ["To give back the stalks they drop", "To grind the barley before harvest", "To gather stalks left in the field"], "Boaz had the reapers leave stalks for Ruth so she would have grain to take to Naomi."],
      },
      teen: { answer: 0,
        he: ["הסלים באיור מלאים. איזה פרט בפסוקים מסביר איך הובטח מזון לנוסעי התיבה ואיך נמצאה שעורה לרות?", ["נח קיבל הוראה לאסוף מראש; בועז ביקש להשאיר שיבולים למלקטת", "נח קנה תבואה; רות קיבלה שכר קבוע מהקוצרים", "נח זרע לפני המבול; רות הביאה לנעמי מן הקציר בשדה שלה"], "בבראשית האיסוף הוא חלק מן ההכנות להפלגה. ברות, החלטה של בעל השדה מאפשרת לאישה אחרת לאסוף מזון."],
        en: ["The baskets are full. Which details explain how the ark’s passengers and Ruth each came by food?", ["Noah was told to gather ahead of time, and Boaz told reapers to leave stalks for Ruth", "Noah bought grain, and Ruth was paid a regular harvester’s wage", "Noah sowed before the flood, and Ruth harvested a field of her own"], "Noah gathers supplies before the voyage. In Ruth, a landowner’s instructions make it possible for someone else to gather grain."],
      },
      c: { answer: 2,
        he: ["צייר התיבה בחר בסלי מזון. איזו מאמירותיו של קורא האיור אפשר לבסס גם בבראשית וגם ברות?", ["שני המספרים מציינים את סוג הדגן ואת הכמות שנאספה", "שניהם מתארים חלוקת מנות אישיות מתוך מחסן משותף", "שניהם מזהים את מי שיאכל; רק סיפור רות כאן מפרט גם מין דגן ומידה"], "לנח נאמר לאסוף אוכל לו ולבעלי החיים בלי רשימת מזונות. אצל רות המספר מונה כאיפה של שעורים ומראה מה הגיע לנעמי."],
        en: ["The painter chose baskets to show the ark’s provisions. Which reading fits the details in Genesis and Ruth?", ["Both narrators specify the grain and the quantity collected", "Both describe individual rations distributed from a common store", "Both identify who will eat, but only Ruth names a grain and gives a measure here"], "Noah receives a general instruction to feed himself and the animals. Ruth’s narrator records about an ephah of barley and follows the food home to Naomi."],
      },
    },
  },
  "life-moses-6": {
    sources: { he: "שמות ב׳, ט״ז–כ״א; בראשית כ״ד, י״ב–כ״א וכ״ח–ל״ב", en: "Exodus 2:16–21 and Genesis 24:12–21, 28–32" },
    cards: {
      a: { answer: 0,
        he: ["משה משקה כאן צאן. רבקה נתנה מים לאיש ואחר כך לגמלים שלו. איפה גם גמל יכול לשתות כמו הכבשים שבתמונה?", ["בשוקת שמילאו במים", "מתוך הדלי שבתחתית הבאר", "מתוך הכד שעוד לא מילאו"], "רבקה שפכה מים לשוקת ושבה אל הבאר לשאוב עוד, עד שגם הגמלים קיבלו מים."],
        en: ["Moses waters a flock here. Rebekah gave a traveler a drink, then watered his camels. Where could a camel drink like the sheep in the picture?", ["From a trough filled with water", "From the bucket at the bottom of the well", "From the jug before it was filled"], "Rebekah emptied her jug into the trough and went back to draw more for the camels."],
      },
      b: { answer: 1,
        he: ["השוקת מזכירה שתי פגישות. מי עשה יותר ממה שביקשו ממנו במילים?", ["עבד אברהם, שהשקה את הצאן במדיין", "רבקה, שהציעה להשקות גם את הגמלים", "רועי מדיין, שפינו מקום לבנות ליד הבאר"], "העבד ביקש לגימה לעצמו. רבקה הציעה לשאוב גם לגמליו. במדיין הרועים דווקא גירשו את הבנות, ומשה עזר להן."],
        en: ["The trough recalls two meetings. Who went beyond what someone had asked for in words?", ["Abraham’s servant, by watering the flock in Midian", "Rebekah, by offering to water the camels too", "The Midianite shepherds, by making room for the daughters"], "The servant asked for a drink for himself. Rebekah offered water for his camels as well. In Midian the shepherds drove the daughters away and Moses helped."],
      },
      teen: { answer: 2,
        he: ["משה עומד ליד השוקת במדיין. רבקה עומדת ליד שוקת בסיפור אחר. מה תפקידה של העזרה בכל פגישה?", ["בשתי הפגישות מבקשים הרועים לבחון את הזר", "בשתי הפגישות שאיבת המים פותרת סכסוך על גישה לבאר", "משה מתערב כשמגרשים את הבנות; רבקה מגלה נדיבות כלפי אורח"], "משה מאפשר לבנות להשקות את צאנן. רבקה שואבת לגמלים מיוזמתה, כפי שקיווה העבד בתפילתו."],
        en: ["Moses stands at the trough in Midian. Rebekah stands at a trough in another story. What purpose does the help serve in each meeting?", ["At both wells the shepherds wish to test a stranger", "At both wells drawing water settles a dispute over access", "Moses intervenes when the daughters are driven off, while Rebekah offers a guest more than he requested"], "Moses makes it possible for the daughters to water their flock. Rebekah volunteers to draw for the camels, just as the servant had hoped in his prayer."],
      },
      c: { answer: 0,
        he: ["בשתי עלילות הבאר הזר מתקבל בהמשך בבית. איזה הבדל סיבתי נשמר גם כשמזהים את הדמיון?", ["במדיין הבנות מספרות על עזרת הזר; אצל רבקה העבד בוחן את מעשה המארחת לאור תפילתו", "בשני המקומות בעל הבית מציב לזר מראש מבחן של השקיית עדר", "במדיין מוצעת שאיבה כסימן משמים; אצל רבקה היא תשובה לגירוש בידי רועים"], "רעואל שומע מבנותיו על משה ומבקש לקרוא לו. ליד רבקה, הקורא כבר מכיר את הסימן שביקש העבד ומבין מדוע הוא מתבונן בה."],
        en: ["Both encounters at a well lead to a stranger being welcomed at home. Which distinction preserves the cause of each welcome?", ["In Midian the daughters report a stranger’s help, while the servant watches his host in light of his prayer", "At both wells the head of the household has set the stranger a watering test", "In Midian watering is proposed as a divine sign, while Rebekah acts after shepherds drive someone off"], "Reuel hears his daughters’ report and asks them to invite Moses. At Rebekah’s well, the reader already knows the sign for which the servant prayed."],
      },
    },
  },
  "life-moses-7": {
    sources: { he: "שמות ה׳, א׳–ט׳; שמואל ב׳ י״ב, א׳–ז׳ וי״ג", en: "Exodus 5:1–9 and 2 Samuel 12:1–7, 13" },
    cards: {
      a: { answer: 2,
        he: ["שני האחים מדברים אל המלך שבתמונה. נתן סיפר לדוד על כבשה שלקחו מאיש עני. מה היה תפקידו של דוד בסיפור?", ["להביא את הבקשה למלך", "לגדל את הכבשה של האיש העני", "להקשיב כמלך ולהחליט מה צודק"], "בארמון מצרים משה ואהרן פונים לפרעה. בסיפור הכבשה נתן מספר סיפור לדוד המלך."],
        en: ["Two brothers speak to the king in the picture. Nathan told David about a lamb taken from a poor man. What was David’s job in Nathan’s story?", ["Take the message to the king", "Raise the poor man’s lamb", "Listen as king and decide what was fair"], "In Egypt Moses and Aaron speak to Pharaoh. In the story about a lamb, Nathan tells his story to King David."],
      },
      b: { answer: 0,
        he: ["משה ואהרן מבקשים מפרעה לשלח את העם. נתן מספר לדוד על עשיר שלקח כבשה מעני. למה נתן נותן לדוד לשפוט קודם את העשיר?", ["כדי שדוד יזהה אחר כך את העוול שהוא עצמו עשה", "כדי ששופטי מצרים יחליטו אם העם רשאי לצאת", "כדי שדוד יקבע כמה כבשים ייתנו לאורח הבא"], "דוד כועס על העשיר. רק אחר כך נתן מגלה לדוד שהסיפור נאמר על מעשהו שלו."],
        en: ["Moses and Aaron ask Pharaoh to let the people go. Nathan tells David about a rich man who took a poor man’s lamb. Why let David judge the rich man first?", ["So David can then recognize the wrong in his own action", "So Egypt’s judges can decide whether the people may go", "So David can decide how many lambs to give the next guest"], "David is angry at the rich man. Only then does Nathan reveal that the story points to David’s own deed."],
      },
      teen: { answer: 1,
        he: ["מול הכס שבתמונה נשמעת דרישה ישירה. כיצד משתנה דרך הפנייה כשהנמען הוא דוד בסיפור נתן?", ["נתן מבקש מדוד רשות לפני שהוא מוסר דרישה לשחרר עם", "נתן מוביל את דוד לפסוק במקרה אחר לפני שהוא חושף את ההקבלה", "נתן ממתין שדוד יודה במעשהו ורק אז מתחיל במשל"], "משה ואהרן פותחים בדרישה בשם ה׳. נתן שומע תחילה כיצד דוד שופט את העשיר, ואז מייחס לדוד את התפקיד הזה."],
        en: ["The men facing this throne make a direct demand. How does Nathan’s approach change when David is the listener?", ["Nathan seeks permission before delivering a demand to release a people", "Nathan gets David to judge another case before revealing the parallel", "Nathan waits for David to admit his deed before beginning the parable"], "Moses and Aaron open with a demand in God’s name. Nathan first hears David’s judgment on the rich man, then identifies David with him."],
      },
      c: { answer: 1,
        he: ["פרעה מגיב לשליחים היוצאים נגד מדיניותו. כיצד אפשר להבחין בין תגובתו לתגובת דוד לנתן, מעבר להסכמה או סירוב?", ["פרעה מבקש להכריע במקרה משפטי; דוד מערער על סמכות שולחו של נתן", "פרעה מתרגם את הסירוב להכבדה על העובדים; פסקו של דוד במשל הופך בסיס לתוכחה כלפיו", "פרעה מסביר את הסירוב במשל על עבודה; דוד מטיל על אנשי העשיר מכסה חדשה"], "בשמות, שיחת הארמון מתגלגלת להוראות על מכסת הלבנים. בשמואל, המלך עצמו מספק את השיפוט המוסרי לפני שהנביא מזהה אותו עם העשיר."],
        en: ["Pharaoh faces messengers challenging his policy. Beyond refusal or assent, how does his response differ from David’s response to Nathan?", ["Pharaoh asks to judge a legal case, whereas David disputes the sender’s authority", "Pharaoh turns refusal into a heavier burden on workers, whereas David’s verdict underlies the charge against him", "Pharaoh tells a parable about labor, whereas David imposes a fresh quota on the rich man’s workers"], "The audience with Pharaoh leads to orders about brick quotas. In Samuel, the king himself supplies the moral judgment before Nathan identifies him with the rich man."],
      },
    },
  },
  "life-noah-8": {
    sources: { he: "בראשית ח׳, ד׳ וי״ג–י״ח; יונה ב׳, י״א", en: "Genesis 8:4, 13–18 and the final verse of Jonah 2" },
    cards: {
      a: { answer: 1,
        he: ["הדג הוציא את יונה אל היבשה. התיבה בתמונה כבר נחה על ההר. האם גם נח כבר יצא?", ["כן, הוא מטייל ליד התיבה", "עוד לא, הוא עדיין בתוך התיבה", "כן, הוא ירד עוד כשהתיבה שטה"], "התיבה נעצרה על ההרים הרבה לפני שנח יצא. יונה כבר נמצא על היבשה כשהדג מוציא אותו."],
        en: ["The fish put Jonah out on dry land. The ark in the picture has reached a mountain. Has Noah come out too?", ["Yes, he is walking beside the ark", "Not yet, he is still inside the ark", "Yes, he got out while the ark was floating"], "The ark came to rest on the mountains long before Noah left it. Jonah was on dry land when the fish let him out."],
      },
      b: { answer: 2,
        he: ["אצל יונה היציאה מהדג מביאה אותו ישר ליבשה. מה עוד צריך לקרות אצל נח אחרי שהתיבה נחה על ההר?", ["נח צריך לצאת מיד ולבדוק ברגל אם הארץ יבשה", "תחילה צריך לשחרר את כל בעלי החיים לבדם", "הארץ צריכה להתייבש ונח יקבל הוראה לצאת"], "עצירת התיבה היא רק שלב בדרך. אחר כך הארץ מתייבשת וה׳ אומר לנח להוציא את משפחתו ואת בעלי החיים."],
        en: ["Leaving the fish brings Jonah straight onto dry land. What still has to happen after Noah’s ark comes to rest?", ["Noah must go out at once to check the ground on foot", "All the animals must be sent outside on their own first", "The earth must dry, and Noah will be told to come out"], "The landing is one stage. Later the earth dries, and God tells Noah to bring out his family and the animals."],
      },
      teen: { answer: 0,
        he: ["נח רואה שהקרקע מתייבשת. יונה מתפלל ממעי הדג. מי מקבל את ההוראה שמשנה את מקומו של האדם בכל סיפור?", ["נח עצמו מקבל הוראה לצאת; אצל יונה ה׳ פונה לדג", "נח מקבל מן היונה הוראה לצאת; הדג מקבל הוראה מיונה", "בשני הסיפורים ה׳ אומר לאדם לצאת בכוחות עצמו"], "נח יוצא בעקבות הדיבור אליו. יונה מגיע לחוף בעקבות הפנייה לדג, בלי הוראת יציאה שמופנית אליו."],
        en: ["Noah sees the ground drying. Jonah prays inside the fish. Who receives the instruction that changes the person’s location in each account?", ["Noah himself is told to leave, while in Jonah God addresses the fish", "Noah is told to leave by the dove, while the fish takes orders from Jonah", "In both stories God tells the person to make his own way out"], "Noah comes out after God addresses him. Jonah reaches shore after God speaks to the fish, with no instruction to disembark addressed to Jonah."],
      },
      c: { answer: 2,
        he: ["האיור עוצר ברגע מנוחת התיבה. באיזה פרט ספרותי אפשר להבחין כשמשווים את הגעת נח ליבשה לסוף תפילת יונה?", ["שני המספרים מדלגים ממגע ראשון בקרקע ליציאת האדם באותו משפט", "ספר יונה מונה תאריכים בין עליית הדג ליבשה ליציאת יונה, בדומה לבראשית", "בראשית מפריד בתאריכים בין מנוחת התיבה לייבוש הארץ; יונה מסיים את התפילה במעשה מיידי של הדג"], "בראשית מתעכב על שלבים נפרדים ועל ההוראה לנח. אחרי תפילת יונה מתוארים הדיבור לדג והטלת יונה ליבשה בפסוק אחד."],
        en: ["The painting freezes the ark’s landing. Which narrative difference emerges when you compare Noah’s arrival with the end of Jonah’s prayer?", ["Both narrators move from first contact with land to the person’s exit in a single sentence", "Jonah dates the interval between the fish reaching land and Jonah leaving, as Genesis does", "Genesis dates the ark’s resting and the earth’s drying separately, while Jonah’s prayer leads straight to an act by the fish"], "Genesis distinguishes stages and gives Noah an instruction. After Jonah’s prayer, God addressing the fish and Jonah being put ashore share a single verse."],
      },
    },
  },
  "life-moses-4": {
    sources: { he: "שמות י״ד, כ״א–כ״ב; יהושע ג׳, י״ד–י״ז וד׳, כ׳–כ״ד", en: "Exodus 14:21–22, Joshua 3:14–17 and 4:20–24" },
    cards: {
      a: { answer: 0,
        he: ["כאן הולכים בים על אדמה יבשה. גם בנהר הירדן האנשים עברו ברגל. מה בתמונה היה מתאים לציור של שתי החציות?", ["כפות רגליים על קרקע יבשה", "שתי חומות מים, אחת מכל צד", "משה פושט יד מעל המים"], "בשני המקומות הלכו על קרקע יבשה. בים המים נראו כחומות משני הצדדים. בירדן המים שהגיעו מרחוק נעצרו."],
        en: ["Here people walk through the sea on dry ground. People also walked across the Jordan River. What could you draw in both pictures?", ["Feet on dry ground", "A wall of water on each side", "Moses stretching a hand over the water"], "People walked on dry ground in both crossings. At the sea the water stood on both sides. At the river the water coming from upstream stopped."],
      },
      b: { answer: 2,
        he: ["המאייר צייר מים מימין ומשמאל להולכים בים. איך יצייר את המים כדי לתאר במקומם את חציית הירדן?", ["יצייר חומה מצד ימין וחומה מצד שמאל גם בנהר", "יצייר גשר ועליו הכוהנים ומי הירדן זורמים מתחת לגשר", "יראה שהמים הבאים במורד הנהר נעצרו הרחק ממקום החצייה"], "בשמות המים עומדים משני צדי ההולכים. ביהושע נעצרת הזרימה במעלה הנהר והעם חוצה מול יריחו."],
        en: ["The artist put water on the right and left of the people at the sea. How should the artist change the water for a picture of the Jordan crossing?", ["Give the river a wall of water on each side as well", "Show the priests on a bridge with the river flowing underneath", "Show the water coming downstream held back far from the crossing"], "In Exodus water stands on both sides of the walkers. In Joshua the upstream flow stops and the people cross opposite Jericho."],
      },
      teen: { answer: 1,
        he: ["התמונה מראה עם שלם חוצה ביבשה. למה יהושע מציב אבנים אחרי חציית הירדן ומזכיר בהסברו את ים סוף?", ["כדי שהילדים ידעו איפה בדיוק בים עבר משה", "כדי ששאלה של ילד על האבנים תפתח סיפור הקושר בין שתי החציות", "כדי שהאבנים יעצרו שוב את הזרם כשיצטרכו לחזור"], "האבנים בגלגל מזמינות את הדור הבא לשאול. בתשובה מסבירים שה׳ ייבש את הירדן, כפי שעשה בים סוף."],
        en: ["The picture shows a whole people crossing on dry ground. Why does Joshua set up stones after crossing the Jordan and mention the sea?", ["So children will know precisely where Moses crossed the sea", "So a child’s question about the stones can lead to a story connecting both crossings", "So the stones can stop the river again for a return journey"], "The stones at Gilgal are meant to prompt a later generation’s question. The answer links God’s drying of the Jordan to what happened at the sea."],
      },
      c: { answer: 0,
        he: ["כשיהושע מסביר את אבני הגלגל הוא מקביל את הירדן לים שבתמונה. מה ההקבלה בוחרת להדגיש למרות ההבדל בתיאור המים?", ["זהות הפועל וייבוש הדרך בפני ישראל, שיש לספר עליהם לדור הבא", "זהות המחווה של המנהיג, שפושט את ידו מעל המים בשני המקומות", "זהות הנוף, ובפרט שתי חומות מים הצמודות להולכים בשני המעברים"], "בנאום יהושע הייבוש מיוחס לה׳ בשני הדורות. הסיפורים עצמם שומרים על פרטים שונים, מרוח הלילה בים ועד רגלי הכוהנים בירדן."],
        en: ["In explaining the stones at Gilgal, Joshua compares the Jordan to this sea. What does his comparison select despite the different descriptions of the water?", ["The same divine actor drying a path before Israel, to be remembered across generations", "The identical gesture of a leader holding out his hand above both bodies of water", "The identical landscape of two walls of water immediately beside the walkers"], "Joshua attributes the drying to God across both generations. The narratives still distinguish the night wind at the sea from the priests’ feet at the Jordan."],
      },
    },
  },
  "life-moses-9": {
    sources: { he: "שמות י״ט, ט״ז–י״ט ושמות כ׳, י״ד–י״ז; נחמיה ח׳, א׳–ח׳", en: "Exodus 19:16–19, Exodus 20 after the Ten Commandments, and Nehemiah 8:1–8" },
    cards: {
      a: { answer: 2,
        he: ["כאן כולם עומדים יחד מול ההר. כעבור שנים עזרא פותח ספר לפני עם שלם. איזה ציור מתאים גם לקהל של עזרא?", ["אנשים שעולים יחד לראש ההר", "אנשים שמחכים בתור לקבל ספר משלהם", "ילדים שכבר מבינים מקשיבים לצד המבוגרים"], "עזרא קרא באוזני נשים, גברים וכל מי שכבר יכול להבין. כמו בסיני, הקהל מתכנס כדי לשמוע."],
        en: ["Here everyone stands together facing the mountain. Years later Ezra opens a scroll before a crowd. Which picture would fit Ezra’s listeners too?", ["People climbing to the mountaintop together", "People lining up to get a scroll each", "Children old enough to follow listening alongside adults"], "Ezra read to women, men and everyone able to understand. As at Sinai, the people gathered to listen."],
      },
      b: { answer: 1,
        he: ["האנשים שבאיור פונים להר. בימי עזרא הם פונים לבימת עץ. איזה שינוי צריך הצייר לעשות כדי לעבור מסיפור סיני לסיפור עזרא?", ["להשאיר את הענן מעל ההר ולהוסיף לו רעש שופר", "להעמיד את עזרא על הבימה עם ספר פתוח מול הקהל", "לצייר את הקהל עולה אל ההר כדי לקחת את הספר"], "בסיני משה מוביל את העם לתחתית ההר. בירושלים עזרא עומד על בימת עץ, פותח את הספר וקורא כך שהקהל ישמע."],
        en: ["The people in the painting face a mountain. In Ezra’s day they faced a wooden platform. What should the artist change to tell Ezra’s story?", ["Keep the cloud over the mountain and add the sound of a horn", "Put Ezra on the platform with an open scroll before the crowd", "Show the crowd climbing the mountain to collect the scroll"], "At Sinai Moses brings the people to the foot of the mountain. In Jerusalem Ezra stands on a wooden platform, opens the scroll and reads to the assembly."],
      },
      teen: { answer: 0,
        he: ["בסיני העם נרתע מן הקולות ומבקש ממשה לדבר אליו. אצל עזרא הלויים פונים אל השומעים. איזה צורך ממלאים הלויים?", ["להבהיר לקהל את דברי התורה הנקראים באוזניו", "להרחיק את הקהל מגבול שאסור לעבור", "לשאול מי בקהל מוכן להחליף את עזרא כקורא"], "בסיני מבקש העם שמשה ישמיע לו את הדברים. בנחמיה הקריאה כבר מתקיימת, והלויים עוזרים לשומעים להבין את הנקרא."],
        en: ["At Sinai the people draw back and ask Moses to speak to them. At Ezra’s reading the Levites help the listeners. What need do the Levites meet?", ["Helping the assembly understand the words being read aloud", "Keeping the assembly behind a boundary it must not cross", "Asking who will take over as reader from Ezra"], "At Sinai the people ask to hear the words through Moses. In Nehemiah the reading is already underway, and the Levites help the audience understand it."],
      },
      c: { answer: 2,
        he: ["הקהל שלמרגלות ההר מזכיר את קהל עזרא לפני שער המים. איזו הבחנה נשענת על מקור הסמכות ועל אופן הגישה אליו?", ["בשני המעמדות ציבור השומעים מנסח את המצוות ומוסר אותן לקורא", "בשניהם ספר כתוב מונח מראש במרכז, והבעיה היא מי רשאי לקרוא בו", "בסיני העם מגיב לדיבור האלוהי ומבקש תיווך; בירושלים הוא מבקש ספר קיים וזוכה להסבר"], "בשמות בקשת העם למשה באה בעקבות החוויה בהר. בנחמיה הציבור יוזם את הבאת תורת משה, והלויים מסייעים בהבנתה."],
        en: ["The assembly below the mountain recalls Ezra’s crowd at the Water Gate. Which distinction holds for the source of authority and the assembly’s access to it?", ["In both assemblies the listeners formulate commandments and deliver them to a reader", "Both begin with a written book in the center and a dispute over who may read it", "At Sinai the people respond to divine speech by asking for mediation, while in Jerusalem they request an existing scroll and receive explanation"], "In Exodus the request to Moses follows the mountain encounter. In Nehemiah the assembly asks for the Torah of Moses to be brought, and the Levites aid its understanding."],
      },
    },
  },
};

export function routePictureQuestion(stop: Stop, tier: TierId, step: number, language: Language): Question | undefined {
  const connection = step === 4 ? connections[stop.id] : undefined;
  if (!connection) return visualQuestionsFor(stop, tier)[step - 1];

  const card = connection.cards[tier];
  const [prompt, options, explanation] = card[language];
  return { prompt, options, answer: card.answer, explanation: `${explanation} (${connection.sources[language]})` };
}
