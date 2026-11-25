import type { Language } from "./locale";
import { lifeStages, type LifeStageId } from "./lifecycle";
import type { Character } from "./types";

type Line = [he: string, en: string];
type Chapter = { title: Line; road: [Line, Line, Line, Line] };

// Each landmark advances the companion's story regardless of the Bible card drawn there.
// Some maps span two episodes from the original nine-chapter life.
const lastLandmarkOfEpisode = [3, 7, 9, 11, 15, 17, 19, 23, 27];

const chapters: Record<string, Chapter[]> = {
  moses: [
    { title: ["בין קני היאור", "Among the Nile reeds"], road: [
      ["בבית שלחוף היאור מנסים לשמור על תינוק אחד.", "In a home near the Nile, a family tries to keep one baby safe."],
      ["אחותו של התינוק מוצאת מקום שממנו תוכל להשגיח.", "The baby’s sister finds a spot where she can keep watch."],
      ["בת המלך שומעת בכי בין הקנים.", "The king’s daughter hears a cry among the reeds."],
      ["הילד יגדל בין הבית שבו נולד ובית המלך.", "The child will grow up between his family’s home and the royal household."],
    ]},
    { title: ["בדרכי מדיין", "On the roads of Midian"], road: [
      ["הרחק ממצרים, משה עוצר לנוח במדיין.", "Far from Egypt, Moses rests in Midian."],
      ["בנות רועים באות להשקות את הצאן.", "Shepherds’ daughters come to give their flock water."],
      ["הבנות חוזרות הביתה מוקדם מן הרגיל.", "The daughters reach home earlier than usual."],
      ["משפחה במדיין מזמינה את הזר לשבת איתה לאכול.", "A family in Midian invites the stranger to share a meal."],
    ]},
    { title: ["בדרך חזרה למצרים", "The road back to Egypt"], road: [
      ["מעבר למדבר משהו מושך את מבטו של משה.", "Across the wilderness, something catches Moses’ eye."],
      ["משה שומע שעליו לחזור אל אחיו במצרים.", "Moses hears that he must return to his people in Egypt."],
      ["שני אחים נכנסים יחד לבית המלך.", "Two brothers enter the king’s house together."],
      ["בחוץ ממתינים אנשים שעבודתם הולכת ומכבידה.", "Outside, people wait while their work grows harder."],
    ]},
    { title: ["הלילה האחרון במצרים", "The last night in Egypt"], road: [
      ["משפחות במצרים מתכוננות ללילה אחר מכל הלילות.", "Families in Egypt prepare for an unusual night."],
      ["האנשים מחכים בבתיהם עד שיקראו להם.", "People wait inside their homes until word comes."],
      ["כבר לילה, ובבית המלך קוראים למשה ולאהרן.", "It is night when the king calls for Moses and Aaron."],
      ["המשפחות ממהרות לדרך עוד לפני שהבצק תופח.", "Families hurry on their way before the dough has time to rise."],
    ]},
    { title: ["אל המדבר", "Into the wilderness"], road: [
      ["מים לפנים וקול מרכבות מאחור.", "Water lies ahead and chariots can be heard behind."],
      ["עם בוקר האנשים מביטים לאחור אל הדרך שעברו.", "At daybreak the people look back at the way they have come."],
      ["כעת עולות במדבר שאלות על אוכל ליום הבא.", "Now in the wilderness, the people wonder how they will eat tomorrow."],
      ["בכל אוהל מודדים כמה דרוש למשפחה.", "In each tent, the family measures what it needs."],
    ]},
    { title: ["למרגלות ההר", "At the foot of the mountain"], road: [
      ["העם חונה מול הר במדבר.", "The people camp opposite a mountain in the wilderness."],
      ["ממחנה האוהלים משה עולה אל ההר.", "Moses climbs from the camp toward the mountain."],
      ["קול שופר נשמע במחנה.", "The sound of a horn reaches the camp."],
      ["האנשים פונים אל משה ומבקשים שישמע בשבילם.", "The people ask Moses to listen on their behalf."],
    ]},
    { title: ["מול הארץ", "Looking toward the land"], road: [
      ["משה מביט אל הארץ וחושב על הדרך שעוד מחכה לעם.", "Moses looks toward the land and thinks of the journey still ahead."],
      ["הוא מבקש שלעם יהיה מי שילך בראשו.", "He asks that someone be appointed to lead the people."],
      ["העדה מתאספת כדי לראות למי יימסר התפקיד.", "The community gathers to witness who will take up the task."],
      ["העם מתכונן להמשיך אל מעבר לירדן.", "The people prepare to continue beyond the Jordan."],
    ]},
  ],
  noah: [
    { title: ["בחצרו של נח", "In Noah’s yard"], road: [
      ["נח ומשפחתו נמצאים על אדמה יבשה. עוד לא יורד גשם.", "Noah and his family are on dry ground. The rain has yet to fall."],
      ["נח מקבל מידות מדויקות לעבודה שלפניו.", "Noah receives exact measurements for the work ahead."],
      ["יהיה צורך במקום גם לבני הבית וגם לחיות.", "There must be room for the household and the animals."],
      ["המשפחה מתכוננת לשהייה ארוכה הרחק מאדמה יבשה.", "The family prepares for a long time away from dry land."],
    ]},
    { title: ["ההכנות למסע", "Preparing for the voyage"], road: [
      ["נח צריך לחשוב מי יצטרף אל משפחתו בדרך.", "Noah must think about all the creatures that will travel with his family."],
      ["גם החיות הקטנות יצטרכו לאכול.", "Even the smallest animals will need to eat."],
      ["מה שהמשפחה מכינה היום יצטרך להספיק לימים רבים.", "What the family prepares today must last for many days."],
      ["הרגע לצאת לדרך מתקרב.", "The time to set out is drawing close."],
    ]},
    { title: ["כשהגשם מגיע", "When the rain comes"], road: [
      ["נח מכנס את בני המשפחה.", "Noah gathers his household."],
      ["בעלי כנף והולכים על ארבע מוצאים מקום בפנים.", "Winged creatures and four-footed animals find room inside."],
      ["גשם יורד גם ביום וגם בלילה.", "Rain falls both day and night."],
      ["המקום שהיה על הקרקע מתרומם עם המים.", "What once rested on the ground now rises with the water."],
    ]},
    { title: ["רוח על פני המים", "Wind over the water"], road: [
      ["סביב נח הכול עדיין מכוסה מים.", "Everything around Noah is still covered with water."],
      ["רוח חולפת מעל פני המים.", "A wind passes over the surface of the water."],
      ["הגשם נעצר, אבל המשפחה עדיין מחכה.", "The rain stops, but the family must still wait."],
      ["השינוי איטי. יום ועוד יום חולפים.", "The change is slow. One day passes, then another."],
    ]},
    { title: ["אדמה באופק", "Land on the horizon"], road: [
      ["אחרי חודשים של תנועה יש סוף סוף מקום לנוח.", "After months of movement there is at last a place to rest."],
      ["פסגות ההרים מתחילות להיראות.", "Mountain peaks begin to appear."],
      ["נח פותח חלון ומחפש סימן מן העולם שבחוץ.", "Noah opens a window and looks for a sign from the world outside."],
      ["נח מחכה לראות מה ישוב אליו עם ערב.", "Noah waits to see what will come back to him by evening."],
    ]},
    { title: ["שוב על האדמה", "Back on the earth"], road: [
      ["נח מסיר את המכסה ומביט בקרקע.", "Noah lifts the covering and looks at the ground."],
      ["גם אחרי שרואים יבשה מגיע עוד זמן של המתנה.", "Even after dry ground can be seen, there is more waiting."],
      ["עכשיו גם לחיות יש שוב מקום להתפזר.", "Now the animals once again have room to spread out."],
      ["לאחר הדרך הארוכה נח בונה מזבח.", "After the long voyage, Noah builds an altar."],
    ]},
    { title: ["שמיים פתוחים", "Under open skies"], road: [
      ["נח ומשפחתו מתחילים חיים חדשים.", "Noah and his family begin a new life."],
      ["מילים של הבטחה נאמרות לנח ולבניו.", "Words of promise are spoken to Noah and his sons."],
      ["גם היצורים שחלקו עמם את הדרך נכללים בהבטחה.", "The creatures that shared their voyage are included in the promise."],
      ["גם בדורות הבאים אנשים יביטו אל העננים ויזכרו.", "In generations to come, people will look up at the clouds and remember."],
    ]},
  ],
  samson: [
    { title: ["בין צרעה לאשתאול", "Between Zorah and Eshtaol"], road: [
      ["ליד צרעה, אורח מביא למשפחה בשורה מפתיעה.", "Near Zorah, a visitor brings surprising news to a family."],
      ["אשת מנוח מספרת לבעלה על האיש שפגשה.", "Manoah’s wife tells him about the visitor she met."],
      ["מנוח מבקש לדעת איך לגדל את הילד שיבוא.", "Manoah asks how to raise the child who is to come."],
      ["הילד גדל בארץ דן, בין צרעה לאשתאול.", "The child grows up in the land of Dan, between Zorah and Eshtaol."],
    ]},
    { title: ["בכרמי תמנה", "In the vineyards of Timnah"], road: [
      ["שמשון יוצא עם הוריו לכיוון תמנה.", "Samson sets out toward Timnah with his parents."],
      ["ליד הכרמים נשמעת שאגה.", "A roar sounds near the vineyards."],
      ["בדרך חזרה שמשון סר לראות מה נשאר שם.", "On a later journey Samson turns aside to see what remains."],
      ["הוא נותן להוריו דבר מתוק בלי לספר מהיכן בא.", "He gives his parents something sweet without saying where it came from."],
    ]},
    { title: ["משתה ואחריו דרך", "A feast and the road beyond"], road: [
      ["במשתה בתמנה האורחים מקשיבים למילים משונות.", "At a feast in Timnah, the guests hear some puzzling words."],
      ["השמש עומדת לשקוע, והאורחים ממהרים להשיב.", "As sunset draws near, the guests hurry to give their reply."],
      ["אנשי יהודה באים אל שמשון שבסלע עיטם.", "Men of Judah come to Samson at the rock of Etam."],
      ["הם מוליכים אותו ללחי, ושם נשמעת תרועה.", "They lead him to Lehi, where a shout goes up."],
    ]},
    { title: ["בדרך לחי", "In the land of Lehi"], road: [
      ["אחרי המאבק בלחי שמשון עייף וצמא.", "After the struggle at Lehi, Samson is tired and thirsty."],
      ["במקום הצחיח הוא קורא לעזרה.", "In the dry country he calls for help."],
      ["משקה אחד מחזיר לו את כוחותיו.", "A drink gives him his strength again."],
      ["שמשון נותן למקום שם שיזכיר את קריאתו.", "Samson names the place to remember his cry."],
    ]},
    { title: ["מעזה לנחל שורק", "From Gaza to the Sorek valley"], road: [
      ["אנשי עזה מחכים לאור ראשון.", "The men of Gaza wait for daybreak."],
      ["בחצי הלילה שמשון יוצא אל ההר שמול חברון.", "At midnight Samson sets out for the hill facing Hebron."],
      ["בנחל שורק שואלים את שמשון מהו סוד כוחו.", "In the Sorek valley, Samson is asked the secret of his strength."],
      ["שמשון מגלה דבר ששמר בלבו שנים.", "Samson reveals something he has kept to himself for years."],
    ]},
    { title: ["מאחורי החומות", "Behind the walls"], road: [
      ["שמשון מובל בחזרה לעזה.", "Samson is led back to Gaza."],
      ["ימיו עוברים בעבודה קשה מאחורי החומות.", "He spends his days at hard labor behind the walls."],
      ["בזמן שהוא עובד מתחיל בו שינוי קטן.", "A small change begins as he works."],
      ["בעיר נערכים לחגיגה גדולה.", "In the city, preparations begin for a great celebration."],
    ]},
    { title: ["בין העמודים", "Among the pillars"], road: [
      ["קהל גדול מתאסף בעזה.", "A large crowd gathers in Gaza."],
      ["נער מוליך את שמשון בתוך הבניין.", "A boy leads Samson through the building."],
      ["שמשון מבקש להניח את ידיו על העמודים.", "Samson asks to rest his hands on the pillars."],
      ["ברגע האחרון שמשון מבקש כוח עוד פעם אחת.", "In his final moments Samson asks for strength one more time."],
    ]},
  ],
};

