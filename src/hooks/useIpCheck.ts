import { useState, useEffect } from "react";

const ALLOWED_IP = "82.167.220.64";

export function useIpCheck() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        setIsOwner(data.ip === ALLOWED_IP);
      })
      .catch(() => setIsOwner(false))
      .finally(() => setLoading(false));
  }, []);

  return { isOwner, loading };
}
