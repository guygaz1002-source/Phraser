// Rebuild Hebrew text from the existing, read-only Hebrew source stories.
// Run in bible-journey: node --import tsx scripts/import-hebrew-content.cjs
// English content owns IDs, geometry, images and saved-answer ordering.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = path.resolve(root, '..');
const {lifeHeroesForLanguage} = require(path.join(source, 'src/lib/life/content.ts'));
const {storyById, storyClueNotes} = require(path.join(source, 'src/lib/adventure/content.ts'));
const {sideQuestsFor} = require(path.join(source, 'src/lib/life/side-quests.ts'));
const tiers = {a: 'kids', b: 'teen', c: 'adult'};
// Reviewed event-specific phrases are authoring data, not a fuzzy Hebrew matcher.
const answerAliases = require(path.join(root, 'content/hebrew/answer-aliases.json'));
const sources = lifeHeroesForLanguage('he').map(hero => ({hero,
 base: JSON.parse(fs.readFileSync(path.join(root, 'content/characters', hero.id + '.json'), 'utf8')),
}));
assert.deepEqual(Object.keys(answerAliases).sort(), sources.flatMap(({base}) => base.stops.map(stop => stop.id)).sort(),
 'Hebrew answer aliases must cover exactly the imported story IDs');
for (const [id, aliases] of Object.entries(answerAliases)) {
 assert.ok(Array.isArray(aliases) && aliases.length > 0 && aliases.every(alias => typeof alias === 'string' && /[א-ת]/.test(alias)),
  `Missing reviewed Hebrew answer phrases ${id}`);
}
// Both spellings of Noah are conventional. Expand only the complete name in
// Noah's existing event phrases; never accept the name or a substring alone.
const noahSpellings = alias => [alias,
 alias.replace(/(^|\s)נוח(?=\s|$)/g, '$1נח'),
 alias.replace(/(^|\s)נח(?=\s|$)/g, '$1נוח'),
];
// Neutral visual observations, deliberately separate from solved titles and clues.
// IDs are not in chronological numeric order; map by the story, never its index.
const hints = {
 'life-moses-1': 'שימו לב לכלי הקלוע הקטן ולקנים שליד המים.',
 'life-moses-6': 'התבוננו במים, בצאן ובאנשים הזקוקים לעזרה.',
 'life-moses-2': 'שימו לב לסנדלים, לאור ולצמח שנשאר חי.',
 'life-moses-7': 'מי מדבר, ומי מחזיק בכוח לסרב?',
 'life-moses-3': 'התבוננו בחפצים שהמשפחות נושאות כשהן עוזבות את בתיהן.',
 'life-moses-4': 'שימו לב היכן האנשים יכולים ללכת ומה נמצא משני צדי הדרך.',
 'life-moses-8': 'התבוננו בקרקע ובדברים שהמשפחות אוספות.',
 'life-moses-9': 'התבוננו בהר, בקהל שהתאסף ובעננים.',
 'life-moses-5': 'התבוננו בידיו של המנהיג המבוגר ובאדם שלצדו.',
 'life-samson-1': 'שימו לב לאורח ולמשפחה ששומעת בשורה מפתיעה.',
 'life-samson-6': 'התבוננו בבעל החיים ובנוסע שעל השביל.',
 'life-samson-2': 'חפשו קשר מפתיע בין כוח למתיקות.',
 'life-samson-7': 'שימו לב למה שכרוך סביב זרועות האיש ולמה שקורה לו.',
 'life-samson-8': 'חפשו מים במקום שבו הנוסע נח.',
 'life-samson-3': 'התבוננו בחפצי העץ הכבדים וחשבו לאן הם שייכים.',
 'life-samson-4': 'שימו לב לשיער ולאנשים הקרובים לאיש הישן.',
 'life-samson-9': 'התבוננו באבן העגולה, בכבלים ובשיערו של האיש.',
 'life-samson-5': 'התבוננו בעמודים ובתנוחת האיש העומד ביניהם.',
 'life-noah-1': 'התבוננו בכלים, בקורות העץ ובצורה שמתחילה להיבנות.',
 'life-noah-6': 'התבוננו בסלים ובדברים שנשמרים לקראת שהייה ארוכה.',
 'life-noah-2': 'שימו לב לבעלי החיים, לפתח ולכיוון שבו כולם הולכים.',
 'life-noah-3': 'התבוננו במזג האוויר ובמים המקיפים את כלי השיט.',
 'life-noah-7': 'חפשו סימנים לשינוי ברוח ובמים.',
 'life-noah-8': 'התבוננו מתחת לכלי השיט. על מה הוא נשען כעת?',
 'life-noah-4': 'התבוננו בציפור ובדבר הקטן שהיא נושאת.',
 'life-noah-9': 'שימו לב לפתח הפתוח ולמקום שאליו המשפחות ובעלי החיים הולכים.',
 'life-noah-5': 'התבוננו בשמיים אחרי הגשם ובאנשים המביטים למעלה.',
};
const destination = path.join(root, 'content/hebrew/characters');
fs.mkdirSync(destination, {recursive: true});
const report = [];
for (const {hero, base} of sources) {
 const localized = structuredClone(base);
 const answerMap = new Map(base.stops.map(stop => [stop.puzzles[0].answer, storyById(stop.id, 'he').answer]));
 const translateChoice = value => {
  assert.ok(answerMap.has(value), `Unknown child choice ${hero.id}: ${value}`);
  return answerMap.get(value);
 };
 localized.name = hero.name;
 localized.epithet = 'תשעה פרקים. חיים שלמים לגלות.';
 localized.epithetKids = 'תשע הרפתקאות בתמונות.';
 localized.ending = Object.fromEntries(Object.entries(tiers).map(([tier, age]) => [tier, hero.ending[age]]));
 localized.stops = base.stops.map((stop, index) => {
  const story = storyById(stop.id, 'he');
  assert.ok(story && hints[stop.id], `Missing Hebrew story or hint ${stop.id}`);
  const he = stop.originalHebrew;
  assert.ok(he?.answer && he?.passage && he?.questions, `Missing retained Hebrew ${stop.id}`);
  assert.equal(story.answer, he.answer);
  const translated = {...structuredClone(stop), title: `פרק ${index + 1}`, shortTitle: `פרק ${index + 1}`,
   solvedTitle: story.title, source: story.reference, passage: structuredClone(he.passage), learned: structuredClone(he.passage),
   questions: structuredClone(he.questions)};
  for (const tier of Object.keys(tiers)) {
   assert.equal(translated.questions[tier].length, stop.questions[tier].length);
   translated.questions[tier].forEach((q, i) => {
    assert.equal(q.answer, stop.questions[tier][i].answer, `Learning answer index changed ${stop.id}/${tier}/${i}`);
    assert.equal(q.options.length, stop.questions[tier][i].options.length);
   });
  }
  if (stop.contentWarning) translated.contentWarning = 'הסיפור כולל רגעים קשים. אפשר לקרוא יחד עם מבוגר שסומכים עליו.';
  translated.puzzles = stop.puzzles.map(puzzle => ({...structuredClone(puzzle),
   answer: he.answer,
   aliases: [...new Set([
    ...[...he.aliases, ...answerAliases[stop.id]].flatMap(alias => hero.id === 'noah' ? noahSpellings(alias) : [alias]),
    puzzle.answer, ...puzzle.aliases,
   ])],
   partialAnswers: [...new Set([hero.name, ...(story.partialAnswers || []), ...puzzle.partialAnswers])],
   textHint: hints[stop.id],
   descriptions: Object.fromEntries(Object.keys(puzzle.descriptions).map(set => [set, puzzle.descriptions[set].map(() => hints[stop.id])])),
   source: story.reference,
   moral: story.reflection || story.discovery,
   discovery: story.discovery,
   reflection: story.reflection,
   clueNotes: Object.fromEntries(Object.entries(tiers).map(([tier, age]) => [tier, storyClueNotes(story, age)])),
   choicesKids: puzzle.choicesKids.map(translateChoice),
   choiceLabelsKids: puzzle.choiceLabelsKids.map(translateChoice),
  }));
  const sourceBonus = sideQuestsFor(stop.id);
  translated.bonus = stop.bonus.map(question => {
   const heQuestion = sourceBonus.find(q => q.id === question.id);
   assert.ok(heQuestion, `Missing Hebrew bonus ${question.id}`);
   assert.equal(heQuestion.answer, question.answer);
   assert.equal(heQuestion.options.he.length, question.options.length);
   return {...question, title: heQuestion.title.he, prompt: heQuestion.prompt.he, options: [...heQuestion.options.he], explanation: heQuestion.explanation.he};
  });
  return translated;
 });
 fs.writeFileSync(path.join(destination, hero.id + '.json'), JSON.stringify(localized, null, 2) + '\n');
 report.push({hero: hero.id, chapters: localized.stops.length, learningQuestions: localized.stops.reduce((n, s) => n + Object.values(s.questions).flat().length, 0), bonuses: localized.stops.reduce((n, s) => n + s.bonus.length, 0)});
}
console.log(JSON.stringify(report, null, 2));
