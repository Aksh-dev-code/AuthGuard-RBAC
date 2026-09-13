import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute() {

  const { user } = useAuth();

  const location =
    useLocation();


  const token =
    localStorage.getItem(
      "accessToken"
    );


  if (!user && !token) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }


  return <Outlet />;
}