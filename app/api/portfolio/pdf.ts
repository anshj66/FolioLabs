import jsPDF from "jspdf"

export type PortfolioPdfData = {
  name: string
  role: string
  introduction?: string
  authenticityScore: number

  folios: {
    id: string
    title: string
    description?: string
    authenticityScore: number
    evidenceCount: number
    verifiedEvidenceCount: number
    skills?: string[]
    verificationStatus?: string
  }[]
}

function drawCircleScore(
  doc: jsPDF,
  x: number,
  y: number,
  score: number,
  radius: number
) {
  doc.setLineWidth(8)
  doc.setDrawColor(225, 225, 225)

  doc.circle(x, y, radius)

  doc.setDrawColor(40, 40, 40)

  const circumference = 2 * Math.PI * radius
  const progress = circumference * (score / 100)

  doc.setLineWidth(8)

  // Draw approximate score arc
  doc.setLineDashPattern([], 0)

  const startAngle = -Math.PI / 2
  const endAngle =
    startAngle + (2 * Math.PI * score) / 100

  const segments = 80

  let previousX =
    x + radius * Math.cos(startAngle)

  let previousY =
    y + radius * Math.sin(startAngle)

  for (let i = 1; i <= segments * (score / 100); i++) {
    const angle =
      startAngle +
      ((endAngle - startAngle) * i) /
        (segments * (score / 100))

    const currentX =
      x + radius * Math.cos(angle)

    const currentY =
      y + radius * Math.sin(angle)

    doc.line(
      previousX,
      previousY,
      currentX,
      currentY
    )

    previousX = currentX
    previousY = currentY
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(30)

  doc.text(
    `${score}%`,
    x,
    y + 7,
    {
      align: "center",
    }
  )

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  doc.text(
    "AUTHENTICITY",
    x,
    y + 20,
    {
      align: "center",
    }
  )
}

function addFooter(
  doc: jsPDF,
  pageNumber: number
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(230, 230, 230)

  doc.line(
    20,
    pageHeight - 18,
    pageWidth - 20,
    pageHeight - 18
  )

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)

  doc.text(
    "FolioLabs · Verified Learning Portfolio",
    20,
    pageHeight - 9
  )

  doc.text(
    `Page ${pageNumber}`,
    pageWidth - 20,
    pageHeight - 9,
    {
      align: "right",
    }
  )
}

export async function generatePortfolioPdf(
  data: PortfolioPdfData,
  verificationUrl: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth =
    doc.internal.pageSize.getWidth()

  /*
   * --------------------------------
   * COVER
   * --------------------------------
   */

  // FolioLabs logo mark
  doc.setFillColor(20, 20, 20)
  doc.roundedRect(
    20,
    18,
    12,
    12,
    3,
    3,
    "F"
  )

  doc.setFont("helvetica", "bold")
  doc.setFontSize(17)
  doc.setTextColor(20, 20, 20)

  doc.text(
    "FolioLabs",
    37,
    27
  )

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)

  doc.text(
    "VERIFIED LEARNING PORTFOLIO",
    37,
    32
  )

  // Name
  doc.setTextColor(20, 20, 20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(30)

  doc.text(
    data.name || "Unnamed Student",
    20,
    65
  )

  // Role
  doc.setFont("helvetica", "normal")
  doc.setFontSize(13)
  doc.setTextColor(80, 80, 80)

  doc.text(
    data.role || "Student",
    20,
    75
  )

  // Introduction
  if (data.introduction) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)

    const introLines =
      doc.splitTextToSize(
        data.introduction,
        165
      )

    doc.text(
      introLines,
      20,
      88
    )
  }

  // Score card
  doc.setFillColor(248, 248, 248)

  doc.roundedRect(
    20,
    112,
    pageWidth - 40,
    82,
    8,
    8,
    "F"
  )

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)

  doc.text(
    "Portfolio authenticity",
    35,
    130
  )

  drawCircleScore(
    doc,
    pageWidth - 55,
    153,
    data.authenticityScore,
    25
  )

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)

  doc.text(
    `${data.folios.length} folios included`,
    35,
    143
  )

  doc.text(
    "Calculated from the evidence attached",
    35,
    151
  )

  doc.text(
    "to the student's documented work.",
    35,
    158
  )

  // Verification section
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)

  doc.text(
    "Verify this portfolio",
    20,
    222
  )

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)

  doc.text(
    "Anyone can verify the authenticity record",
    20,
    230
  )

  doc.text(
    "using the secure FolioLabs verification link:",
    20,
    236
  )

  doc.setTextColor(30, 30, 30)

  doc.text(
    verificationUrl,
    20,
    246
  )

  addFooter(doc, 1)

  /*
   * --------------------------------
   * FOLIOS
   * --------------------------------
   */

  data.folios.forEach((folio, index) => {
    doc.addPage()

    const pageNumber = index + 2

    // Folio number
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(110, 110, 110)

    doc.text(
      `FOLIO ${String(index + 1).padStart(2, "0")}`,
      20,
      22
    )

    // Title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(20, 20, 20)

    const titleLines =
      doc.splitTextToSize(
        folio.title,
        120
      )

    doc.text(
      titleLines,
      20,
      38
    )

    // Score
    drawCircleScore(
      doc,
      pageWidth - 45,
      38,
      folio.authenticityScore,
      18
    )

    // Description
    let currentY = 72

    if (folio.description) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(90, 90, 90)

      const descriptionLines =
        doc.splitTextToSize(
          folio.description,
          170
        )

      doc.text(
        descriptionLines,
        20,
        currentY
      )

      currentY +=
        descriptionLines.length * 5 + 12
    }

    // Evidence summary
    doc.setFillColor(248, 248, 248)

    doc.roundedRect(
      20,
      currentY,
      pageWidth - 40,
      34,
      6,
      6,
      "F"
    )

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)

    doc.text(
      "Evidence",
      30,
      currentY + 12
    )

    doc.setFont("helvetica", "normal")
    doc.setTextColor(90, 90, 90)

    doc.text(
      `${folio.evidenceCount} total evidence items`,
      30,
      currentY + 19
    )

    doc.text(
      `${folio.verifiedEvidenceCount} verified`,
      30,
      currentY + 26
    )

    // Verification status
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 30, 30)

    doc.text(
      "Verification",
      105,
      currentY + 12
    )

    doc.setFont("helvetica", "normal")

    doc.text(
      folio.verificationStatus ||
        "Evidence record available",
      105,
      currentY + 19
    )

    // Skills
    currentY += 52

    if (
      folio.skills &&
      folio.skills.length > 0
    ) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)

      doc.text(
        "Skills & areas",
        20,
        currentY
      )

      currentY += 8

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(90, 90, 90)

      const skills =
        folio.skills.join("  ·  ")

      const skillLines =
        doc.splitTextToSize(
          skills,
          170
        )

      doc.text(
        skillLines,
        20,
        currentY
      )
    }

    // Authenticity explanation
    currentY += 32

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(30, 30, 30)

    doc.text(
      "Authenticity signal",
      20,
      currentY
    )

    currentY += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)

    const signalText =
      "This score represents the current FolioLabs evidence record for this folio. " +
      "It is based on documented evidence and verification activity available at the time of generation."

    const signalLines =
      doc.splitTextToSize(
        signalText,
        170
      )

    doc.text(
      signalLines,
      20,
      currentY
    )

    addFooter(doc, pageNumber)
  })

  return doc
}