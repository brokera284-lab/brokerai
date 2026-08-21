import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function writeAdminLog(
  userUid: string,
  userEmail: string,
  action: string,
  details: string,
  target: string = "N/A"
) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userUid,
      userEmail,
      action,
      details,
      target,
      timestamp: serverTimestamp(),
      status: "success",
      ipAddress: "127.0.0.1",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Node-Server"
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}
