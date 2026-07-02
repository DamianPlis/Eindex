import { useEffect, useState } from "react";
import s from "./Toast.module.css";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = "error",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [prevIsVisible, setPrevIsVisible] = useState(isVisible);

  if (isVisible !== prevIsVisible) {
    setPrevIsVisible(isVisible);
    if (isVisible) {
      setIsExiting(false);
    }
  }

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 280); // Wait for exit animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 280);
  };

  if (!isVisible && !isExiting) return null;

  return (
    <div
      className={`${s.toast} ${s[type]} ${isExiting ? s.exiting : ""}`}
      onClick={handleClose}
    >
      <span className={s.icon}>
        {type === "error" ? "✕" : type === "success" ? "✓" : "ℹ"}
      </span>
      <span className={s.message}>{message}</span>
    </div>
  );
}
