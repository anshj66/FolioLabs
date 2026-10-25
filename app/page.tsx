"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowDown, ArrowRight, Atom, BookOpenCheck, Check, ChevronRight, CircleDot, Compass, FlaskConical, Layers3, Lightbulb, MoveUpRight, Orbit, ShieldCheck, Sparkles, Users, WandSparkles } from "lucide-react"
import { Logo } from "@/components/logo"

const challenges = [
  { tag: "THE RESEARCH QUESTION", title: "What would you test first?", body: "A model predicts that doubling the input always doubles the output. You have one hour and limited data. What is the first experiment you would run?", options: ["Repeat the same test twice", "Test a boundary case", "Accept the prediction"] , answer: 1, why: "A boundary case is a high-information test: it can expose where the rule stops holding, rather than merely repeating the expected result." },
  { tag: "THE DESIGN QUESTION", title: "Which trade-off matters most?", body: "Your prototype is more accurate but twice as slow. What would you want to know before choosing it?", options: ["How often speed changes the outcome", "Whether the demo looks better", "Nothing — accuracy always wins"], answer: 0, why: "Good decisions depend on context. Measure how latency affects the real task and the people using it before choosing a trade-off." },
  { tag: "THE EVIDENCE QUESTION", title: "What makes a claim credible?", body: "Two portfolios show the same final result. Which additional signal would help you understand the work behind it?", options: ["A more polished cover", "A trail of experiments and revisions", "A longer list of skills"], answer: 1, why: "A trail of experiments, decisions, feedback, and revisions makes the process more legible than a claim or polished outcome alone." },
]

const pillars = [
  { icon: FlaskConical, number: "01", title: "Build through projects", text: "Turn questions into experiments, prototypes, and work that moves beyond the classroom." },
  { icon: Layers3, number: "02", title: "Make thinking visible", text: "Capture decisions, iterations, reflections, and the evidence behind each result." },
  { icon: ShieldCheck, number: "03", title: "Show what you know", text: "Bring your work together in a portfolio designed to communicate progress with context." },
]