const stageChanges: Record<string, [number, LifeStageId][]> = {
  moses: [[0,"moses-baby"], [2,"moses-child"], [4,"moses-young"], [8,"moses-shepherd"], [10,"moses-leader"], [24,"moses-elder"]],
  samson: [[0,"samson-child"], [4,"samson-adult"], [20,"samson-shorn"], [24,"samson-regrowth"]],
  noah: [[0,"noah-builder"], [4,"noah-keeper"], [10,"noah-watcher"], [20,"noah-renewed"]],
};

export function guideStage(hero: string, landmarkIndex: number) {
  const changes = stageChanges[hero]!;
  let selected = changes[0]![1];
  for (const [index, stage] of changes) if (landmarkIndex >= index) selected = stage;
  return lifeStages[selected];
}

export function companionChapter(character: Character, landmarkIndex: number, language: Language) {
  const map = Math.floor(landmarkIndex / 4);
  const position = landmarkIndex % 4;
  const chapter = chapters[character.id]![map]!;
  const episode = lastLandmarkOfEpisode.findIndex(last => landmarkIndex <= last);
  const text = language === "he" ? 0 : 1;
  return { title: chapter.title[text], line: chapter.road[position]![text], stop: character.stops[episode]! };
}

export function companionPassages(character: Character, paid: number[]) {
  const firstUnfinished = paid.findIndex(count => count < 5);
  const completed = firstUnfinished === -1 ? paid.length : firstUnfinished;
  return character.stops.filter((_, episode) => lastLandmarkOfEpisode[episode]! < completed);
}
