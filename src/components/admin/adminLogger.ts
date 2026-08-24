import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, cleanForFirestore } from "../../lib/firebase";

export async function writeAdminLog(
  userUid: string,
  userEmail: string,
  action: string,
  details: string,
  target: string = "N/A"
) {
  try {
    const cleaned = cleanForFirestore({
      userUid: userUid || "system",
      userEmail: userEmail || "system@brokerai.com",
      action: action || "info",
      details: details || "",
      target: target || "N/A",
      timestamp: serverTimestamp(),
      status: "success",
      ipAddress: "127.0.0.1",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Node-Server"
    });
    await addDoc(collection(db, "activity_logs"), cleaned);
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}
