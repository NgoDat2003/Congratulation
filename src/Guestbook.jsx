import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { event, dateParts } from "./event";

const formatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});
async function request(url, options) {
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Chưa kết nối được sổ lưu bút. Vui lòng thử lại.");
  }
  if (!response.ok)
    throw new Error(data.error || "Không thể tải lời chúc. Bạn thử lại nhé.");
  return data;
}

export default function Guestbook() {
  const [wishes, setWishes] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showBook, setShowBook] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    request("/api/wishes", { signal: controller.signal })
      .then((data) => {
        setWishes(data.wishes);
        setTotal(data.total);
        setHasMore(data.hasMore);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function load(next = false) {
    if (loading) return;
    setLoading(true);
    setLoadError("");
    try {
      const cursor = next && wishes.length ? `?before=${wishes.at(-1).id}` : "";
      const data = await request(`/api/wishes${cursor}`);
      if (next) {
        const fresh = data.wishes.filter(
          (wish) => !wishes.some((current) => current.id === wish.id),
        );
        setWishes((current) => [...current, ...fresh]);
        if (fresh.length) setPage(wishes.length);
      } else {
        setWishes(data.wishes);
        setPage(0);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function nextPage() {
    if (page < wishes.length - 1) setPage(page + 1);
    else if (hasMore) load(true);
  }

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setSuccess(false);
    setSubmitError("");
    if (!name.trim() || !message.trim()) {
      setSubmitError("Vui lòng nhập tên và lời chúc của bạn.");
      return;
    }
    setSending(true);
    try {
      const data = await request("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      setWishes((current) => [data.wish, ...current]);
      setTotal((current) => current + 1);
      setPage(0);
      if (showBook) {
        setOpen(true);
      }
      setName("");
      setMessage("");
      setSuccess(true);
    } catch (error) {
      setSubmitError(
        error.message || "Không gửi được lời chúc. Bạn thử lại nhé.",
      );
    } finally {
      setSending(false);
    }
  }
  const wish = wishes[page];
  return (
    <div className={`ceremony-layout ${showBook ? "with-diary" : "form-only"}`}>
      {showBook && (
        <div className="diary-column">
          <div className="diary-top-actions">
            <button
              type="button"
              className="button outline small diary-hide-btn"
              onClick={() => setShowBook(false)}
            >
              <ArrowLeft size={13} /> Ẩn sổ lưu bút (Chỉ để lại form)
            </button>
          </div>
          <div className="diary-heading">
            <span className="eyebrow">THE KEEPSAKE COLLECTION · {dateParts.year}</span>
            <h2>Giữ lại một chút thanh xuân</h2>
            <p>Một cuốn sách nhỏ. Những lời thương còn mãi.</p>
          </div>
          <div className={`diary-book ${open ? "book-is-open" : ""}`}>
            {!open ? (
              <button
                className="book-cover"
                onClick={() => setOpen(true)}
                aria-label="Mở sổ lưu bút tốt nghiệp"
                aria-expanded={false}
              >
                <span className="cover-edition">KỶ NIỆM NGÀY TỐT NGHIỆP</span>
                <span className="cover-emblem"><GraduationCap size={45} strokeWidth={1} /></span>
                <span className="corner corner-top" />
                <span className="corner corner-bottom" />
                <div className="cover-title">
                  <span>THE GRADUATION DIARY</span>
                  <h3>Những năm<br />rực rỡ</h3>
                  <span className="cover-rule" />
                  <strong>{event.name}</strong>
                  <small>{event.cohort}</small>
                </div>
                <span className="cover-open-hint">CHẠM ĐỂ MỞ NHỮNG KỶ NIỆM</span>
              </button>
            ) : (
              <div className="book-spread">
                <aside className="book-dedication" aria-label="Trang đề tặng">
                  <span className="page-eyebrow">LƯU BÚT NGÀY RA TRƯỜNG</span>
                  <div className="dedication-portrait">
                    <GraduationCap size={48} strokeWidth={0.8} />
                    <span>{dateParts.year}</span>
                  </div>
                  <h3>Thanh xuân<br />có bạn.</h3>
                  <p>Có những lời chúc chỉ viết một lần,<br />nhưng sẽ được đọc lại rất nhiều lần.</p>
                  <span className="dedication-signature">{event.name}</span>
                  <span className="page-number">{dateParts.full} · {event.schoolShort}</span>
                </aside>
              <article
                className="book-page"
                key={wish?.id || "empty"}
                aria-live="polite"
                aria-label={`Trang lời chúc ${page + 1}`}
              >
                <span className="page-eyebrow">MỘT TRANG KỶ NIỆM</span>
                <span className="page-ornament">✦</span>
                {wish ? (
                  <>
                    <h3>Gửi {event.name},</h3>
                    <div className="page-message" tabIndex={0} aria-label={`Lời chúc của ${wish.name}`}>{wish.message}</div>
                    <div className="page-signature">
                      <span>Thân mến,</span>
                      <strong>{wish.name}</strong>
                      <time dateTime={wish.createdAt}>
                        {formatter.format(new Date(wish.createdAt))}
                      </time>
                    </div>
                    <span className="page-number">— {page + 1} —</span>
                  </>
                ) : (
                  <div className="book-empty">
                    <BookOpen size={36} strokeWidth={1} />
                    <h3>
                      {loadError
                        ? "Chưa tải được lời chúc"
                        : loading
                          ? "Đang mở sổ lưu bút…"
                          : "Trang đầu tiên dành cho bạn"}
                    </h3>
                    <p>
                      {loadError
                        ? "Thử kết nối lại bằng nút bên dưới nhé."
                        : "Viết một lời chúc để mở đầu cuốn nhật ký này nhé."}
                    </p>
                  </div>
                )}
              </article>
              </div>
            )}
          </div>
          <div className="book-controls">
            <button
              className="icon-button"
              aria-label="Lời chúc trước"
              disabled={!open || page === 0 || loading}
              onClick={() => setPage(page - 1)}
            >
              <ArrowLeft size={15} />
            </button>
            <button className="button gold small" onClick={() => setOpen(!open)} aria-expanded={open}>
              {open ? "ĐÓNG SÁCH" : "MỞ SÁCH"} <span>✦</span>
            </button>
            <button
              className="icon-button"
              aria-label="Lời chúc tiếp theo"
              disabled={
                !open || loading || (page >= wishes.length - 1 && !hasMore)
              }
              onClick={nextPage}
            >
              <ArrowRight size={15} />
            </button>
          </div>
          <p className="book-hint">
            {open
              ? `${wishes.length ? `Trang ${page + 1} · ` : ""}${total} lời chúc được lưu giữ`
              : "Mở bìa sách để đọc những lời chúc"}
          </p>
          <button
            className="button outline refresh-wishes"
            onClick={() => load()}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle size={12} className="spin" />
            ) : (
              <RefreshCw size={12} />
            )}{" "}
            {loading ? "Đang tải lời chúc…" : "Cập nhật lời chúc"}
          </button>
          {loadError && (
            <p className="feedback error" role="alert">
              {loadError}
            </p>
          )}
        </div>
      )}
      <form className="wish-form" onSubmit={submit}>
        <span className="eyebrow">MỘT LỜI NHẮN, MỘT KỶ NIỆM</span>
        <h2>Để lại lời thương</h2>
        <p>Một ngày để nhớ. Một lời chúc để mang theo trên chặng đường mới.</p>
        <div className="wish-note">
          <BookOpen size={17} />
          <span>
            Một lời nhắn nhỏ, một kỷ niệm thật lâu. Cảm ơn bạn đã cùng mình lưu
            giữ ngày đặc biệt này.
          </span>
        </div>
        <label htmlFor="guest-name">Tên của bạn</label>
        <input
          id="guest-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess(false);
          }}
          placeholder="Để mình biết ai gửi yêu thương…"
          autoComplete="name"
          required
          maxLength={60}
          disabled={sending}
        />
        <label htmlFor="guest-message">Lời chúc của bạn</label>
        <textarea
          id="guest-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSuccess(false);
          }}
          placeholder="Chúc mừng bạn tốt nghiệp! Chúc bạn…"
          required
          maxLength={600}
          rows={4}
          aria-describedby="message-count"
          disabled={sending}
        />
        <span id="message-count" className="character-count">
          {message.length}/600 ký tự · Mỗi lần gửi là một trang
        </span>
        <button
          className="button gold send-button"
          type="submit"
          disabled={sending || loading}
        >
          {sending ? (
            <LoaderCircle size={14} className="spin" />
          ) : (
            <Send size={13} />
          )}
          {sending ? "ĐANG LƯU LỜI CHÚC…" : "GỬI LỜI CHÚC VÀO SÁCH"}{" "}
          <ArrowRight size={13} />
        </button>
        <p className="privacy-note">
          Tên và lời chúc sẽ hiển thị công khai trong sổ lưu bút.
          Vui lòng không chia sẻ thông tin riêng tư.
        </p>
        {submitError && (
          <p className="feedback error" role="alert">
            {submitError}
          </p>
        )}
        {success && (
          <div className="wish-success-box">
            <p className="feedback success" role="status">
              <Check size={14} /> Đã lưu lời chúc vào sách. Cảm ơn bạn rất nhiều!
            </p>
            {!showBook && (
              <button
                type="button"
                className="button outline small open-submitted-btn"
                onClick={() => {
                  setShowBook(true);
                  setOpen(true);
                }}
              >
                <BookOpen size={13} /> Mở xem trong sổ lưu bút
              </button>
            )}
          </div>
        )}

        <div className="form-diary-toggle">
          {!showBook ? (
            <button
              type="button"
              className="button outline small diary-toggle-btn"
              onClick={() => {
                setShowBook(true);
                setOpen(true);
              }}
              title="Mở sổ lưu bút để xem những lời chúc đã gửi"
            >
              <BookOpen size={14} />
              {total > 0
                ? `Mở sổ lưu bút (${total} lời chúc đã gửi)`
                : "Mở xem sổ lưu bút"}
            </button>
          ) : (
            <button
              type="button"
              className="button outline small diary-toggle-btn"
              onClick={() => setShowBook(false)}
            >
              Thu gọn sổ lưu bút (Chỉ hiện form)
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
