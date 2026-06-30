import { NextResponse } from "next/server";

const reverseAddressEndpoint = "https://nominatim.openstreetmap.org/reverse";
const reverseAddressTimeoutMs = 7000;

type NominatimAddress = Record<string, string | undefined>;

type NominatimReverseResponse = {
  address?: NominatimAddress;
  display_name?: string;
};

function normalizeAddressPart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactAddressParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const normalized = normalizeAddressPart(part);

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .join(", ");
}

function cityFrom(address: NominatimAddress) {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    null
  );
}

function structuredAddressFrom(address: NominatimAddress | undefined) {
  if (!address) {
    return null;
  }

  const street = [
    address.road ??
      address.pedestrian ??
      address.footway ??
      address.path ??
      address.cycleway ??
      null,
    address.house_number,
  ]
    .filter(Boolean)
    .join(" ");
  const place =
    street ||
    address.amenity ||
    address.building ||
    address.tourism ||
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    null;
  const city = cityFrom(address);
  const postcodeAndCity = [address.postcode, city].filter(Boolean).join(" ");

  return compactAddressParts([place, postcodeAndCity, address.country]);
}

function validCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));

  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) {
    return NextResponse.json({ address: null }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), reverseAddressTimeoutMs);
  const params = new URLSearchParams({
    addressdetails: "1",
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
  });

  try {
    const response = await fetch(`${reverseAddressEndpoint}?${params.toString()}`, {
      headers: {
        accept: "application/json",
        "user-agent": "where2find4you-web/1.0",
      },
      next: { revalidate: 604800 },
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json({ address: null });
    }

    const data = (await response.json()) as NominatimReverseResponse;
    const address = structuredAddressFrom(data.address) || data.display_name || null;

    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ address: null });
  } finally {
    clearTimeout(timeout);
  }
}
