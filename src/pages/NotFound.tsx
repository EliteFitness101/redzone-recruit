import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("[route-fallback]", location.pathname);
  }, [location.pathname]);

  return <Navigate to="/" replace state={{ from: location.pathname }} />;
};

export default NotFound;
