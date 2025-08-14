export default function HeroSection(){
  return (
      <section className=" bg-gradient-to-r from-blue-800 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-bold text-5xl md:text-6xl mb-6">Your Future, Our Support</h1>
          <p className="font-body text-xl md:text-2xl mb-8 text-blue-100">
            Find and apply for scholarships that match your dreams.
          </p>
          <button className=" bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-emerald-700 transition-colors">
            Explore Scholarships
          </button>
        </div>
      </section>
  )
}