"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, FileText, Film, LoaderCircle, Plus, RefreshCw, Search, ShieldCheck, UploadCloud, Users, X } from "lucide-react";

type Section = "users" | "books" | "notes" | "videos" | "links" | "exams" | "academic" | "audit";
type Row = { id: string; title: string; type: string; scope: string; status: string; date: string; detail?: string };
type ApiItem = { id?: string; name?: string; title?: string; action?: string; type?: string; entityType?: string; scope?: string; status?: string; createdAt?: string; email?: string; description?: string; gradeSubject?: { grade?: { name?: string }; track?: { name?: string } }; enrollments?: Array<{ grade: { name: string }; track: { name: string } }>; roles?: Array<{ role?: { name?: string } }>; actor?: { name?: string } };

const demoRows: Record<Section, Row[]> = {
  users: [{ id: "u1", title: "أحمد محمد", type: "طالب", scope: "الفرقة الثانية · انتظام", status: "نشط", date: "اليوم", detail: "ahmed@example.com" }, { id: "u2", title: "سارة علي", type: "طالب", scope: "الفرقة الأولى · كريديت", status: "نشط", date: "أمس", detail: "sara@example.com" }],
  books: [{ id: "b1", title: "كتاب مبادئ المحاسبة المالية", type: "كتاب", scope: "الفرقة الثانية · انتظام", status: "منشور", date: "منذ ساعتين" }, { id: "b2", title: "مدخل إلى إدارة الأعمال", type: "كتاب", scope: "الفرقة الثانية · جميع الشعب", status: "مسودة", date: "أمس" }],
  notes: [{ id: "n1", title: "ملخص المحاسبة — الوحدة الثالثة", type: "مذكرة", scope: "الفرقة الثانية · انتظام", status: "منشور", date: "أمس" }],
  videos: [{ id: "v1", title: "شرح قائمة الدخل والمركز المالي", type: "فيديو", scope: "الفرقة الثانية · انتظام", status: "جاهز", date: "منذ ٣ أيام" }],
  links: [{ id: "l1", title: "موقع جامعة الزقازيق", type: "رابط", scope: "عام", status: "نشط", date: "منذ أسبوع" }],
  exams: [{ id: "e1", title: "اختبار مبادئ المحاسبة المالية", type: "اختبار", scope: "الفرقة الثانية · انتظام", status: "منشور", date: "منذ يومين" }],
  academic: [{ id: "a1", title: "المحاسبة المالية", type: "مادة", scope: "الفرقة الثانية · انتظام", status: "نشطة", date: "هذا العام" }],
  audit: [{ id: "a1", title: "USER_ROLES_UPDATED", type: "User", scope: "بواسطة مدير المنصة", status: "مسجل", date: "منذ 15 دقيقة" }, { id: "a2", title: "BOOK_PUBLISHED", type: "Book", scope: "بواسطة مدير المنصة", status: "مسجل", date: "منذ ساعتين" }],
};

const endpointMap: Record<Section, string> = { users: "/api/v1/admin/users?pageSize=50", books: "/api/v1/admin/books?pageSize=50", notes: "/api/v1/admin/notes", videos: "/api/v1/admin/videos", links: "/api/v1/admin/links", exams: "/api/v1/admin/exams", academic: "/api/v1/admin/grade-subjects", audit: "/api/v1/admin/audit-logs?pageSize=50" };

function iconFor(section: Section) {
  if (section === "users") return <Users size={18} />;
  if (section === "books") return <BookOpen size={18} />;
  if (section === "notes") return <FileText size={18} />;
  if (section === "videos") return <Film size={18} />;
  if (section === "audit") return <ShieldCheck size={18} />;
  return <Clock3 size={18} />;
}

