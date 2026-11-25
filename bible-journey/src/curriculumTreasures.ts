import type { Language } from "./locale";
import type { Question } from "./types";

type Wording = [prompt: string, right: string, other: string, other: string, explanation: string];
type Pair = { he: Wording; en: Wording };

// The narrator supplies the story detail. Young players work from a sound, an object,
// a sequence or a simple consequence instead of recalling a name from Judges.
const earlySamson: { stopId: string; cards: Pair[] }[] = [
  { stopId:"life-samson-1", cards:[
    { he:["שליח מספר לאישה שייוולד לה בן. מה הייתה מכינה בשביל התינוק?", "מקום לישון בו", "שער לחומת העיר", "סל לדבורים", "התינוק שעליו שמעה הוא שמשון. הוא יצטרך מקום בטוח לישון בו."],
      en:["A messenger tells a woman she will have a baby. What could she get ready for him?", "A place to sleep", "A city gate", "A basket for bees", "The baby she hears about is Samson. He will need a safe place to sleep."] },
    { he:["אמו של שמשון רוצה שגם מנוח, אביו, ישמע את השליח. מה תעשה כשהשליח חוזר לשדה?", "לקרוא לאביו לבוא לשדה", "לסגור את דלת הבית", "לחפש את התינוק בעריסה", "האישה הולכת לקרוא למנוח, ושניהם יכולים לשמוע את השליח."],
      en:["Samson’s mother wants his father to hear the messenger who has come to the field. What could she do when the messenger returns?", "Calling his father to the field", "Closing the door at home", "Looking in the baby's cradle", "She goes to call Manoah so that they can both hear the messenger."] }]},
  { stopId:"life-samson-6", cards:[
    { he:["שמשון הולך ליד כרם ושומע אריה. איזה קול מתאים לרגע הזה?", "שאגה", "זמזום", "ציוץ", "בדרך ליד הכרם מתקרב אל שמשון אריה שואג."],
      en:["Samson is walking by a vineyard and hears a lion. Which sound fits this moment?", "A roar", "A buzz", "A chirp", "A roaring lion comes towards Samson near the vineyard."] },
    { he:["ליד האריה שבדרך של שמשון גדלים ענבים. איך קוראים למקום שמגדלים בו גפנים?", "ליד כרם", "ליד באר מים", "ליד שער העיר", "ענבים גדלים בכרם. שמשון פגש את האריה ליד הכרמים של תמנה."],
      en:["Grapes grow near the lion on Samson’s path. What is a place where grapevines grow called?", "A vineyard", "A well", "A city gate", "Grapes grow in a vineyard. Samson met the lion near the vineyards of Timnah."] }]},
  { stopId:"life-samson-2", cards:[
    { he:["שמשון מוצא דבש בדרך. איזה יצור קטן הכין אותו?", "דבורה", "נמלה", "פרפר", "שמשון מצא בדרך דבורים ואת הדבש שלהן."],
      en:["Samson finds honey on his way. Which little creature made it?", "A bee", "An ant", "A butterfly", "Samson found bees and their honey on the way."] },
    { he:["שמשון לוקח מן הדבש ונותן גם לאמו ולאביו. איזו מילה מתארת את מה שעשה?", "שיתף", "החביא", "החליף", "הוא אכל מן הדבש בדרך ונתן גם להוריו לטעום."],
      en:["Samson takes some honey and gives some to his parents. What did he do with it?", "Shared it", "Hid it", "Swapped it", "He ate some of the honey and gave his parents some to taste."] }]},
  { stopId:"life-samson-2", cards:[
    { he:["האורחים מחפשים משהו מתוק בחידה של שמשון. איזו תשובה מתאימה?", "הדבש שמצא בדרך", "השער שסחב", "המעיין ששתה ממנו", "בחידה של שמשון הדבש הוא הדבר המתוק."],
      en:["The guests are looking for something sweet in Samson’s riddle. What fits?", "The honey he found", "The gate he carried", "The spring he drank from", "In Samson’s riddle the honey is the sweet thing."] },
    { he:["בחידה של שמשון יש חזק ויש מתוק. איזה זוג תמונות מספר את שני החלקים?", "אריה ודבש", "שתי דבורים", "שני אריות", "האריה מסביר את החלק החזק, והדבש את החלק המתוק."],
      en:["Samson’s riddle has something strong and something sweet. Which two pictures tell both parts?", "A lion and honey", "Two bees", "Two lions", "The lion fits the strong part, and the honey fits the sweet part."] }]},
  { stopId:"life-samson-8", cards:[
    { he:["שמשון צמא מאוד ומוצא מים. מה יעשה תחילה כדי להרגיש טוב יותר?", "ישתה", "ירחץ את רגליו", "ירטיב את בגדיו", "בסיפור שמשון שותה והכוח חוזר אליו."],
      en:["Samson is thirsty and there is water. What should he do first to feel better?", "Drink", "Wash his feet", "Wet his clothes", "In the story Samson drinks and his strength returns."] },
    { he:["שמשון צמא. אחר כך הוא מרגיש חזק ויכול להמשיך ללכת. מה עשה בין שני הרגעים האלה?", "שתה ממי המעיין", "נשא את שער העיר", "טעם מן הדבש", "קודם שמשון צמא, אחר כך הוא שותה, ורק אז כוחו חוזר."],
      en:["Samson is thirsty. A little later he feels strong enough to keep walking. What did he do in between?", "Drank from the spring", "Carried the city gate", "Tasted some honey", "First he is thirsty, then he drinks, then his strength returns."] }]},
  { stopId:"life-samson-3", cards:[
    { he:["שמשון נושא את דלתות השער אל ההר. מה ימצאו אנשי העיר בפתח כשיתעוררו?", "פתח שאין בו דלתות", "דלתות סגורות", "שער כפול", "הדלתות כבר על ההר, ולכן הן אינן סוגרות את פתח העיר."],
      en:["Samson carries the gate doors up a hill. What will the people find at their entrance in the morning?", "An entrance with no doors", "Closed doors", "A double gate", "The doors are already up the hill, leaving the entrance open."] },
    { he:["שער העיר כבד, ובכל זאת שמשון יוצא איתו לדרך. על איזה חלק בגופו הוא מניח אותו?", "הכתפיים", "הברכיים", "כפות הרגליים", "שמשון שם את השער על כתפיו וכך נושא אותו אל ההר."],
      en:["The city gate is heavy, yet Samson sets off carrying it. Which part of his body does he rest it on?", "His shoulders", "His knees", "His feet", "Samson puts the gate on his shoulders and carries it up the hill."] }]},
  { stopId:"life-samson-3", cards:[
    { he:["בתחילת הלילה הדלתות בעיר. אחר כך הן על ההר. מה צריך לקרות באמצע?", "שמשון הולך עם הדלתות על כתפיו", "שומר נועל את הדלתות על ההר", "אנשים בונים עיר חדשה", "שמשון הוא שמעביר את הדלתות מהעיר אל ההר."],
      en:["At the start of the night the doors are at the city. Later they are on a hill. What has to happen in between?", "Samson walking with the doors on his shoulders", "A guard locking doors on the hill", "People building a new city", "Samson is the one who moves the doors from the city to the hill."] },
    { he:["בסיפורי שמשון נזכרים דבש ושער כבד. איזה מעשה מראה כמה חזק שמשון?", "הוא סוחב את שער העיר במעלה ההר", "הוא טועם מהדבש", "הוא מציע לאביו מעט דבש", "צריך כוח רב כדי להרים שער כבד ולשאת אותו עד ההר."],
      en:["Samson’s stories mention honey and a heavy gate. Which action shows his strength?", "Carrying the city gate uphill", "Tasting some honey", "Offering honey to his father", "It takes great strength to lift a heavy gate and carry it up a hill."] }]}
];

