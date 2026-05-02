"use client";

import React, { useState } from "react";
import Image from "next/image";
import api, { persistAuthToken } from "../lib/api";

const initialForm = {
  username: "",
  email: "",
  password: "",
};

const Login = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const endpoint = isRegister ? "/register" : "/login";
      const payload = isRegister
        ? {
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const res = await api.post(endpoint, payload);
      const token = res.data?.token?.trim();

      if (!token) {
        throw new Error("Authentication token missing from the server response.");
      }

      persistAuthToken(token);
      onAuthSuccess?.(res.data.user);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          requestError?.message ||
          "Authentication failed. Check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#cbd5e1_100%)] px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-300/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-3">
            <Image src="/ailogo.png" alt="ChatAI logo" width={26} height={26} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              ChatAI
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isRegister ? "Create account" : "Sign in"}
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Use the browser form below so the API can create your session and
          protect your routes.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
          <button
            type="button"
            className={`rounded-xl px-4 py-2 transition ${
              !isRegister ? "bg-white text-slate-900 shadow-sm" : ""
            }`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2 transition ${
              isRegister ? "bg-white text-slate-900 shadow-sm" : ""
            }`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <label className="block text-sm text-slate-700">
              Username
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
                name="username"
                value={form.username}
                onChange={updateField}
                placeholder="Ada"
                required
              />
            </label>
          ) : null}

          <label className="block text-sm text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block text-sm text-slate-700">
            Password
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="••••••••"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {submitting
              ? "Please wait..."
              : isRegister
              ? "Create account"
              : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
