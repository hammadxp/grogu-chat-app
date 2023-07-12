import { useEffect, useState } from "react";
import { useStore } from "./stores/useStore";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../utils/firebase-config";

export default function Chat() {
  const { currentRoom, currentUser } = useStore();
  const [messages, setMessages] = useState([]); // Local

  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  // Fetch messages

  useEffect(() => {
    const messagesQuery = query(collection(db, "messages"), where("room", "==", currentRoom));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      let snapshotMessages = [];

      snapshot.forEach((doc) => {
        snapshotMessages.push({ ...doc.data(), id: doc.id });
      });

      setMessages(snapshotMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Send message

  async function handleNewMessage(e) {
    e.preventDefault();
    if (!newMessage) return;

    setNewMessage("");

    await addDoc(collection(db, "messages"), {
      text: newMessage,
      room: currentRoom,
      createdAt: serverTimestamp(),
      userPhotoURL: currentUser.photoURL,
      userDisplayName: currentUser.displayName,
      userId: currentUser.uid,
    });
  }

  // Markup

  return (
    <div className={`m-2 ml-0 grid grid-rows-[1fr,auto] rounded-xl bg-purple-100 ${!currentRoom && "place-items-center"}`}>
      {currentRoom ? (
        <>
          <div className="h-[30rem] min-h-max overflow-y-scroll p-4">
            {isLoading ? (
              <div className="grid h-full w-full place-items-center">
                <div className="h-5 w-5 animate-spin bg-red-400">
                  <svg className="mr-3 h-5 w-5 animate-spin text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-center gap-4 rounded-sm font-medium text-purple-950">
                    <img src={message.userPhotoURL} alt="" className="h-10 w-10 rounded-full" />
                    <div className="-space-y-1">
                      <span className="text-xs">{message.userDisplayName}</span>
                      <p className="text-lg">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="">
            <form onSubmit={handleNewMessage} className="mx-auto flex max-w-2xl gap-2 py-1">
              <input
                type="text"
                id="new-message"
                placeholder="Type message ..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full rounded-full px-8 py-4 text-lg ring-1 ring-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button type="submit" className="w-28 rounded-full bg-purple-500 text-white transition hover:bg-purple-400">
                Send
              </button>
            </form>
          </div>
        </>
      ) : (
        <p>Please select a room to view it&#39;s chat</p>
      )}
    </div>
  );
}
