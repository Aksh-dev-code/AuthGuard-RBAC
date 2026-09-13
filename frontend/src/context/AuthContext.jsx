import {
  createContext,
  useContext,
  useState,
} from "react";

import api from "../api/client";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {

    try {

      return (
        JSON.parse(
          localStorage.getItem("authUser")
        ) || null
      );

    } catch {

      return null;
    }
  });


  const [loading, setLoading] =
    useState(false);


  /*
   * Login
   */
  async function login(email, password) {

    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );


    const data = response.data;


    const token =
      data.token ||
      data.accessToken ||
      data.data?.token;


    const loggedInUser =
      data.user ||
      data.data?.user;


    if (!token) {

      throw new Error(
        "Login succeeded but no token was returned."
      );
    }


    localStorage.setItem(
      "accessToken",
      token
    );


    if (loggedInUser) {

      localStorage.setItem(
        "authUser",
        JSON.stringify(loggedInUser)
      );

      setUser(loggedInUser);
    }


    return data;
  }


  /*
   * Logout
   */
  function logout() {

    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "authUser"
    );

    setUser(null);
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  return useContext(
    AuthContext
  );
}