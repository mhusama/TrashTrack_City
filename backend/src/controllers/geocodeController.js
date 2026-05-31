function extractHoldingNumber(address, extratags, displayName) {
  const fromTags = [
    extratags?.["addr:holding"],
    extratags?.["addr:housenumber"],
    address?.house_number,
    address?.house,
  ];

  for (const value of fromTags) {
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  const sources = [displayName, address?.road, address?.street].filter(Boolean);
  for (const text of sources) {
    const match = String(text).match(
      /\b(?:holding|plot|house|building)\s*[#:.\-]?\s*(\d+[a-z0-9\/\-]*)/i
    );
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractAvenueNumber(address, extratags) {
  const roadTexts = [
    extratags?.["addr:street"],
    address?.road,
    address?.street,
    address?.pedestrian,
  ].filter(Boolean);

  for (const text of roadTexts) {
    const value = String(text).trim();
    const patterns = [
      /\b(?:avenue|ave\.?)\s*[#:.\-]?\s*(\d+[a-z]?)/i,
      /\b(\d+[a-z]?)\s*(?:no\.?\s*)?(?:avenue|ave\.?)\b/i,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) {
        return match[1];
      }
    }

    if (/\bavenue\b/i.test(value)) {
      const number = value.match(/\d+[a-z]?/i);
      if (number) {
        return number[0];
      }
    }
  }

  return null;
}

function extractStreetNumber(address, extratags, holdingNumber) {
  const candidates = [extratags?.["addr:streetnumber"], address?.house_number];

  for (const value of candidates) {
    const normalized = value != null ? String(value).trim() : "";
    if (normalized && normalized !== holdingNumber) {
      return normalized;
    }
  }

  return null;
}

function formatAddress(data) {
  const a = data.address || {};
  const extratags = data.extratags || {};
  const lines = [];

  const push = (label, value) => {
    if (value != null && String(value).trim()) {
      lines.push({ label, value: String(value).trim() });
    }
  };

  const holdingNumber = extractHoldingNumber(a, extratags, data.display_name);
  const avenueNumber = extractAvenueNumber(a, extratags);
  const streetNumber = extractStreetNumber(a, extratags, holdingNumber);

  push("Holding no.", holdingNumber);
  push("Avenue no.", avenueNumber);
  push("Street no.", streetNumber);
  push("Road", a.road || a.footway || a.pedestrian || a.path || extratags["addr:street"]);
  push("Block", a.quarter || a.hamlet);
  push("Area", a.neighbourhood || a.suburb || a.residential);
  push("Ward", a.city_district || a.district);
  push("City", a.city || a.town || a.municipality);
  push("Postcode", a.postcode);
  push("Division", a.state || a.region);

  if (lines.length === 0 && data.display_name) {
    lines.push({ label: "Address", value: data.display_name });
  }

  return { lines, displayName: data.display_name || "" };
}

function buildAddressText(lines, displayName) {
  const order = ["Road", "Block", "Area", "Ward", "City", "Postcode"];
  const parts = [];

  for (const label of order) {
    const line = lines.find((entry) => entry.label === label);
    if (line) {
      parts.push(line.value);
    }
  }

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return displayName || "";
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isLandmarkLike(tags = {}, name = "") {
  if (
    tags.amenity ||
    tags.public_transport ||
    tags.shop ||
    tags.tourism ||
    tags.historic ||
    tags.leisure ||
    tags.railway ||
    tags.bus ||
    tags.hospital ||
    tags.school ||
    tags.university ||
    tags.marketplace ||
    tags.building === "yes"
  ) {
    return true;
  }

  return /stand|mosque|market|school|college|hospital|park|bazaar|gate|bridge|station|bus|terminal|madrasa|masjid|bazar|ghat|square|intersection|crossing/i.test(
    name
  );
}

function formatLandmark(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return /^near\s/i.test(trimmed) ? trimmed : `Near ${trimmed}`;
}

function landmarkFromReverseData(data) {
  const name = data.name?.trim();
  const landmarkClasses = new Set([
    "amenity",
    "shop",
    "tourism",
    "historic",
    "public_transport",
    "building",
    "leisure",
    "railway",
    "aeroway",
  ]);

  if (name && landmarkClasses.has(data.class) && isLandmarkLike(data.extratags || {}, name)) {
    return formatLandmark(name);
  }

  const address = data.address || {};
  const poiLabel =
    address.amenity ||
    address.shop ||
    address.tourism ||
    address.public_transport ||
    address.building;

  if (poiLabel && name) {
    return formatLandmark(name);
  }

  return "";
}

async function findNearbyLandmark(lat, lng, excludeName = "") {
  const query = `[out:json][timeout:8];
(
  node(around:450,${lat},${lng})["name"];
  way(around:450,${lat},${lng})["name"];
);
out center 15;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      return "";
    }

    const payload = await response.json();
    const candidates = (payload.elements || [])
      .map((element) => {
        const name = element.tags?.name?.trim();
        if (!name) return null;
        if (excludeName && name.toLowerCase() === excludeName.toLowerCase()) {
          return null;
        }
        if (!isLandmarkLike(element.tags || {}, name)) {
          return null;
        }

        const pointLat = element.lat ?? element.center?.lat;
        const pointLng = element.lon ?? element.center?.lon;
        if (pointLat == null || pointLng == null) {
          return null;
        }

        return {
          name,
          distance: haversineMeters(lat, lng, pointLat, pointLng),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);

    if (candidates[0]) {
      return formatLandmark(candidates[0].name);
    }
  } catch {
    return "";
  }

  return "";
}

async function resolveLandmark(lat, lng, data) {
  const direct = landmarkFromReverseData(data);
  if (direct) {
    return direct;
  }

  const nearby = await findNearbyLandmark(lat, lng, data.name);
  if (nearby) {
    return nearby;
  }

  const area = data.address?.neighbourhood || data.address?.suburb || data.address?.quarter;
  return area ? formatLandmark(area) : "";
}

export async function reverseGeocode(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "lat and lng query parameters are required" });
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TrashTrackCity/1.0 (waste-reporting-app)",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ message: "Geocoding service unavailable" });
    }

    const data = await response.json();
    const formatted = formatAddress(data);
    const addressText = buildAddressText(formatted.lines, formatted.displayName);
    const landmark = await resolveLandmark(lat, lng, data);

    res.json({
      ...formatted,
      addressText,
      landmark,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
