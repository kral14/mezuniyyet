import { api } from './api';

const SYSTEM_PREFIX = "[SYSTEM_ERROR_REPORT]";

export const errorReporter = {
    /**
     * Report an error to the Admin via Chat
     * @param {Error} error - The error object
     * @param {Object} info - React error info or other context
     */
    reportError: async (error, info = null) => {
        console.group("🚨 errorReporter.reportError");
        try {
            const currentUser = api.getCurrentUser();
            console.log("Current User:", currentUser);

            // 2. Format Message
            const payload = {
                user_id: currentUser?.id,
                username: currentUser?.username || 'Guest',
                message: error?.message || String(error),
                stack: error?.stack,
                component_stack: info?.componentStack,
                url: window.location.href,
                user_agent: navigator.userAgent
            };

            console.log("📦 Payload prepared:", payload);

            // 3. Send to Server DB
            console.time("Report Request");
            const result = await api.reportSystemError(payload);
            console.timeEnd("Report Request");

            console.log("✅ API Result:", result);
            console.log("🚨 Error system report sent successfully.");

        } catch (err) {
            console.error("❌ Critical Failure in ErrorReporter:", err);
        } finally {
            console.groupEnd();
        }
    },

    /**
     * Check if a message is a system error report
     * @param {String} content 
     * @returns {Object|null} Parsed payload or null
     */
    parseReport: (content) => {
        if (!content || !content.startsWith(SYSTEM_PREFIX)) return null;
        try {
            const jsonStr = content.substring(SYSTEM_PREFIX.length).trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            return null;
        }
    }
};
