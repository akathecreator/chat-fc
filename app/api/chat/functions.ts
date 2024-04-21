import { ChatCompletionCreateParams } from "openai/resources/chat/index";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  giveStoragePermission,
  getShelfLocation,
  shootMissedAllocation,
} from "./warehouse";
import {
  findNewListingsToday,
  findOrdersHealthToday,
  findNumberOfTransactions,
} from "./orders";

export const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: "open_storage_permission",
    description: "Open permission for users to request storage in r2s",
    parameters: {
      type: "object",
      properties: {
        user_email: {
          type: "string",
          description: "Email of user requesting",
        },
      },
      required: ["user_email"],
    },
  },
  {
    name: "request_location_in_warehouse",
    description: "Finding the location of item in the warehouse",
    parameters: {
      type: "object",
      properties: {
        order_ref: {
          type: "string",
          description: "order id or wms_ref of order",
        },
      },
      required: ["order_ref"],
    },
  },
  {
    name: "allocate_space_in_warehouse",
    description:
      "Unable to print warehouse label or it appears loading when printing",
    parameters: {
      type: "object",
      properties: {
        order_ref: {
          type: "string",
          description: "order id",
        },
      },
      required: ["order_ref"],
    },
  },
  {
    name: "find_new_listings",
    description:
      "Find total listing depending on the firestore timestamp deduced from users' input for example if user says 7 days ago if today was 2024-04-19T17:00:00.000Z then you should pass 2024-04-12T17:00:00.000Z as string timestamp. GMV value always in Thai Baht",
    parameters: {
      type: "object",
      properties: {
        timestamp: {
          type: "string",
          description:
            "timestamp that deduced from users input passed in a way that can be used in firestore query if hours of the day not mentioned use data since midnight",
        },
      },
    },
  },
  {
    name: "find_numbers_of_transactions",
    description:
      "If users use the word order means transacted order. Find total sold orders or transactions depending on the firestore timestamp deduced from users' input for example if user says 7 days ago if today was 2024-04-19T17:00:00.000Z then you should pass 2024-04-12T17:00:00.000Z as string timestamp GMV value always in Thai Baht",
    parameters: {
      type: "object",
      properties: {
        timestamp: {
          type: "string",
          description:
            "timestamp that deduced from users input passed in a way that can be used in firestore query if hours of the day not mentioned use data since midnight",
        },
      },
    },
  },
];

export async function runFunction(name: string, args: any, db: object) {
  let result; // Declare result variable to hold the function return value
  let message;
  switch (name) {
    case "open_storage_permission":
      const message = await giveStoragePermission(db, args.user_email);
      return message;
    case "request_location_in_warehouse":
      result = await getShelfLocation(db, args.order_ref);
      break;

    case "allocate_space_in_warehouse":
      // Assuming shootMissedAllocation is the correct function for this operation
      result = await shootMissedAllocation(db, args.order_ref);
      break;

    case "find_new_listings":
      // Assuming findNewListingsToday takes a timestamp argument
      result = await findNewListingsToday(db, args.timestamp);
      break;

    case "find_numbers_of_transactions":
      // Assuming findNumberOfTransactions takes a timestamp argument
      result = await findNumberOfTransactions(db, args.timestamp);
      break;

    default:
      result = JSON.stringify({ message: "Function not found" });
      break;
  }
  return result;
}
