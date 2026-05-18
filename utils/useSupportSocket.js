import { useEffect, useRef } from "react";
import socketService from "./socketService";

const useSupportSocket = ({ threadId, onMessageReceived }) => {
    const previousThreadId = useRef(null);

    useEffect(() => {
        if (!threadId) return;

        // Leave previous thread
        if (previousThreadId.current && previousThreadId.current !== threadId) {
            socketService.leaveThread(previousThreadId.current);
        }

        previousThreadId.current = threadId;

        // Connect and join
        const connectSocket = async () => {
            await socketService.connect();
            socketService.joinThread(threadId, (message) => {
                console.log("🎉 Message received in hook:", message);
                if (onMessageReceived) {
                    onMessageReceived(message);
                }
            });
        };
        connectSocket();

        return () => {
            if (previousThreadId.current === threadId) {
                socketService.leaveThread(threadId);
            }
        };
    }, [threadId, onMessageReceived]);
};

export default useSupportSocket;
