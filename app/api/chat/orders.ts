import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

async function findNewListingsToday(db, startTime) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const thailandTime = new Date(utc + 3600000 * 7);
  const startDate = new Date(thailandTime.setHours(0, 0, 0, 0));
  const checkTime = startTime ? new Date(startTime) : startDate;

  const ordersRef = collection(db, "orders");
  const q = query(
    ordersRef,
    where("listed_timestamp", ">=", checkTime),
    where("status", "==", "pending"),
  );

  const snap = await getDocs(q);
  let mapper = {
    count: 0,
    shoes: 0,
    bags: 0,
    accessories: 0,
    apparel: 0,
    collectibles: 0,
    brand_new: 0,
    like_new: 0,
    gmv: 0,
    query_timestamp_since: checkTime,
  };

  snap.forEach((doc) => {
    const data = doc.data();
    mapper.count++;
    mapper[data.category]++;
    mapper[data.condition]++;
    mapper.gmv += Number(data.price);
  });

  return JSON.stringify({ message: mapper });
}

async function findNumberOfTransactions(db, startTime) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const thailandTime = new Date(utc + 3600000 * 7);
  const startDate = new Date(thailandTime.setHours(0, 0, 0, 0));
  const checkTime = startTime ? new Date(startTime) : startDate;

  const ordersRef = collection(db, "orders");
  console.log(checkTime);
  const q = query(ordersRef, where("process_timestamp", ">=", checkTime));

  const snap = await getDocs(q);
  let mapper = {
    count: 0,
    shoes: 0,
    bags: 0,
    accessories: 0,
    apparel: 0,
    collectibles: 0,
    brand_new: 0,
    like_new: 0,
    gmv: 0,
    query_timestamp_since: checkTime,
    process: 0,
    matched: 0,
    settled: 0,
    failed: 0,
  };

  snap.forEach((doc) => {
    const data = doc.data();
    mapper.count++;
    mapper[data.category]++;
    mapper[data.condition]++;
    mapper.gmv += Number(data.price);
    if (data.status && data.status.includes("fail")) {
      mapper.failed++;
    } else {
      mapper[data.status]++;
    }
  });

  return JSON.stringify({ message: mapper });
}

async function findOrdersHealthToday(db) {
  // Incorrect collection name corrected
  const ordersRef = collection(db, "orders");
  console.log("Accessed the orders collection"); // No actual database call, just an example
}

export {
  findNewListingsToday,
  findOrdersHealthToday,
  findNumberOfTransactions,
};