function localizedChoice(pair: Pair, answer: number, language: Language): Question {
  const [prompt, correct, second, third, explanation] = pair[language];
  const options = [correct,second,third].map((_, i, all) => all[(i + 3 - answer) % 3]!);
  return {prompt, options, answer, explanation};
}

export function earlySamsonTreasure(map: number, slot: 0|1, language: Language): {stopId:string; question:Question} {
  const pair = earlySamson[map]!;
  const question = localizedChoice(pair.cards[slot]!, (map + slot + 1) % 3, language);
  return {stopId:pair.stopId, question};
}

// Introduce an unfamiliar word or missing story detail before asking a first-time listener to reason with it.
const earlyDetails: Record<string, {answer: number; words: Pair}> = {
  "life-moses-1/0": {answer:1, words:{
    he:["התינוק שבתיבה רעב. אחות משה מציעה לקרוא לאישה שתיניק אותו. מה התינוק יקבל כך?", "חלב", "דבש", "לחם", "מינקת היא אישה שמניקה תינוק. האחות הלכה לקרוא לאמו של משה."],
    en:["The baby in the basket is hungry. His sister offers to find someone who can breastfeed him. What will he get?", "Milk", "Honey", "Bread", "Moses’ sister fetches his own mother to feed him milk."]}},
  "life-noah-1/1": {answer:2, words:{
    he:["נח מורח על העץ כופר, חומר שעוצר מים. איפה חשוב למרוח אותו כדי שהגשם לא יטפטף פנימה?", "בסדקים שבין הקורות", "על החציר של הכבשים", "על סלי הפירות", "כשהסדקים מכוסים, מים לא יכולים לעבור ביניהם לתוך התיבה."],
    en:["Noah coats the wood with pitch, a material that keeps water out. Where is it needed to stop rain getting in?", "In gaps between boards", "On the sheep’s hay", "On the fruit baskets", "Sealing the gaps stops water coming through the wooden sides of the ark."]}},
  "life-moses-3/1": {answer:0, words:{
    he:["המשפחות עטפו את קערות הבצק בבד ונשאו אותן על הכתף. איך זה עוזר למי שהולך עם ילד קטן?", "יד אחת יכולה להחזיק ביד הילד", "הילד צריך להישאר מאחור", "צריך להניח את הבצק בכל צעד", "כשנושאים את הצרור על הכתף, אפשר לתת יד לילד בדרך."],
    en:["The families wrapped their dough bowls in cloth and carried them on their shoulders. How does that help someone walking with a little child?", "A hand is free to hold the child's hand", "The child has to stay behind", "The dough must be put down at every step", "With the bundle on a shoulder, the traveller can take the child’s hand."]}},
  "life-noah-9/1": {answer:1, words:{
    he:["נח יצא אל היבשה ובנה מזבח כדי להודות לאלוהים. מה אפשר לו לבנות אותו מחוץ לתיבה?", "האדמה התייבשה ואפשר לעמוד עליה", "הכול בחוץ עדיין מכוסה גלים", "המים עלו עד פתח התיבה", "אחרי המבול נח יכול לצאת ולעבוד על אדמה יבשה."],
    en:["After leaving the ark, Noah builds an altar to thank God. What makes it possible to build it outdoors now?", "There is dry ground to stand on", "Waves still cover everything outside", "The water has risen to the doorway", "When the flood has passed, Noah can go outside and work on dry ground."]}}
};
export function earlyTreasureWording(stopId: string, slot: 0|1, language: Language) {
  const detail = earlyDetails[stopId + "/" + slot];
  return detail ? localizedChoice(detail.words, detail.answer, language) : undefined;
}

