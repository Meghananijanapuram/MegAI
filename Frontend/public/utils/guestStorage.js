const TEMP_THREADS_KEY = "megai_temp_threads"; 

export const clearGuestChats = () => {
  localStorage.removeItem(TEMP_THREADS_KEY);
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("megai_temp_chat_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};
