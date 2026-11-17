import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  GraduationCap,
  MapPin,
  Music2,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import {
  event,
  eventDate,
  dateParts,
  calendarUrl,
  googleCalendarUrl,
} from "./event";
import Guestbook from "./Guestbook";
import { downloadInvitation } from "./invitation-download";
import "./invitation-actions.css";

const slides = [
  "Giới Thiệu",
  "Thời Gian",
  "Thư Cảm Ơn",
  "Lễ chính thức",
];

function Portrait({ compact = false }) {
  const [broken, setBroken] = useState(false);
  const hasImage = Boolean(event.portrait && !broken);

  return (
    <div className={`portrait-card ${compact ? "compact" : ""}`}>
      {hasImage ? (
        <img
          src={event.portrait}
          alt={`Ảnh tốt nghiệp của ${event.name}`}
          style={{ objectPosition: event.portraitPosition }}
          onError={() => setBroken(true)}
          draggable="false"
        />
      ) : (
        <>
          <div className="portrait-placeholder">
            <div className="portrait-halo" />
            <GraduationCap size={95} strokeWidth={0.7} />
            <span>ẢNH TỐT NGHIỆP</span>
            <small>Thêm ảnh của bạn tại src/event.js</small>
          </div>
          <div className="portrait-shade" />
          <div className="portrait-caption">
            <span>{event.degree}</span>
            <h3>{event.name}</h3>
            <p>{event.portraitCaption}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = eventDate
    ? Math.max(0, Math.floor((eventDate.getTime() - now) / 1000))
    : null;
  const values =
    remaining === null
      ? ["—", "—", "—", "—"]
      : [
          Math.floor(remaining / 86400),
          Math.floor(remaining / 3600) % 24,
          Math.floor(remaining / 60) % 60,
          remaining % 60,
        ];
  return (
    <div className="countdown-block">
      <span>
        {remaining === null
          ? "✦ Cùng chờ đón ngày đặc biệt ✦"
          : remaining === 0
            ? "✦ Ngày đặc biệt đã đến ✦"
            : "✦ Thời Gian Đếm Ngược Đến Ngày Tốt Nghiệp ✦"}
      </span>
      <div
        className="countdown"
        aria-label={
          remaining === null
            ? "Chưa đặt ngày tổ chức"
            : `Còn ${values[0]} ngày ${values[1]} giờ ${values[2]} phút ${values[3]} giây`
        }
      >
        {values.map((value, index) => (
          <div key={index}>
            <strong>
              {typeof value === "number"
                ? String(value).padStart(2, "0")
                : value}
            </strong>
            <small>{["NGÀY", "GIỜ", "PHÚT", "GIÂY"][index]}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarLink() {
  const chooser = useRef(null);
  return (
    <details
      className="calendar-chooser"
      ref={chooser}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          chooser.current.open = false;
          chooser.current.querySelector("summary").focus();
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) chooser.current.open = false;
      }}
    >
      <summary className="button outline"><CalendarPlus size={14} /> Lưu vào lịch</summary>
      <div className="calendar-options">
        <strong>Hẹn bạn ngày {dateParts.full}</strong>
        <span>{dateParts.time} · Giờ Việt Nam</span>
        <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer" onClick={() => { chooser.current.open = false; }}>
          <Plus size={15} /><span>Google Calendar<small>Mở lịch Google để xác nhận lưu</small></span><ArrowRight size={14} />
        </a>
        <a href={calendarUrl} download="le-tot-nghiep-25-11-2026.ics" onClick={() => { chooser.current.open = false; }}>
          <Download size={15} /><span>Apple Calendar / Outlook<small>Tải file .ics, mở để thêm vào lịch</small></span><ArrowRight size={14} />
        </a>
      </div>
    </details>
  );
}

function DownloadButton({ guestName }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await downloadInvitation(guestName);
    } catch (cause) {
      setError(cause.message || "Chưa tải được thiệp. Bạn thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="invitation-download">
      <button className="button outline" onClick={download} disabled={busy} aria-busy={busy} aria-label={busy ? "Đang tạo thiệp" : "Tải thiệp"} title="Tải thiệp PNG cá nhân hóa · 2000 × 2800">
        <Download size={12} /><span>{busy ? "Đang tạo thiệp…" : "Tải Thiệp"}</span>
      </button>
      {error && <p className="download-error" role="alert">{error}</p>}
    </div>
  );
}

function Invitation({ navigate, guestName }) {
  return (
    <div className="invitation-layout">
      <article className="invitation-card">
        <span className="invitation-ornament">— — ✦ — —</span>
        <h2>THÂN MỜI</h2>
        <div className="invitation-recipient">
          <strong>{guestName || "Bạn thân mến"}</strong>
          <p>Đến chung vui trong ngày lễ tốt nghiệp của</p>
        </div>
        <h3 className="name-badge">{event.name}</h3>
        <span className="time-badge">
          <Clock3 size={11} /> {dateParts.time}
          {dateParts.weekday && `, ${dateParts.weekday}`}
        </span>
        <div className="date-grid">
          {[
            ["NGÀY", dateParts.day],
            ["THÁNG", dateParts.month],
            ["NĂM", dateParts.year],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <Countdown />
        <div className="venue-box">
          <span>TẠI ĐIỂM</span>
          {event.venue && <h4>{event.venue}</h4>}
          <strong>{event.school}</strong>
          <p>{event.address}</p>
        </div>
        {event.mapUrl ? (
          <a
            href={event.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button gold map-button"
          >
            <MapPin size={13} /> XEM CHỈ ĐƯỜNG ĐẾN BUỔI LỄ
          </a>
        ) : (
          <span className="location-pending">
            <MapPin size={12} /> Đường đi sẽ được cập nhật
          </span>
        )}
        <div className="invitation-contact">
          {event.phone && (
            <a
              href={`tel:${event.phone}`}
              className="button light-outline"
            >
              Hotline: {event.phone}
            </a>
          )}
          {event.zaloUrl && (
            <a
              href={event.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button light-outline"
            >
              Zalo
            </a>
          )}
          {event.facebookUrl && (
            <a
              href={event.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button light-outline"
            >
              Facebook
            </a>
          )}
          {!event.facebookUrl && !event.zaloUrl && !event.phone && (
            <span>Sự hiện diện của bạn là niềm vinh hạnh của mình.</span>
          )}
        </div>
      </article>
      <div className="invitation-portrait">
        <Portrait compact />
        <button className="button gold" onClick={() => navigate(2)}>
          ĐỌC THƯ CẢM ƠN CỦA MÌNH <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}


function Ticker({ bottom = false, paused = false }) {
  const text = bottom
    ? `✦ ${event.school.toUpperCase()} ✦ SỰ HIỆN DIỆN CỦA BẠN LÀ NIỀM VINH HẠNH CỦA MÌNH`
    : `✦ ĐẾM NGƯỢC THỜI GIAN LỄ TỐT NGHIỆP ✦ ${dateParts.time.toUpperCase()} · ${dateParts.full.toUpperCase()} ✦ ${event.school.toUpperCase()}`;
  return (
    <div
      className={`ticker ${bottom ? "ticker-bottom" : ""} ${paused ? "ticker-paused" : ""}`}
      aria-hidden="true"
    >
      <div className="ticker-track">
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}

export default function App({ guestName, music }) {
  const theme = "editorial";
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [autoPlay, setAutoPlay] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(!document.hidden);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { playing, toggle, error: musicError } = music;
  const touch = useRef(null);
  const stage = useRef(null);
  const navigate = useCallback((index) => {
    setActive((index + slides.length) % slides.length);
    stage.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReducedMotion(query.matches);
      if (query.matches) setAutoPlay(false);
    };
    const visibility = () => setVisible(!document.hidden);
    query.addEventListener("change", change);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      query.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (
      !autoPlay ||
      reducedMotion ||
      !visible ||
      focusWithin ||
      hovered ||
      active === 3
    )
      return;
    const timer = setTimeout(
      () => navigate(active + 1),
      Math.max(4000, event.autoPlayMs),
    );
    return () => clearTimeout(timer);
  }, [
    autoPlay,
    reducedMotion,
    visible,
    focusWithin,
    hovered,
    active,
    navigate,
  ]);
  useEffect(() => {
    const keydown = (e) => {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.target.closest('input,textarea,button,a,[contenteditable="true"]')
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(active + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(active - 1);
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [active, navigate]);

  function swipeEnd(e) {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x,
      dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.6)
      navigate(active + (dx < 0 ? 1 : -1));
    touch.current = null;
  }
  return (
    <div className={`invitation-app theme-${theme}`}>
      <a className="skip-link" href="#carousel">
        Đến nội dung thiệp
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate(0)}
            aria-label="Về giới thiệu"
          >
            <span className="brand-icon">
              <GraduationCap size={22} strokeWidth={1.2} />
            </span>
            <span className="brand-text">
              <span className="brand-top">
                <strong>{event.schoolShort}</strong>
                <small>{event.cohort}</small>
              </span>
              <span className="brand-degree">{event.degreeEnglish}</span>
              <span className="brand-name">
                Thiệp Mời: {event.name.toUpperCase()}
              </span>
            </span>
          </button>
          <nav className="top-navigation" aria-label="Các trang thiệp">
            {slides.map((title, i) => (
              <button
                key={title}
                data-slide-index={i}
                className={active === i ? "active" : ""}
                aria-current={active === i ? "page" : undefined}
                onClick={() => navigate(i)}
              >
                {title}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="button outline"
              onClick={toggle}
              aria-pressed={playing}
              aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
            >
              {playing ? <Pause size={12} /> : <Music2 size={12} />}
              <span>Nhạc</span>
            </button>
            <DownloadButton guestName={guestName} />
            <button className="button outline" onClick={() => navigate(3)}>
              <span>✦</span> Chúc Mừng
            </button>
          </div>
        </div>
      </header>
      <Ticker paused={!autoPlay || reducedMotion} />
      <main
        id="carousel"
        ref={stage}
        className="carousel-stage"
        role="region"
        aria-roledescription="carousel"
        aria-label="Thiệp mời tốt nghiệp"
        tabIndex={0}
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocusWithin(false);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={(e) => {
          if (
            e.target.closest(
              "button,a,input,textarea,.letter-card,.page-message",
            )
          )
            return;
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={swipeEnd}
        onTouchCancel={() => {
          touch.current = null;
        }}
      >
        <section
          className="slide intro-slide"
          hidden={active !== 0}
          aria-roledescription="slide"
          aria-label="1 trên 4: Giới thiệu"
        >
          <div className="intro-layout">
            <div className="intro-copy">
              <span className="eyebrow">{event.school}</span>
              <span className="intro-ornament">✦ ───────── ✦</span>
              <h2>Lễ tốt nghiệp</h2>
              <h1>{event.name}</h1>
              <h3>TÂN {event.degree}</h3>
              <p className="intro-cohort">
                KHÓA {event.cohort} · {event.schoolShort}
              </p>
              <blockquote>“{event.quote}”</blockquote>
              <div className="intro-invitation">
                <span>TRÂN TRỌNG KÍNH MỜI</span>
                <strong>{guestName || "Bạn thân mến"}</strong>
                <p>Cùng mình lưu giữ khoảnh khắc đặc biệt này.</p>
              </div>
              <div className="intro-actions">
                <button className="button gold" onClick={() => navigate(1)}>
                  MỞ THIỆP MỜI <ArrowRight size={14} />
                </button>
                <CalendarLink />
              </div>
              <code>{event.signature}</code>
            </div>
            <Portrait />
          </div>
        </section>
        <section
          className="slide invitation-slide"
          hidden={active !== 1}
          aria-roledescription="slide"
          aria-label="2 trên 4: Thời gian và đếm ngược"
        >
          <Invitation navigate={navigate} guestName={guestName} />
        </section>
        <section
          className="slide gratitude-slide"
          hidden={active !== 2}
          aria-roledescription="slide"
          aria-label="3 trên 4: Thư cảm ơn"
        >
          <div className="gratitude-layout">
            <article
              className="letter-card"
              tabIndex={0}
              aria-label="Thư cảm ơn"
            >
              <span className="eyebrow">MỘT CHẶNG ĐƯỜNG · NGÀN LỜI TRI ÂN</span>
              <h2>Thư cảm ơn</h2>
              <h3>
                {event.cohort} | {event.letterTitle}
              </h3>
              {event.letter.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <div className="letter-signature">
                Với tất cả lòng biết ơn,<strong>{event.name}</strong>
              </div>
            </article>
            <button className="button outline gratitude-action" onClick={() => navigate(3)}>
              Gửi lời chúc <ArrowRight size={13} />
            </button>
          </div>
        </section>
        <section
          className="slide ceremony-slide"
          hidden={active !== 3}
          aria-roledescription="slide"
          aria-label="4 trên 4: Lễ chính thức"
        >
          <Guestbook />
        </section>
      </main>
      <Ticker bottom paused={!autoPlay || reducedMotion} />
      <footer className="carousel-footer">
        <div className="footer-summary">
          <strong>{event.school}</strong>
          <span>Lễ Tốt Nghiệp {event.degree}</span>
          <span>
            <b>{event.name}</b> · KHÓA {event.cohort}
          </span>
        </div>
        <nav className="bottom-navigation" aria-label="Chọn trang">
          {slides.map((title, i) => (
            <button
              key={title}
              className={active === i ? "active" : ""}
              aria-current={active === i ? "page" : undefined}
              onClick={() => navigate(i)}
            >
              <span>{i + 1}.</span> {title}
            </button>
          ))}
        </nav>
        <div className="carousel-controls">
          <button
            className="autoplay-button"
            onClick={() => setAutoPlay(!autoPlay)}
            aria-pressed={autoPlay}
            disabled={reducedMotion}
            title={
              reducedMotion
                ? "Đã tắt chuyển động theo cài đặt thiết bị"
                : active === 3
                  ? "Tự chuyển tạm dừng khi đọc hoặc viết lời chúc"
                  : "Tạm dừng khi đưa chuột vào nội dung hoặc dùng bàn phím"
            }
          >
            {autoPlay ? <Pause size={11} /> : <Play size={11} />}
            <span>{autoPlay ? "Dừng tự chuyển" : "Bật tự chuyển"}</span>
          </button>
          <button
            className="icon-button"
            aria-label="Trang trước"
            onClick={() => navigate(active - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="icon-button"
            aria-label="Trang sau"
            onClick={() => navigate(active + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </footer>
      <span
        className="sr-only"
        role="status"
        aria-live={autoPlay ? "off" : "polite"}
      >
        Trang {active + 1} trên 4: {slides[active]}
      </span>
      {musicError && (
        <div className="music-error" role="alert">
          {musicError}
        </div>
      )}
    </div>
  );
}
