const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(len) {
  let s = "";
  for (let i = 0; i < len; i += 1) {
    s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return s;
}

/** 8 characters: RS + 6 alphanumeric. */
export function generateResidentIdCandidate() {
  return `RS${randomChars(6)}`.toUpperCase();
}

/** Prefix T{teamNo} from `Team 5` etc., then pad to length 8. */
export function teamIdPrefixFromTeamName(teamName) {
  const m = /^Team (\d+)$/i.exec(String(teamName || "").trim());
  if (!m) return "TX";
  return `T${m[1]}`.toUpperCase();
}

export function generateTeamIdCandidate(teamName) {
  const prefix = teamIdPrefixFromTeamName(teamName);
  const suffixLen = Math.max(0, 8 - prefix.length);
  return `${prefix}${randomChars(suffixLen)}`.toUpperCase();
}
