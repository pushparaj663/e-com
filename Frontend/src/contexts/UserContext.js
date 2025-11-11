import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.get("/auth/me"); // returns logged-in user
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