export default function WelcomePage() {
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const challenge = challenges[challengeIndex]
  const nextChallenge = () => { setChallengeIndex((current) => (current + 1) % challenges.length); setSelected(null) }

  return <main id="top" className="welcome-shell overflow-hidden">
    <div className="welcome-grain" aria-hidden="true" />
    <header className="welcome-nav">
      <Link href="#top" aria-label="FolioLabs home" className="welcome-brand"><Logo /></Link>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        <a href="#approach" className="welcome-nav-link">Our approach</a><a href="#challenge" className="welcome-nav-link">Try a challenge</a><Link href="/competitions" className="welcome-nav-link">Competitions</Link><a href="#community" className="welcome-nav-link">Community</a>
      </nav>
      <div className="flex items-center gap-3"><Link href="/signup" className="welcome-signup">Sign up</Link><a href="#approach" className="welcome-nav-cta">Explore FolioLabs <ArrowRight size={15}/></a></div>
    </header>

    <section className="welcome-hero relative" aria-labelledby="hero-title">
      <div className="hero-orbit orbit-one" aria-hidden="true"/><div className="hero-orbit orbit-two" aria-hidden="true"/><div className="hero-orbit orbit-three" aria-hidden="true"/>
      <div className="hero-glow" aria-hidden="true"/>
      <div className="hero-copy relative z-10">
        <div className="welcome-eyebrow"><span className="eyebrow-dot"/><Sparkles size={14}/> A new way to make learning visible</div>
        <h1 id="hero-title">The work behind<br/>the <span className="hero-gradient-word">breakthrough.</span></h1>
        <p className="hero-description">Ideas are only the beginning. FolioLabs helps students turn questions into projects, make their thinking visible, and build a portfolio of work they can stand behind.</p>
        <div className="hero-actions"><a href="#approach" className="welcome-primary-btn">Discover the approach <ArrowRight size={17}/></a><a href="#challenge" className="welcome-secondary-btn"><CircleDot size={16}/> Try a 60-second challenge</a></div>
        <div className="hero-proof"><div className="proof-avatars"><span>A</span><span>∑</span><span>λ</span></div><p>For curious minds, thoughtful mentors,<br/><strong>and work worth showing.</strong></p></div>
      </div>
      <div className="hero-visual" aria-label="Abstract animated illustration of ideas becoming connected evidence">
        <div className="visual-label label-top"><span className="pulse-dot"/> LIVE THINKING MAP</div>
        <div className="visual-core"><div className="core-ring ring-a"/><div className="core-ring ring-b"/><div className="core-ring ring-c"/><div className="core-center"><Orbit size={44} strokeWidth={1.15}/></div><span className="orbit-node node-a"><Lightbulb size={17}/></span><span className="orbit-node node-b"><Atom size={17}/></span><span className="orbit-node node-c"><BookOpenCheck size={17}/></span><span className="orbit-node node-d"><Check size={17}/></span></div>
        <div className="visual-card card-experiment"><span className="mini-icon mint"><FlaskConical size={15}/></span><div><small>EXPERIMENT 03</small><strong>Hypothesis tested</strong></div><span className="mini-check"><Check size={13}/></span></div>
        <div className="visual-card card-reflection"><span className="mini-icon violet"><WandSparkles size={15}/></span><div><small>REFLECTION</small><strong>One new insight</strong></div></div>
        <div className="visual-card card-evidence"><span className="mini-icon amber"><ShieldCheck size={15}/></span><div><small>PORTFOLIO</small><strong>Evidence connected</strong></div></div>
        <div className="visual-caption">Curiosity → experiments → evidence</div>
      </div>
      <a className="hero-scroll" href="#approach"><span>SCROLL TO EXPLORE</span><ArrowDown size={14}/></a>
    </section>

    <section id="approach" className="approach-section section-wrap">
      <div className="section-kicker">A BETTER WAY TO LEARN</div><div className="approach-heading"><h2>Not just what you made.<br/><span>How you got there.</span></h2><p>Grades and final outcomes tell part of the story. We believe the questions, choices, experiments, and revisions along the way deserve a place in it, too.</p></div>
      <div className="pillar-grid">{pillars.map((item) => <article className="pillar-card" key={item.number}><div className="pillar-top"><span>{item.number}</span><item.icon size={21} strokeWidth={1.5}/></div><h3>{item.title}</h3><p>{item.text}</p><div className="pillar-line"/></article>)}</div>
    </section>

    <section id="challenge" className="challenge-section section-wrap">
      <div className="challenge-intro"><div className="section-kicker"><Sparkles size={13}/> THINK OUT LOUD</div><h2>Curiosity is a<br/><span>muscle. Use it.</span></h2><p>A tiny taste of the kind of thinking we want to celebrate. No grades. No trick questions. Just a chance to explore how you approach a problem.</p><div className="challenge-progress"><span>CHALLENGE {String(challengeIndex + 1).padStart(2,'0')}</span><div>{challenges.map((item, index) => <button key={item.tag} onClick={() => {setChallengeIndex(index);setSelected(null)}} aria-label={`Go to challenge ${index + 1}`} className={index === challengeIndex ? 'progress-active' : ''}/>)}</div><span>03</span></div></div>
      <article className="challenge-card"><div className="challenge-card-head"><span className="challenge-tag"><span/> {challenge.tag}</span><span className="challenge-time">~ 60 SEC</span></div><h3>{challenge.title}</h3><p className="challenge-question">{challenge.body}</p><div className="challenge-options">{challenge.options.map((option, index) => <button key={option} onClick={() => setSelected(index)} className={`challenge-option ${selected === index ? 'option-selected' : ''} ${selected !== null && index === challenge.answer ? 'option-correct' : ''}`}><span className="option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>{selected !== null && index === challenge.answer ? <Check size={17}/> : <ChevronRight size={16}/>}</button>)}</div>{selected !== null && <div className="challenge-feedback"><span className="feedback-icon"><Lightbulb size={16}/></span><div><strong>{selected === challenge.answer ? 'Good thinking.' : 'Here is one way to look at it.'}</strong><p>{challenge.why}</p></div></div>}<div className="challenge-card-foot"><span>THERE IS ALWAYS MORE THAN ONE WAY TO THINK.</span><button onClick={nextChallenge}>Next question <ArrowRight size={15}/></button></div></article>
    </section>

    <section id="community" className="community-section"><div className="community-glow" aria-hidden="true"/><div className="community-inner"><div className="community-symbol"><Users size={25}/><span/><span/><span/></div><div className="section-kicker">BUILT FOR THE IN-BETWEEN</div><h2>Your next idea could<br/>start <span>with a question.</span></h2><p>We’re shaping a space where students can share what they’re learning, get thoughtful feedback, and make progress together. What should we explore next?</p><a href="mailto:ansh.jain@foliolabs.tech?subject=FolioLabs%20community%20idea" className="community-cta">Suggest a community challenge <MoveUpRight size={16}/></a><span className="community-note">Real questions. Real work. Progress you can see.</span></div></section>

    <footer className="welcome-footer">
      <Link href="#top" className="footer-brand"><Logo /></Link>
      <p>Make the work visible.</p>
      <div className="welcome-footer-nav"><a href="#approach">Our approach</a><a href="#challenge">Try a challenge</a><Link href="/competitions">Competitions</Link><Link href="/signup">Sign in</Link></div>
      <div className="welcome-social-links" aria-label="Contact and social links">
        <a href="mailto:ansh.jain@foliolabs.tech">ansh.jain@foliolabs.tech</a>
        <a href="https://www.instagram.com/foliolabs.tech/" target="_blank" rel="noreferrer">Instagram · @foliolabs.tech</a>
        <a href="https://www.linkedin.com/company/foliolabs-ai/" target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
      <span>© {new Date().getFullYear()} FolioLabs</span>
    </footer>
  </main>
}
