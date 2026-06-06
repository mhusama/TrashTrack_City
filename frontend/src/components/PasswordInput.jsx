import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  initialVisible = false,
}) {
  const [visible, setVisible] = useState(initialVisible);

  const handleFocus = (event) => {
    const input = event.currentTarget;
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        input.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 320);
    });
  };

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
        onFocus={handleFocus}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="password-input-field input-field"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setVisible((show) => !show)}
        className="password-input-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </button>
    </div>
  );
}
