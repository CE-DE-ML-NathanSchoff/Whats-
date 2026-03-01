function Splash() {
  return (
    <div className="relative w-[360px] h-[640px] bg-[#F7F7F7] overflow-hidden">

      {/* App name */}
      <span
        className="absolute left-[99px] top-[294px] text-[34px] leading-[51px] font-bold text-[#1BBC65]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Communitree🌱
      </span>

      {/* Loading spinner */}
      <div className="absolute left-1/2 top-[370px] -translate-x-1/2 w-8 h-8 rounded-full border-4 border-[#1BBC65]/30 border-t-[#1BBC65] animate-spin" />

      {/* Ellipse 4 — dark left */}
      <div className="absolute w-[203px] h-[161px] left-[-52px] top-[606px] bg-[#0B8543] rounded-full" />

      {/* Ellipse 5 — dark right */}
      <div className="absolute w-[236px] h-[161px] left-[151px] top-[614px] bg-[#0B8543] rounded-full" />

      {/* Ellipse 6 — light center (on top) */}
      <div className="absolute w-[236px] h-[161px] left-[60px] top-[583px] bg-[#1BBC65] rounded-full" />

    </div>
  )
}

export default Splash
