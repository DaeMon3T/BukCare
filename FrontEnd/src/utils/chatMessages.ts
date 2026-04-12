const VIDEO_CALL_PREFIX = "Started a Video Call. Join here:";
const LEGACY_VIDEO_CALL_PREFIXES = [
  VIDEO_CALL_PREFIX,
  "📞 Started a Video Call. Join here:",
  "ðŸ“ž Started a Video Call. Join here:",
];
const VIDEO_CALL_LABELS = [
  "Video Call",
  "Video Call Invite",
  "📞 Video Call",
  "ðŸ“ž Video Call",
];

export const isVideoCallInvite = (content = "") =>
  LEGACY_VIDEO_CALL_PREFIXES.some((prefix) => content.includes(prefix));

export const getVideoCallRoomId = (content = "") => {
  const matchedPrefix = LEGACY_VIDEO_CALL_PREFIXES.find((prefix) =>
    content.includes(prefix)
  );

  if (!matchedPrefix) return null;

  return content.split("Join here:")[1]?.trim() || null;
};

export const isVideoCallPreview = (content = "") =>
  isVideoCallInvite(content) ||
  VIDEO_CALL_LABELS.some((label) => content.trim() === label);

export const isAppointmentReminderPreview = (content = "", messageType?: string) =>
  messageType === "appointment_reminder" ||
  content.toLowerCase().includes("appointment reminder");

export const getConversationPreview = (message?: {
  content?: string;
  message_type?: string;
}) => {
  const content = message?.content || "";

  if (isAppointmentReminderPreview(content, message?.message_type)) {
    return "Appointment Reminder";
  }

  if (isVideoCallPreview(content)) {
    return "Video Call Invite";
  }

  return content;
};

export const buildVideoCallInviteMessage = (roomId: string) =>
  `${VIDEO_CALL_PREFIX} ${roomId}`;
