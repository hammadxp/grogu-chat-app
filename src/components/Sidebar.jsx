import { serverTimestamp, setDoc, doc, updateDoc, arrayUnion, query, collection, getDoc, where, documentId, onSnapshot } from "firebase/firestore";
import { auth, db } from "../utils/firebase-config";
import { useStore } from "./stores/useStore";
import { useEffect, useState } from "react";
import generateRandomGradient from "../utils/generateRandomGradient";

export default function Sidebar() {
  const { currentUser, rooms, setRooms, setCurrentRoom, currentRoom } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    async function getJoinedRooms() {
      const docSnap = await getDoc(doc(db, "users", currentUser.uid));
      const joinedRooms = docSnap?.data().joinedRooms;

      if (joinedRooms.length === 0) return;

      const roomsQuery = query(collection(db, "rooms"), where(documentId(), "in", joinedRooms));

      // Pedro
      unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
        let roomsSnapshot = [];

        snapshot.forEach((doc) => {
          roomsSnapshot.push({ ...doc.data(), id: doc.id });
        });

        setRooms(roomsSnapshot);
        setIsLoading(false);
      });
    }

    currentUser && isLoading && getJoinedRooms();

    return () => unsubscribe();
  }, [currentUser]);

  async function createRoom() {
    const roomName = window.prompt("Enter name for the room you want to create:");

    await setDoc(doc(db, "rooms", roomName), {
      name: roomName,
      gradient: generateRandomGradient(),
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
    });

    await updateDoc(doc(db, "users", currentUser.uid), {
      joinedRooms: arrayUnion(roomName),
    });

    window.location.reload();
  }

  async function joinRoom() {
    const roomName = window.prompt("Enter name of the room you want to join:");

    await updateDoc(doc(db, "users", currentUser.uid), {
      joinedRooms: arrayUnion(roomName),
    });

    window.location.reload();
  }

  return (
    <aside
      className={`grid grid-rows-[1fr,auto] overflow-auto rounded-xl bg-[#f2efff] 600px:rounded-none ${currentRoom ? "600px:hidden" : "600px:grid"}`}
    >
      <div className="overflow-y-scroll bg-[#f2efff] p-2">
        {isLoading ? (
          <div className="grid h-full w-full place-items-center">
            <p>Loading rooms...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setCurrentRoom(room)}
                className="flex h-20 w-full cursor-pointer items-center gap-4 rounded-lg bg-[#f9f7fc] px-6 py-4 text-black transition hover:bg-[#724ff9] hover:text-white"
              >
                <div
                  className="h-14 w-14 rounded-full"
                  style={{ background: `linear-gradient(to bottom right, ${room.gradient[0]}, ${room.gradient[1]})` }}
                >
                  {console.log(room)}
                </div>
                <h3>{room.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 rounded-xl p-1 600px:py-2">
        <button onClick={joinRoom} className="rounded-xl bg-[#724ff9] px-5 py-3 text-white shadow-md transition hover:bg-[#724ff9]/80">
          Join a room
        </button>
        <button onClick={createRoom} className="rounded-xl bg-[#724ff9] px-5 py-3 text-white shadow-md transition hover:bg-[#724ff9]/80">
          Create a room
        </button>
      </div>
    </aside>
  );
}
