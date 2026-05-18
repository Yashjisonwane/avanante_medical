import { Pusher } from "pusher-js";
import PusherDefault from "pusher-js";
import { loadAccessToken, getOrGenerateDeviceId } from "../redux/api/baseApi";

let pusher = null;
let activeChannels = {};

const PUSHER_CONFIG = {
    key: "d40bce87f29057b18c8f",
    cluster: "ap2",
};

class SocketService {
    async connect() {
        if (pusher && pusher.connection.state === 'connected') {
            return pusher;
        }

        const token = await loadAccessToken();
        const deviceId = await getOrGenerateDeviceId();

        if (!token) {
            console.error("❌ No token found");
            return null;
        }

        const PusherClass = Pusher || PusherDefault?.Pusher || PusherDefault?.default || PusherDefault;

        pusher = new PusherClass(PUSHER_CONFIG.key, {
            authEndpoint: "https://lms-backend.netswaptech.com/api/broadcasting/auth",
            cluster: PUSHER_CONFIG.cluster,
            forceTLS: true,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "X-Device-Id": deviceId,
                },
            },
        });

        pusher.connection.bind("connected", () => {
            console.log("✅ Pusher connected");
        });

        pusher.connection.bind("error", (err) => {
            console.error("❌ Pusher error:", err);
        });

        return pusher;
    }

    async joinThread(threadId, callback) {
        if (!threadId) {
            console.error("❌ No threadId");
            return null;
        }

        console.log(`🔌 Joining thread: ${threadId}`);

        if (!pusher) {
            await this.connect();
        }

        if (pusher && pusher.connection.state !== 'connected') {
            console.log("⏳ Waiting for connection...");
            setTimeout(() => {
                this.joinThread(threadId, callback);
            }, 1000);
            return null;
        }

        const channelName = `private-support.thread.${threadId}`;

        if (activeChannels[channelName]) {
            console.log(`Already in channel: ${channelName}`);
            return activeChannels[channelName];
        }

        console.log(`📡 Subscribing to: ${channelName}`);
        const channel = pusher.subscribe(channelName);

        channel.bind("pusher:subscription_succeeded", () => {
            console.log(`✅ Subscribed to ${channelName}`);
        });

        const possibleEvents = [
            "support.message.sent",
            "App\\Events\\SupportMessageSent",
            "SupportMessageSent",
            "message.sent",
            "new_message",
            ".support.message.sent"
        ];

        possibleEvents.forEach(eventName => {
            channel.bind(eventName, (data) => {
                console.log(`📨 Event "${eventName}" received:`, data);
                let message = data?.message || data?.data?.message || data;

                if (message?.id) {
                    console.log("✅ Valid message:", message);
                    callback(message);
                } else {
                    console.warn("⚠️ No valid message in event:", data);
                }
            });
        });

        channel.bind_global((eventName, data) => {
            console.log(`🌍 [GLOBAL] Event: ${eventName}`, data);
        });

        activeChannels[channelName] = channel;
        return channel;
    }

    leaveThread(threadId) {
        const channelName = `private-support.thread.${threadId}`;
        if (pusher && activeChannels[channelName]) {
            pusher.unsubscribe(channelName);
            delete activeChannels[channelName];
        }
    }

    disconnect() {
        if (pusher) {
            pusher.disconnect();
            pusher = null;
            activeChannels = {};
        }
    }
}

export default new SocketService();
