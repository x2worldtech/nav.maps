import {
  Building2,
  Coffee,
  Hotel,
  Landmark,
  ShoppingBag,
  Utensils,
} from "lucide-react";

// Frankfurt am Main center coordinates
export const FRANKFURT_CENTER = {
  lat: 50.1109,
  lng: 8.6821,
};

// Place categories for Overpass API
export const PLACE_CATEGORIES = [
  { type: "restaurant", label: "Restaurant", icon: Utensils },
  { type: "museum", label: "Museum", icon: Landmark },
  { type: "shopping_mall", label: "Shopping", icon: ShoppingBag },
  { type: "cafe", label: "Café", icon: Coffee },
  { type: "lodging", label: "Hotel", icon: Hotel },
  { type: "bank", label: "Bank", icon: Building2 },
];

// Famous Frankfurt landmarks
export const FRANKFURT_LANDMARKS = [
  {
    name: "Römer",
    position: { lat: 50.1106, lng: 8.6822 },
    description: "Historisches Rathaus von Frankfurt",
  },
  {
    name: "Commerzbank Tower",
    position: { lat: 50.1127, lng: 8.6719 },
    description: "Eines der höchsten Gebäude Europas",
  },
  {
    name: "Main Tower",
    position: { lat: 50.1122, lng: 8.6719 },
    description: "Aussichtsplattform mit Panoramablick",
  },
  {
    name: "Alte Oper",
    position: { lat: 50.1158, lng: 8.6708 },
    description: "Historisches Konzerthaus",
  },
  {
    name: "Palmengarten",
    position: { lat: 50.1231, lng: 8.6603 },
    description: "Botanischer Garten",
  },
];
