import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";

// Classes the signed-in user may see (the server decides: all / assigned / own).
export function useClasses(enabled = true) {
  const [classes, setClasses] = useState([]);
  const [state, setState] = useState(enabled ? "loading" : "ready");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.get("/classes");
      setClasses(res.data.classes);
      setState("ready");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load classes."));
      setState("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    if (enabled) load();
  }, [enabled, load]);

  return { classes, state, error, reload: load };
}

// Remembers the last class used, so nobody has to pick it again.
export function useSelectedClass(classes) {
  const [id, setId] = useState(() => Number(localStorage.getItem("lastClassId")) || null);
  const selected = classes.find((c) => c.id === id) || classes[0] || null;
  const select = (classId) => {
    localStorage.setItem("lastClassId", String(classId));
    setId(classId);
  };
  return [selected, select];
}