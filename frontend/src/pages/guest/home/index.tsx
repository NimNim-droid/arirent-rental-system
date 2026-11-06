import { useState } from "react";

import { Header } from "@/components/common/Header";
import { Homes } from "@/components/ui/homes";
import { Footer } from "@/components/common/Footer";

export default function Homepage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-app flex flex-col overflow-x-hidden">
      {/* NAVBAR */}
      <Header />
      {/* HERO SECTION */}
      <Homes />
      {/* FOOTER */}
      <Footer />
    </div>
  );
}
