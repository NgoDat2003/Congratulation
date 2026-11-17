import { useEffect, useState } from "react";
import { GraduationCap, Mail, Sparkle } from "lucide-react";
import App from "./App";
import { event, dateParts } from "./event";
import { useMusic } from "./useMusic";
import "./invitation-entry.css";

export default function InvitationEntry() {
  const [phase, setPhase] = useState("closed");
  const music = useMusic();
  // Gửi link riêng cho từng người: ?to=Minh%20Anh
  const [guestName] = useState(
    () => new URLSearchParams(window.location.search).get("to")?.trim() || "",
  );

  useEffect(() => {
    if (phase === "opened") {
      document.getElementById("carousel")?.focus({ preventScroll: true });
      return;
    }
    if (phase !== "opening") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setPhase("opened"), reducedMotion ? 200 : 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  function openInvitation() {
    // Phát trong thao tác mở thiệp để trình duyệt cho phép âm thanh.
    void music.toggle();
    setPhase("opening");
  }

  if (phase === "opened") return <App guestName={guestName} music={music} />;

  const opening = phase === "opening";
  return (
    <main className={`invitation-entry${opening ? " is-opening" : ""}`} aria-labelledby="entry-title">
      {opening && (
        <div className="entry-confetti" aria-hidden="true">
          {Array.from({ length: 32 }, (_, index) => (
            <i key={index} style={{
              "--left": `${(index * 37) % 100}%`,
              "--delay": `${(index % 7) * -0.19}s`,
              "--drift": `${((index % 5) - 2) * 35}px`,
              "--confetti-color": ["#ffd65a", "#e77eb9", "#78b8f2", "#b69af0", "#fff5ce"][index % 5],
            }} />
          ))}
        </div>
      )}
      <header className="entry-heading">
        <p className="entry-kicker">{event.schoolShort} · CLASS OF {dateParts.year}</p>
        <h1 id="entry-title">Một lời mời đặc biệt</h1>
        <div className="entry-recipient">
          <span>TRÂN TRỌNG KÍNH MỜI</span>
          <strong>{guestName || "Bạn thân mến"}</strong>
          <p>Người đã làm nên một phần thanh xuân của mình.</p>
        </div>
      </header>
      <div className="entry-envelope" aria-hidden="true">
        <div className="entry-envelope-back" />
        <div className="entry-letter">
          <GraduationCap size={30} strokeWidth={1.4} />
          <span>TRÂN TRỌNG KÍNH MỜI</span>
          <strong>{guestName || "Bạn thân mến"}</strong>
          <p>Đến chung vui lễ tốt nghiệp của</p>
          <em>{event.name}</em>
          <p>{dateParts.time} · {dateParts.full}</p>
        </div>
        <svg className="entry-envelope-front" viewBox="0 0 380 238" preserveAspectRatio="none">
          <defs>
            <linearGradient id="entry-paper" x2="1" y2="1">
              <stop stopColor="#352e29" />
              <stop offset="1" stopColor="#221c18" />
            </linearGradient>
          </defs>
          <path d="M1 1 L190 129 L379 1 V228 Q379 237 370 237 H10 Q1 237 1 228 Z" fill="url(#entry-paper)" stroke="#2A231F" strokeWidth="2" />
        </svg>
        <div className="entry-envelope-flap" />
        <div className="entry-envelope-seal"><Sparkle size={24} fill="currentColor" strokeWidth={1} /></div>
      </div>
      <section className="entry-details" aria-label="Mở thư mời tốt nghiệp">
        <h2>{event.name}</h2>
        <p className="entry-degree">Lễ tốt nghiệp {event.degree}</p>
        <button className="button gold entry-open" onClick={openInvitation} disabled={opening}>
          {!opening && <Mail size={15} />}
          {opening ? "ĐANG MỞ THIỆP…" : "CHẠM ĐỂ MỞ THIỆP"}
        </button>
        <p className="entry-note" role="status">
          {opening ? "Chào mừng bạn đến với ngày đặc biệt của mình." : "Sự hiện diện của bạn là niềm vinh hạnh của mình."}
        </p>
      </section>
    </main>
  );
}