// The primary group spans several school years. Introduce the episode before asking
// a younger reader to reason about material taught later in elementary school.
const primaryIntroductions: Record<string, Record<Language,string>> = {
  "life-samson-1": {he:"לפני ששמשון נולד, שליח בא לבשר לאמו על הבן שייוולד.", en:"Before Samson is born, a messenger brings his mother news about her son."},
  "life-samson-6": {he:"בדרך לתמנה שמשון הולך עם הוריו ונתקל באריה ליד הכרם.", en:"On the way to Timnah, Samson travels with his parents and encounters a lion near a vineyard."},
  "life-samson-2": {he:"שמשון מוצא דבש בדרך ומחבר חידה על מה שראה. אורחי המשתה מנסים לפתור אותה.", en:"Samson finds honey on the road and makes a riddle about what he saw. The guests try to solve it."},
  "life-samson-7": {he:"אנשי יהודה באים אל שמשון כשהפלשתים מחפשים אותו. הם מבקשים לקשור אותו ולהסגירו.", en:"The people of Judah find Samson while the Philistines are looking for him. They ask to tie him up and hand him over."},
  "life-samson-8": {he:"בלחי שמשון משתחרר מידי שוביו. אחר כך הוא צמא, קורא לעזרה ומוצא מים.", en:"At Lehi, Samson escapes from his captors. Afterwards he is thirsty, calls for help and finds water."},
  "life-samson-3": {he:"אנשי עזה מחכים לשמשון ליד שער העיר. באמצע הלילה הוא קם ומרים את השער.", en:"The people of Gaza wait for Samson near the city gate. In the middle of the night he gets up and lifts the gate."},
  "life-samson-4": {he:"שמשון נולד עם הבטחה ששערו יישאר ארוך. דלילה מנסה לגלות את סוד כוחו.", en:"Samson was born with a promise that his hair would grow uncut. Delilah tries to find out the secret of his strength."},
  "life-samson-9": {he:"פעם יצא שמשון מעזה ונשא את השער על כתפיו. עכשיו הוא אסיר באותה עיר.", en:"Samson once walked out of Gaza carrying its gate. Now he is a prisoner in that same city."},
  "life-samson-5": {he:"לקראת סוף חייו שמשון עומד בין שני עמודים ופונה לאלוהים.", en:"Near the end of his life, Samson stands between two pillars and calls to God."},
  "life-moses-1": {he:"אחות משה עומדת ליד היאור כשבת פרעה מוצאת את אחיה התינוק.", en:"Moses’ sister stands beside the Nile when Pharaoh’s daughter finds her baby brother."},
  "life-moses-6": {he:"משה מגיע למדיין ורואה רועים מגרשים בנות שהביאו צאן לבאר.", en:"Moses reaches Midian and sees shepherds driving away girls who have brought their flock to the well."},
  "life-moses-2": {he:"ליד הסנה הבוער משה נקרא לשוב למצרים ולהוציא משם את עמו.", en:"At the burning bush, Moses is called to return to Egypt and lead his people out."},
  "life-moses-7": {he:"אחרי שמשה ואהרן פונים לפרעה, העובדים עדיין צריכים להכין אותו מספר לבנים בכל יום.", en:"After Moses and Aaron speak to Pharaoh, the workers must still make the same number of bricks each day."},
  "life-moses-3": {he:"המשפחות יוצאות ממצרים במהירות ונושאות איתן בצק.", en:"The families leave Egypt in a hurry, carrying their dough."},
  "life-moses-4": {he:"אחרי היציאה ממצרים מגיעים בני ישראל לים. פרעה וצבאו בעקבותיהם.", en:"After leaving Egypt, the Israelites reach the sea. Pharaoh and his army follow them."},
  "life-moses-8": {he:"במדבר משה מסביר לעם כמה מן לאסוף ליום אחד ומתי להכין אוכל לשבת.", en:"In the wilderness Moses tells the people how much manna to gather each day and when to prepare for the Sabbath."},
  "life-moses-9": {he:"בסיני שומע העם מצוות לחיי היום־יום. עוד קודם, כשאסף מן, העם נח בשבת.", en:"At Sinai the people hear commandments for daily life. Earlier, when gathering manna, they rested on the Sabbath."},
  "life-moses-5": {he:"לפני סיום מסעו משה מציג את יהושע לפני העם וסומך עליו את ידיו.", en:"Near the end of his journey, Moses presents Joshua to the people and lays his hands on him."},
};
export function primaryTreasureIntroduction(stopId:string, language:Language) {
  return primaryIntroductions[stopId]?.[language];
}
