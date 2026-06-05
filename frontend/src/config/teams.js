export const TEAM_NAMES = Array.from({ length: 15 }, (_, i) => `Team ${i + 1}`);

export const EXCLUDED_TEAM_KEYS = ["Team Usama"];

export const TEAM_BRAND_NAMES = {
  "Team 1": "Team Agnibina",
  "Team 2": "Team Durbar",
  "Team 3": "Team Bijoy",
  "Team 4": "Team Meghna",
  "Team 5": "Team Shopno",
  "Team 6": "Team Tarunno",
  "Team 7": "Team Prerona",
  "Team 8": "Team Oikko",
  "Team 9": "Team Rupantor",
  "Team 10": "Team Uddog",
  "Team 11": "Team Banglar Alo",
  "Team 12": "Team Shikhor",
  "Team 13": "Team NoboJatra",
  "Team 14": "Team Digonto",
  "Team 15": "Team Prottasha",
};

export function staticTeamDisplayName(teamKey) {
  if (!teamKey) return "—";
  const brand = TEAM_BRAND_NAMES[teamKey];
  return brand ? `${teamKey} – ${brand}` : teamKey;
}

export const CREW_SUB_ROLES = [
  { value: "team_leader", label: "Team Leader" },
  { value: "team_member", label: "Team Member" },
];
