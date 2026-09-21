import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ShieldCheck,
  Mail,
  LockKeyhole,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";


export default function Login() {

  const {
    user,
    login,
  } = useAuth();


  const navigate =
    useNavigate();

  const location =
    useLocation();


  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);


  if (user) {

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  async function handleSubmit(event) {

    event.preventDefault();

    setError("");

    setSubmitting(true);

    try {

      await login(
        email,
        password
      );


      navigate(
        location.state?.from?.pathname ||
        "/",
        {
          replace: true,
        }
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        error.message ||
        "Invalid credentials."
      );

    } finally {

      setSubmitting(false);
    }
  }


  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          <ShieldCheck size={30} />
        </div>


        <h1>
          Welcome back
        </h1>


        <p className="auth-subtitle">
          Sign in to your AuthGuard dashboard
        </p>


        {error && (

          <div className="alert error">
            {error}
          </div>

        )}


        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          <label>
            Email
          </label>


          <div className="input-icon">

            <Mail size={18} />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="admin@example.com"
              required
            />

          </div>


          <label>
            Password
          </label>


          <div className="input-icon">

            <LockKeyhole size={18} />

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="••••••••"
              required
            />

          </div>


          <button
            className="primary-button full"
            disabled={submitting}
          >

            {
              submitting
                ? "Signing in..."
                : "Sign in"
            }

          </button>

        </form>
        <p className="auth-footer-link">
          Don&apos;t have an account? <a href="/register">Create one</a>
        </p>

      </div>

    </div>
  );
}