import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Features from "../components/Features";
import ListingSection from "../components/ListingSection";
import Footer from "../components/Footer";
export default function Home(){
  return (
    <div>
            <Navbar />
            <HeroSection />
            <Features />
            <ListingSection />
            <Footer />
    </div>
  )
}