"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Flag, Home, RotateCcw, Send, Trophy } from "lucide-react";

type Choice = { id: string; label: string; text: string };
type Question = { id: string; body: string; choices: Choice[] };

const questions: Question[] = [
  { id: "q1", body: "ما هي عاصمة جمهورية مصر العربية؟", choices: [{ id: "a", label: "A", text: "الإسكندرية" }, { id: "b", label: "B", text: "القاهرة" }, { id: "c", label: "C", text: "الأقصر" }, { id: "d", label: "D", text: "أسوان" }] },
  { id: "q2", body: "أي قائمة توضح أصول المنشأة والتزاماتها وحقوق الملكية؟", choices: [{ id: "a", label: "A", text: "قائمة الدخل" }, { id: "b", label: "B", text: "قائمة التدفقات النقدية" }, { id: "c", label: "C", text: "قائمة المركز المالي" }, { id: "d", label: "D", text: "قائمة التغير في حقوق الملكية" }] },
  { id: "q3", body: "ما الهدف الأساسي من التخطيط داخل المنظمة؟", choices: [{ id: "a", label: "A", text: "تحديد الأهداف والوسائل المناسبة لتحقيقها" }, { id: "b", label: "B", text: "زيادة عدد الموظفين فقط" }, { id: "c", label: "C", text: "تقليل الاجتماعات" }, { id: "d", label: "D", text: "إلغاء الرقابة" }] },
  { id: "q4", body: "عندما ترتفع الكمية المطلوبة مع انخفاض السعر، فهذا يعبر عن؟", choices: [{ id: "a", label: "A", text: "قانون العرض" }, { id: "b", label: "B", text: "قانون الطلب" }, { id: "c", label: "C", text: "التوازن الاقتصادي" }, { id: "d", label: "D", text: "تكلفة الفرصة" }] },
];

const correctAnswers = { q1: "b", q2: "c", q3: "a", q4: "b" };

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function ExamRunner({ examId }: { examId: string }) {
  const storageKey = `commerce-exam-draft-${examId}`;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(15 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { answers?: Record<string, string>; current?: number; seconds?: number };
        // The draft is restored once on the client after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnswers(parsed.answers ?? {});
        setCurrent(Math.min(parsed.current ?? 0, questions.length - 1));
        setSeconds(parsed.seconds ?? 15 * 60);
      } catch { /* ignore invalid draft */ }
    }
    setStarted(true);
  }, [storageKey]);

  useEffect(() => {
    if (!started || submitted) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        window.clearInterval(timer);
        setConfirming(true);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [started, submitted]);

  useEffect(() => {
    if (started && !submitted) window.localStorage.setItem(storageKey, JSON.stringify({ answers, current, seconds }));
  }, [answers, current, seconds, started, submitted, storageKey]);

  const question = questions[current];
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => questions.reduce((sum, item) => sum + (answers[item.id] === correctAnswers[item.id as keyof typeof correctAnswers] ? 1 : 0), 0), [answers]);

  function choose(choiceId: string) {
    if (submitted || seconds <= 0) return;
    setAnswers((value) => ({ ...value, [question.id]: choiceId }));
  }

  function submit() {
    if (!submitted && (confirming || window.confirm("هل أنت متأكد من تسليم الاختبار؟ لن تتمكن من تعديل الإجابات بعد التسليم."))) {
      setSubmitted(true);
      setConfirming(false);
      window.localStorage.removeItem(storageKey);
    }
  }

  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return <main className="exam-page"><div className="exam-result"><div className="result-confetti"><i /><i /><i /><i /><i /></div><div className="result-trophy"><Trophy size={40} /></div><span className="section-kicker">أكملت الاختبار بنجاح</span><h1>أحسنت، أحمد! <span>🎉</span></h1><p>نتيجتك في اختبار مبادئ المحاسبة المالية</p><div className="result-score"><strong>{score}</strong><span>/ {questions.length}</span></div><div className="result-breakdown"><div><CheckCircle2 size={17} /><strong>{score}</strong><span>إجابات صحيحة</span></div><div><Flag size={17} /><strong>{questions.length - score}</strong><span>إجابات تحتاج مراجعة</span></div><div><Trophy size={17} /><strong>{percentage}%</strong><span>النسبة المئوية</span></div></div><div className="result-actions"><Link className="button button--primary" href="/dashboard"><Home size={17} /> العودة للوحة الطالب</Link><button className="button button--ghost" onClick={() => { setSubmitted(false); setAnswers({}); setCurrent(0); setSeconds(15 * 60); }}><RotateCcw size={17} /> مراجعة المحاولة</button></div></div></main>;
  }

  return <main className="exam-page"><header className="exam-topbar"><Link href="/dashboard" className="exam-back"><ArrowRight size={18} /> الخروج للوحة الطالب</Link><div className="exam-topbar__title"><span>اختبار قصير</span><strong>مبادئ المحاسبة المالية</strong></div><div className={`exam-timer ${seconds < 120 ? "exam-timer--urgent" : ""}`}><Clock3 size={18} /><strong>{formatTime(seconds)}</strong></div></header><div className="exam-layout"><aside className="question-map"><div className="question-map__head"><span>خريطة الأسئلة</span><strong>{answeredCount}/{questions.length}</strong></div><div className="question-map__grid">{questions.map((item, index) => <button key={item.id} className={`${index === current ? "current" : ""} ${answers[item.id] ? "answered" : ""}`} onClick={() => setCurrent(index)}>{index + 1}{answers[item.id] && <Check size={11} />}</button>)}</div><div className="question-legend"><span><i className="legend-current" /> الحالي</span><span><i className="legend-answered" /> تمت الإجابة</span></div><div className="exam-security"><CheckCircle2 size={18} /><span>يتم حفظ إجاباتك تلقائيًا أثناء الاختبار.</span></div></aside><section className="exam-question-card"><div className="exam-progress"><span>السؤال {current + 1} من {questions.length}</span><div><i style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div><strong>{Math.round(((current + 1) / questions.length) * 100)}%</strong></div><div className="question-content"><span className="question-number">سؤال {String(current + 1).padStart(2, "0")}</span><h1>{question.body}</h1><p>اختر إجابة واحدة فقط من الاختيارات التالية.</p><div className="choices">{question.choices.map((choice) => <button className={`choice ${answers[question.id] === choice.id ? "selected" : ""}`} key={choice.id} onClick={() => choose(choice.id)}><span className="choice-label">{choice.label}</span><span>{choice.text}</span>{answers[question.id] === choice.id && <CheckCircle2 className="choice-check" size={19} />}</button>)}</div></div><div className="exam-actions"><button className="button button--ghost" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ArrowRight size={17} /> السابق</button>{current < questions.length - 1 ? <button className="button button--primary" onClick={() => setCurrent((value) => value + 1)}>التالي <ArrowLeft size={17} /></button> : <button className="button button--primary" onClick={() => setConfirming(true)}><Send size={16} /> تسليم الاختبار</button>}</div></section></div>{confirming && <div className="exam-dialog-backdrop"><div className="exam-dialog"><div className="dialog-icon"><Send size={23} /></div><h2>تسليم الاختبار؟</h2><p>أجبت عن {answeredCount} من {questions.length} أسئلة. بعد التسليم سيتم احتساب النتيجة على الخادم ولن تتمكن من تعديل الإجابات.</p><div className="dialog-actions"><button className="button button--ghost" onClick={() => setConfirming(false)}>العودة للمراجعة</button><button className="button button--primary" onClick={submit}>تأكيد التسليم <ArrowLeft size={16} /></button></div></div></div>}</main>;
}
