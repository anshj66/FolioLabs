export const user = {
  name: "Maya Chen",
  email: "maya.chen@foliolabs.io",
  initials: "MC",
  role: "Research Fellow",
}

export const stats = {
  activeProjects: 7,
  authenticityScore: 92,
  fruitsBalance: 4820,
  fruitsThisMonth: 640,
}

export const activeProjects = [
  {
    id: 1,
    name: "Neural Drift Detection",
    category: "Machine Learning",
    progress: 78,
    members: 4,
    due: "Mar 28",
  },
  {
    id: 2,
    name: "Quantum Error Correction",
    category: "Physics",
    progress: 45,
    members: 3,
    due: "Apr 12",
  },
  {
    id: 3,
    name: "Coral Genome Atlas",
    category: "Marine Biology",
    progress: 91,
    members: 6,
    due: "Mar 19",
  },
  {
    id: 4,
    name: "Urban Heat Mapping",
    category: "Climate Science",
    progress: 33,
    members: 2,
    due: "May 02",
  },
]

export const opportunities = [
  {
    id: 1,
    title: "MIT Summer Research Grant",
    org: "MIT Media Lab",
    type: "Grant",
    amount: "$12,000",
    deadline: "5 days left",
    urgent: true,
  },
  {
    id: 2,
    title: "NeurIPS Paper Submission",
    org: "NeurIPS 2026",
    type: "Conference",
    amount: "Publication",
    deadline: "2 weeks left",
    urgent: false,
  },
  {
    id: 3,
    title: "Open Science Fellowship",
    org: "Mozilla Foundation",
    type: "Fellowship",
    amount: "$8,500",
    deadline: "3 weeks left",
    urgent: false,
  },
]

export const activity = [
  {
    id: 1,
    actor: "Liam Park",
    initials: "LP",
    action: "verified your contribution to",
    target: "Coral Genome Atlas",
    time: "12m ago",
  },
  {
    id: 2,
    actor: "System",
    initials: "FL",
    action: "credited you",
    target: "+240 Fruits for milestone completion",
    time: "1h ago",
  },
  {
    id: 3,
    actor: "Dr. Sofia Reyes",
    initials: "SR",
    action: "left feedback on",
    target: "Neural Drift Detection",
    time: "3h ago",
  },
  {
    id: 4,
    actor: "Aiden Wells",
    initials: "AW",
    action: "invited you to",
    target: "Urban Heat Mapping",
    time: "Yesterday",
  },
  {
    id: 5,
    actor: "System",
    initials: "FL",
    action: "raised your authenticity score to",
    target: "92%",
    time: "Yesterday",
  },
]
