import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import MapPage from "./pages/MapPage";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MapPage />
      <Toaster />
    </ThemeProvider>
  );
}
