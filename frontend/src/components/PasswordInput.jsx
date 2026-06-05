import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import useIsMobile from "../hooks/useIsMobile.js";

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  required = false,
  minLength,
  autoComplete,
  placeholder,
  className = "",
  initialVisible,
}) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(
    initialVisible ?? isMobile
  );

  return (
    <div className={`password-input-wrap ${className}`}>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="password-input-field input-field"
      />
      <button
        type="button"
        onClick={() => setVisible((show) => !show)}
        className="password-input-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
