import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
const snsClient = new SNSClient({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.SNS_KEY, // Make sure to set your environment variables
    secretAccessKey: process.env.SNS_SECRET,
  },
});

async function giveStoragePermission(db, user_email) {
  if (user_email) {
    let user_data = {};
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("personal_data.email", "==", user_email));

    const snap = await getDocs(q);
    if (snap.empty) {
      // Handle case where user is not found
      return JSON.stringify({ message: "user not found" });
    }

    snap.forEach((doc) => {
      user_data = doc.data();
    });

    // Ensure that user_data has the necessary fields before proceeding
    if (!user_data.portal_rule_id || !user_data.id) {
      console.log(user_data, user_data.id, user_data.portal_rule_id);
      // Handle case where user data is incomplete
      return JSON.stringify({ message: "user data is incomplete" });
    }

    if (!user_data.portal_rule_id.includes("storage")) {
      const userDocRef = doc(db, "users", user_data.id);
      await updateDoc(userDocRef, { portal_rule_id: "storage_ask" });
      return JSON.stringify({
        message: "storage permission complete",
      });
    } else {
      return JSON.stringify({
        message: "already has storage permission",
      });
    }
  } else {
    return JSON.stringify({ message: "no email provided" });
  }
}

async function getShelfLocation(db, order_ref) {
  const orderRef = doc(db, "orders", order_ref);
  let orderSnap = await getDoc(orderRef);

  if (!orderSnap.exists()) {
    // Try finding by ref
    const ordersQuery = query(
      collection(db, "orders"),
      where("wms_meta.wms_ref", "==", order_ref),
    );
    orderSnap = await getDocs(ordersQuery);

    if (orderSnap.empty) {
      return JSON.stringify({ message: "order not found" });
    }

    // Assuming only one document will be returned for the specified `wms_ref`
    orderSnap.forEach((doc) => {
      orderSnap = doc; // Use this doc for further operations
    });
  }

  const orderDoc = orderSnap.data();

  if (!orderDoc) {
    return JSON.stringify({ message: "order not found" });
  }

  const { wms_meta } = orderDoc;
  if (!wms_meta) {
    return JSON.stringify({
      message: "order Found but order does not have wms_meta",
    });
  }

  const { shelf_space, status } = wms_meta;
  if (status === "cancelled") {
    return JSON.stringify({
      message:
        "Item is not in warehouse since batch request in was already cancelled",
    });
  }
  const split_shelf = shelf_space.split("-");

  return JSON.stringify({
    message: `item at shelf number ${split_shelf[0]} level ${split_shelf[1]} unit ${split_shelf[4]}`,
  });
}

const shootMissedAllocation = async (db, order_id) => {
  // Use the Firestore modular API to get a document
  const orderRef = doc(db, "orders", order_id);
  const orderSnap = await getDoc(orderRef);

  if (!orderSnap.exists()) {
    return JSON.stringify({ message: "order not found" });
  }

  const orderDoc = orderSnap.data();
  const { wms_meta } = orderDoc;

  if (!wms_meta) {
    return JSON.stringify({ message: "wms_meta not found" });
  }

  const { status } = wms_meta;

  if (status === "allocated" || status === "checked_in") {
    return JSON.stringify({
      message:
        "item already been allocated a spot or checked into the warehouse please check with advisors",
    });
  }

  // Prepare SNS payload
  const orderId = order_id;
  const userId = "AI_GENOS";
  const payload = {
    order_id: orderId,
    uid: userId,
  };
  let random = (Math.random() + 1).toString(36).substring(7);
  const params = {
    TopicArn:
      "arn:aws:sns:ap-southeast-1:123456789012:WarehouseAllocationTopic.fifo",
    Message: JSON.stringify(payload),
    MessageGroupId: random,
    MessageDeduplicationId: `${orderId}-${random}`,
  };

  // Use AWS SDK v3 to send the message to the FIFO queue
  try {
    const command = new PublishCommand(params);
    const response = await snsClient.send(command);
    console.log("Success, message published:", response);
    return JSON.stringify({ message: "SNS message sent successfully" });
  } catch (error) {
    console.error("Error sending SNS message:", error);
    return JSON.stringify({ message: "Error sending SNS message" });
  }
};

export { giveStoragePermission, getShelfLocation, shootMissedAllocation };
