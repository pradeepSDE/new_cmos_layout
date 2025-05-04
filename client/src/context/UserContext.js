import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext({ user: null, setUser: () => {} });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user profile on mount
    axios
      .get("http://localhost:5000/auth/profile", { withCredentials: true })
      .then((res) => {
        if (res.data && res.data.email) {
          setUser({ name: res.data.name, email: res.data.email });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