function normalizeRows(section: Section, data: ApiItem[]): Row[] {
  return data.map((item) => ({ id: item.id ?? crypto.randomUUID(), title: item.name ?? item.title ?? item.action ?? "بدون عنوان", type: section === "users" ? item.roles?.[0]?.role?.name ?? "طالب" : item.type ?? item.entityType ?? section, scope: item.enrollments?.[0] ? `${item.enrollments[0].grade.name} · ${item.enrollments[0].track.name}` : item.gradeSubject ? `${item.gradeSubject.grade?.name ?? ""} · ${item.gradeSubject.track?.name ?? "جميع الشعب"}` : item.scope ?? item.actor?.name ?? "عام", status: item.status ?? "نشط", date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("ar-EG") : "الآن", detail: item.email ?? item.description }));
}

function uploadWithProgress(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("UPLOAD_FAILED"));
    xhr.onerror = () => reject(new Error("UPLOAD_FAILED"));
    xhr.send(file);
  });
}

export function AdminWorkspace({ section }: { section: Section }) {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [rows, setRows] = useState<Row[]>(demoRows[section]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [kind, setKind] = useState<"book" | "note" | "video">(section === "notes" ? "note" : section === "videos" ? "video" : "book");
  const [title, setTitle] = useState("");
  const [gradeSubjectId, setGradeSubjectId] = useState(demoMode ? "demo-grade-subject" : "");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setNotice("");
    if (demoMode) { setRows(demoRows[section]); setLoading(false); return; }
    try { const response = await fetch(endpointMap[section], { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message ?? "تعذر تحميل البيانات."); setRows(normalizeRows(section, payload.data ?? [])); } catch (error) { setNotice(error instanceof Error ? error.message : "تعذر تحميل البيانات."); } finally { setLoading(false); }
  }

  // The workspace synchronizes its table with the selected admin section.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => rows.filter((row) => `${row.title} ${row.scope} ${row.detail ?? ""}`.includes(query)), [rows, query]);
  const canUpload = section === "books" || section === "notes" || section === "videos";

  async function uploadContent(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim() || !gradeSubjectId.trim()) { setNotice("اكتب عنوان المحتوى والفرقة/المادة واختر ملفًا."); return; }
    setUploading(true); setProgress(0); setNotice("");
    try {
      if (demoMode) { await new Promise((resolve) => setTimeout(resolve, 550)); setProgress(100); setRows((current) => [{ id: crypto.randomUUID(), title, type: kind === "book" ? "كتاب" : kind === "note" ? "مذكرة" : "فيديو", scope: "الفرقة الثانية · انتظام", status: "مسودة", date: "الآن" }, ...current]); setNotice("تمت محاكاة الرفع بنجاح في وضع المعاينة."); return; }
      if (kind === "video") {
        const session = await fetch("/api/v1/admin/videos/upload-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maxDurationSeconds: 7200 }) });
        const sessionPayload = await session.json(); if (!session.ok) throw new Error(sessionPayload.error?.message ?? "تعذر إنشاء جلسة الفيديو.");
        await uploadWithProgress(sessionPayload.data.uploadUrl, file, setProgress);
        const created = await fetch("/api/v1/admin/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, gradeSubjectId, providerVideoId: sessionPayload.data.providerVideoId }) });
        if (!created.ok) throw new Error("تم رفع الفيديو لكن تعذر حفظ بياناته.");
      } else {
        const presign = await fetch("/api/v1/admin/files/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, fileName: file.name, mimeType: file.type, sizeBytes: file.size }) });
        const presignPayload = await presign.json(); if (!presign.ok) throw new Error(presignPayload.error?.message ?? "تعذر تجهيز رفع الملف.");
        await uploadWithProgress(presignPayload.data.uploadUrl, file, setProgress);
        const complete = await fetch("/api/v1/admin/files/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, objectKey: presignPayload.data.objectKey, originalName: file.name, safeName: file.name.replace(/[^a-zA-Z0-9._-]/g, "-"), mimeType: file.type, sizeBytes: file.size }) });
        const completePayload = await complete.json(); if (!complete.ok) throw new Error(completePayload.error?.message ?? "تعذر تسجيل الملف.");
        const endpoint = kind === "book" ? "/api/v1/admin/books" : "/api/v1/admin/notes";
        const created = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, gradeSubjectId, fileAssetId: completePayload.data.id, status: "DRAFT" }) });
        if (!created.ok) throw new Error("تم رفع الملف لكن تعذر حفظ المحتوى.");
      }
      setNotice("تم رفع المحتوى بنجاح."); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "تعذر رفع المحتوى."); } finally { setUploading(false); }
  }

  return <section className="admin-workspace"><div className="workspace-toolbar"><div className="workspace-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في السجلات..." /></div><div className="workspace-actions"><button className="filter-button" onClick={load}><RefreshCw size={15} className={loading ? "spin" : ""} /> تحديث</button>{canUpload && <button className="button button--dark button--small" onClick={() => { setModalOpen(true); setNotice(""); }}><Plus size={15} /> إضافة محتوى</button>}</div></div>{notice && <div className="workspace-notice"><CheckCircle2 size={16} /> {notice}</div>}<div className="admin-panel workspace-panel"><div className="workspace-title"><div className="workspace-title__icon">{iconFor(section)}</div><div><span className="section-kicker">إدارة البيانات</span><h2>{section === "users" ? "المستخدمون" : section === "books" ? "الكتب" : section === "notes" ? "المذكرات" : section === "videos" ? "فيديوهات الشرح" : section === "links" ? "الروابط المهمة" : section === "exams" ? "الاختبارات" : section === "academic" ? "الفرق والشعب والمواد" : "سجل النشاط"}</h2></div><span className="workspace-count">{filtered.length} سجل</span></div><div className="content-table"><div className="table-row table-head"><span>الاسم / العملية</span><span>النطاق</span><span>الحالة</span><span>التاريخ</span></div>{filtered.map((row) => <div className="table-row" key={row.id}><span className="table-title"><i className={`resource-type resource-type--${section === "videos" ? "blue" : section === "notes" ? "gold" : "green"}`}>{iconFor(section)}</i><b>{row.title}</b><small>{row.detail ?? row.type}</small></span><span>{row.scope}</span><span className="published"><CheckCircle2 size={14} /> {row.status}</span><span>{row.date}</span></div>)}{!filtered.length && <div className="workspace-empty">لا توجد بيانات مطابقة للبحث.</div>}</div></div>{modalOpen && <div className="upload-modal-backdrop"><div className="upload-modal"><div className="modal-head"><div><span className="section-kicker">إضافة محتوى جديد</span><h2>رفع ملف للطلاب</h2></div><button className="sidebar-close" onClick={() => setModalOpen(false)} aria-label="إغلاق"><X size={20} /></button></div><form className="upload-form" onSubmit={uploadContent}><div className="upload-kind"><button type="button" className={kind === "book" ? "active" : ""} onClick={() => setKind("book")}><BookOpen size={17} /> كتاب</button><button type="button" className={kind === "note" ? "active" : ""} onClick={() => setKind("note")}><FileText size={17} /> مذكرة</button><button type="button" className={kind === "video" ? "active" : ""} onClick={() => setKind("video")}><Film size={17} /> فيديو</button></div><label className="field"><span>عنوان المحتوى</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: مبادئ المحاسبة المالية" /></label><label className="field"><span>معرف الفرقة والمادة</span><input value={gradeSubjectId} onChange={(event) => setGradeSubjectId(event.target.value)} placeholder="يتم اختياره من المواد في النسخة القادمة" /></label><label className="upload-drop"><UploadCloud size={25} /><strong>{fileName || "اختر الملف من جهازك"}</strong><small>PDF للمذكرات والكتب، أو فيديو للمحتوى المرئي</small><input ref={fileRef} onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} type="file" accept={kind === "video" ? "video/*" : kind === "book" || kind === "note" ? "application/pdf" : "*/*"} /></label>{uploading && <div className="upload-progress"><div><span>جارٍ الرفع والمعالجة</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i></div>}<div className="dialog-actions"><button type="button" className="button button--ghost" onClick={() => setModalOpen(false)}>إلغاء</button><button type="submit" className="button button--primary" disabled={uploading}>{uploading ? <LoaderCircle size={16} className="spin" /> : <UploadCloud size={16} />} {uploading ? "جارٍ الرفع..." : "رفع المحتوى"}</button></div></form></div></div>}</section>;
}
