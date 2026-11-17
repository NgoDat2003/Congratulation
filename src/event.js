// CHỈNH THÔNG TIN CỦA BẠN TẠI ĐÂY.
// Ảnh: đặt file vào public/images/, rồi nhập đường dẫn như '/images/chan-dung.jpg'.
// Nhạc: đặt file vào public/audio/, rồi nhập đường dẫn khớp cả tên và đuôi file.
// Thời gian: dùng ngày giờ ISO kèm múi giờ Việt Nam (+07:00).
export const event = {
  name: "Ngô Quốc Đạt",
  phone: "0377574337",
  school: "Trường Đại Học Công Nghiệp TPHCM",
  schoolShort: "IUH",
  degree: "Kỹ sư phần mềm",
  degreeEnglish: "Software Engineer",
  cohort: "2021 – 2026",
  date: "2026-11-25T09:30:00+07:00",
  endDate: "2026-11-25T11:30:00+07:00",
  venue: "",
  address: "Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, Thành phố Hồ Chí Minh",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=12+Nguyễn+Văn+Bảo,+P.+Hạnh+Thông,+Thành+phố+Hồ+Chí+Minh",
  facebookUrl: "https://www.facebook.com/ngo.dat.775/",
  zaloUrl: "https://zalo.me/0377574337",
  portrait: "/images/image.png",
  portraitPosition: "center",
  portraitCaption: "Rất hân hạnh được đón tiếp bạn trong ngày đặc biệt!",
  quote:
    "Một chặng đường khép lại, một hành trình mới mở ra. Cảm ơn vì bạn đã là một phần của thanh xuân ấy.",
  signature: "dream big. work hard. stay kind.",
  musicUrl: "/audio/a-new-chapter.wav",
  autoPlayMs: 12000,
  letterTitle: "Một hành trình, ngàn kỷ niệm",
  letter: [
    "Có những hành trình khi bắt đầu, mình chưa từng nghĩ sẽ có ngày phải nói lời tạm biệt. Và những năm tháng đại học chính là một hành trình như thế.",
    "Từ ngày đầu bỡ ngỡ bước vào giảng đường đến khoảnh khắc khoác lên mình chiếc áo tốt nghiệp, mình đã học được nhiều hơn những bài học trong sách: cách kiên trì, cách trưởng thành và cách trân trọng những người ở bên cạnh.",
    "Cảm ơn gia đình đã luôn là điểm tựa. Cảm ơn thầy cô đã tận tâm dẫn đường. Cảm ơn những người bạn đã cùng mình đi qua những ngày đáng nhớ.",
    "Ngày tốt nghiệp không chỉ đánh dấu một chặng đường đã qua, mà còn là dịp để mình nói lời cảm ơn. Mong rằng bạn sẽ có mặt để cùng mình lưu giữ khoảnh khắc đặc biệt này.",
    "Một chương khép lại, một hành trình mới mở ra. Hẹn gặp bạn trong ngày vui của mình!",
  ],
};

export const eventDate = new Date(event.date);
const eventEnd = new Date(event.endDate);
const format = (options) =>
  eventDate
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        ...options,
      }).format(eventDate)
    : "";
export const dateParts = {
  day: format({ day: "2-digit" }) || "—",
  month: format({ month: "2-digit" }) || "—",
  year: format({ year: "numeric" }) || "—",
  full:
    format({ day: "2-digit", month: "2-digit", year: "numeric" }) ||
    "Ngày sẽ được cập nhật",
  time: `${format({ hour: "2-digit", minute: "2-digit", hour12: false })} – ${new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(eventEnd)}`,
  weekday: format({ weekday: "long" }),
};

function escapeCalendar(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}
function foldCalendar(line) {
  const lines = [];
  let current = "",
    bytes = 0;
  for (const character of line) {
    const length = new TextEncoder().encode(character).length;
    if (bytes + length > 75) {
      lines.push(current);
      current = " ";
      bytes = 1;
    }
    current += character;
    bytes += length;
  }
  lines.push(current);
  return lines.join("\r\n");
}
const calendarDate = (value) =>
  value.toISOString().replace(/[-:]|\.\d{3}/g, "");
export const calendarUrl = eventDate
  ? `data:text/calendar;charset=utf-8,${encodeURIComponent(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Graduation Invitation//VI",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:graduation-${eventDate.getTime()}@invitation.local`,
        `DTSTAMP:${calendarDate(new Date())}`,
        `DTSTART:${calendarDate(eventDate)}`,
        `DTEND:${calendarDate(eventEnd)}`,
        `SUMMARY:${escapeCalendar(`Lễ tốt nghiệp · ${event.name}`)}`,
        `LOCATION:${escapeCalendar([event.venue, event.school, event.address].filter(Boolean).join(", "))}`,
        `DESCRIPTION:${escapeCalendar(`Trân trọng kính mời bạn đến chung vui lễ tốt nghiệp của ${event.name}.\nThời gian: ${dateParts.time}, ngày ${dateParts.full} (giờ Việt Nam).\nChỉ đường: ${event.mapUrl}`)}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT",
        "END:VCALENDAR",
      ]
        .map(foldCalendar)
        .join("\r\n") + "\r\n",
    )}`
  : null;

export const googleCalendarUrl = `https://calendar.google.com/calendar/render?${new URLSearchParams({
  action: "TEMPLATE",
  text: `Lễ tốt nghiệp · ${event.name}`,
  dates: `${calendarDate(eventDate)}/${calendarDate(eventEnd)}`,
  ctz: "Asia/Ho_Chi_Minh",
  location: [event.venue, event.school, event.address].filter(Boolean).join(", "),
  details: `Trân trọng kính mời bạn đến chung vui lễ tốt nghiệp.\n${dateParts.time} · ${dateParts.full} (giờ Việt Nam)\nChỉ đường: ${event.mapUrl}`,
})}`;
