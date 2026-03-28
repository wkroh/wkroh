import { useState, useEffect } from "react";
import { checkIsOwner } from "@/lib/forumApi";

export function useIpCheck() {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIsOwner()
      .then((data) => setIsOwner(data.isOwner))
      .catch(() => setIsOwner(false))
      .finally(() => setLoading(false));
  }, []);

  return { isOwner, loading };
}
