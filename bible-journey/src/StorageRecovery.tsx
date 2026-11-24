import { useEffect, useState } from "react";
import { Button, Copy, Screen } from "./components";
import { useGame } from "./GameProvider";
import { useLocale } from "./LocaleProvider";

export function StorageRecovery() {
  const { error, retry, recoverCorruptSave, recoveryBusy, recoveryFailed } = useGame();
  const { tr } = useLocale();
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setConfirming(false); }, [error]);
  return <Screen style={{ justifyContent: "center", maxWidth: 600 }}>
    <Copy accessibilityRole="header" kind="display" style={{ fontSize: 30, lineHeight: 40 }}>
      {error === "corrupt"
        ? tr("This saved game could not be opened", "לא ניתן לפתוח את השמירה הזאת")
        : error === "read"
          ? tr("Your progress could not be loaded.", "לא הצלחנו לטעון את ההתקדמות שלך.")
          : tr("Your progress could not be saved.", "לא הצלחנו לשמור את ההתקדמות שלך.")}
    </Copy>
    {error === "corrupt" ? <>
      <Copy>{confirming
        ? tr("Start a new game? We will keep a backup of the old save in this browser first. Your old progress will not appear in the new game.", "להתחיל משחק חדש? קודם נשמור גיבוי של השמירה הישנה בדפדפן הזה. ההתקדמות הישנה לא תופיע במשחק החדש.")
        : tr("The saved data is incomplete or unreadable. You can try loading it again, or keep a backup and start a new game.", "הנתונים שנשמרו אינם שלמים או אינם קריאים. אפשר לנסות לטעון אותם שוב, או לשמור גיבוי ולהתחיל משחק חדש.")}</Copy>
      {recoveryFailed ? <Copy accessibilityLiveRegion="assertive">{tr("Recovery could not be completed. Your old save has not been deleted. Free some browser storage, or try loading the save again.", "לא הצלחנו להשלים את ההתאוששות. השמירה הישנה לא נמחקה. אפשר לפנות מקום באחסון הדפדפן או לנסות לטעון את השמירה שוב.")}</Copy> : null}
      {confirming ? <>
        <Button title={recoveryBusy ? tr("Keeping a backup…", "שומרים גיבוי…") : tr("Keep a backup and start over", "שמירת גיבוי והתחלה מחדש")} onPress={recoverCorruptSave} disabled={recoveryBusy} />
        <Button title={tr("Cancel", "ביטול")} onPress={() => setConfirming(false)} disabled={recoveryBusy} quiet />
      </> : <>
        <Button title={tr("Try again", "ניסיון נוסף")} onPress={retry} />
        <Button title={tr("Start a new game…", "פתיחת משחק חדש…")} onPress={() => setConfirming(true)} quiet />
      </>}
    </> : <>
      {error === "write" ? <Copy>{tr("Keep this tab open. Try saving again to continue from the same place.", "השאירו את הלשונית פתוחה. נסו לשמור שוב כדי להמשיך מאותו מקום.")}</Copy> : null}
      <Button title={tr("Try again", "ניסיון נוסף")} onPress={retry} />
    </>}
  </Screen>;
}
