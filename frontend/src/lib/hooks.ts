import { useEffect, useState } from "react";

export function useFakeLoading(duration = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), duration);
    return () => clearTimeout(timeout);
  }, [duration]);
  return loading;
}