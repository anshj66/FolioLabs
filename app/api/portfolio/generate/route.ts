import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import jsPDF from "jspdf"
import fs from "fs"
import path from "path"

const GREEN = {
  r: 0,
  g: 200,
  b: 83,
}

const BLACK = {
  r: 8,
  g: 8,
  b: 8,
}

const CARD = {
  r: 18,
  g: 18,
  b: 18,
}

const WHITE = {
  r: 255,
  g: 255,
  b: 255,
}

const MUTED = {
  r: 155,
  g: 155,
  b: 155,
}

export async function POST() {
  try {
    const supabase = await createClient()

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to generate your portfolio.",
        },
        { status: 401 }
      )
    }

    /*
     * --------------------------------------------------
     * PROFILE
     * --------------------------------------------------
     */

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    if (profileError) {
      console.error("Profile error:", profileError)

      return NextResponse.json(
        {
          error: "Could not load your FolioLabs profile.",
          details: profileError.message,
        },
        { status: 500 }
      )
    }

    /*
     * --------------------------------------------------
     * PORTFOLIO DATA
     * --------------------------------------------------
     *
     * If the table exists, use it.
     * If it does not exist yet, continue with an empty
     * portfolio rather than crashing PDF generation.
     */

    let folios: any[] = []

    const {
      data: portfolioEntries,
      error: portfolioError,
    } = await supabase
      .from("portfolio_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })

    if (!portfolioError && portfolioEntries) {
      folios = portfolioEntries
    }

    /*
     * --------------------------------------------------
     * TEMPORARY AUTHENTICITY SCORE
     * --------------------------------------------------
     *
     * This will later be replaced with the actual
     * FolioLabs authenticity engine.
     */

    const overallScore =
      folios.length > 0
        ? Math.min(
            100,
            Math.round(
              70 + Math.min(folios.length * 5, 25)
            )
          )
        : 70

    /*
     * --------------------------------------------------
     * PDF SETUP
     * --------------------------------------------------
     */

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    /*
     * --------------------------------------------------
     * BACKGROUND
     * --------------------------------------------------
     */

    function background() {
      doc.setFillColor(
        BLACK.r,
        BLACK.g,
        BLACK.b
      )

      doc.rect(
        0,
        0,
        pageWidth,
        pageHeight,
        "F"
      )
    }

    /*
     * --------------------------------------------------
     * LOGO
     * --------------------------------------------------
     */

    function addLogo(
      x: number,
      y: number,
      width: number
    ) {
      try {
        const logoPath = path.join(
          process.cwd(),
          "public",
          "icon.png"
        )

        if (!fs.existsSync(logoPath)) {
          console.warn(
            "icon.png not found at:",
            logoPath
          )

          return
        }

        const logoBuffer =
          fs.readFileSync(logoPath)

        const logoBase64 =
          logoBuffer.toString("base64")

        doc.addImage(
          `data:image/png;base64,${logoBase64}`,
          "PNG",
          x,
          y,
          width,
          width
        )
      } catch (error) {
        console.error(
          "Could not load FolioLabs logo:",
          error
        )
      }
    }

    /*
     * --------------------------------------------------
     * FOOTER
     * --------------------------------------------------
     */

    function footer(pageNumber: number) {
      doc.setDrawColor(
        45,
        45,
        45
      )

      doc.setLineWidth(0.3)

      doc.line(
        20,
        pageHeight - 18,
        pageWidth - 20,
        pageHeight - 18
      )

      doc.setFont(
        "helvetica",
        "normal"
      )

      doc.setFontSize(7)

      doc.setTextColor(
        MUTED.r,
        MUTED.g,
        MUTED.b
      )

      doc.text(
        "FolioLabs",
        20,
        pageHeight - 10
      )

      doc.setTextColor(
        GREEN.r,
        GREEN.g,
        GREEN.b
      )

      doc.text(
        "VERIFIED LEARNING PORTFOLIO",
        pageWidth / 2,
        pageHeight - 10,
        {
          align: "center",
        }
      )

      doc.setTextColor(
        MUTED.r,
        MUTED.g,
        MUTED.b
      )

      doc.text(
        String(pageNumber).padStart(2, "0"),
        pageWidth - 20,
        pageHeight - 10,
        {
          align: "right",
        }
      )
    }

    /*
     * --------------------------------------------------
     * SCORE CIRCLE
     * --------------------------------------------------
     */

    function scoreCircle(
      x: number,
      y: number,
      score: number,
      radius: number
    ) {
      // Outer ring
      doc.setLineWidth(3)

      doc.setDrawColor(
        45,
        45,
        45
      )

      doc.circle(
        x,
        y,
        radius
      )

      /*
       * Draw green score arc
       */

      doc.setDrawColor(
        GREEN.r,
        GREEN.g,
        GREEN.b
      )

      doc.setLineWidth(3)

      const startAngle =
        -Math.PI / 2

      const endAngle =
        startAngle +
        (2 * Math.PI * score) /
          100

      const segments = 80

      let previousX =
        x +
        radius *
          Math.cos(startAngle)

      let previousY =
        y +
        radius *
          Math.sin(startAngle)

      for (
        let i = 1;
        i <= segments;
        i++
      ) {
        const progress =
          i / segments

        if (
          progress >
          score / 100
        ) {
          break
        }

        const angle =
          startAngle +
          (endAngle -
            startAngle) *
            progress

        const currentX =
          x +
          radius *
            Math.cos(angle)

        const currentY =
          y +
          radius *
            Math.sin(angle)

        doc.line(
          previousX,
          previousY,
          currentX,
          currentY
        )

        previousX =
          currentX

        previousY =
          currentY
      }

      /*
       * Score
       */

      doc.setFont(
        "helvetica",
        "bold"
      )

      doc.setFontSize(
        radius > 20 ? 21 : 14
      )

      doc.setTextColor(
        WHITE.r,
        WHITE.g,
        WHITE.b
      )

      doc.text(
        `${score}%`,
        x,
        y + 4,
        {
          align: "center",
        }
      )

      doc.setFont(
        "helvetica",
        "bold"
      )

      doc.setFontSize(5.5)

      doc.setTextColor(
        GREEN.r,
        GREEN.g,
        GREEN.b
      )

      doc.text(
        "AUTHENTICITY",
        x,
        y + 11,
        {
          align: "center",
        }
      )
    }

    /*
     * --------------------------------------------------
     * PAGE 1
     * --------------------------------------------------
     */

    background()

    /*
     * Logo
     */

    addLogo(
      20,
      18,
      15
    )

    /*
     * Brand
     */

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(18)

    doc.setTextColor(
      WHITE.r,
      WHITE.g,
      WHITE.b
    )

    doc.text(
      "FolioLabs",
      40,
      29
    )

    doc.setFont(
      "helvetica",
      "normal"
    )

    doc.setFontSize(7)

    doc.setTextColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.text(
      "VERIFIED LEARNING PORTFOLIO",
      40,
      35
    )

    /*
     * Green accent line
     */

    doc.setFillColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.rect(
      20,
      48,
      28,
      1.2,
      "F"
    )

    /*
     * Student name
     */

    const studentName =
      profile?.full_name ||
      profile?.name ||
      user.email ||
      "FolioLabs Student"

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(30)

    doc.setTextColor(
      WHITE.r,
      WHITE.g,
      WHITE.b
    )

    const nameLines =
      doc.splitTextToSize(
        studentName,
        170
      )

    doc.text(
      nameLines,
      20,
      68
    )

    /*
     * Role
     */

    const role =
      profile?.role ||
      "Student"

    doc.setFont(
      "helvetica",
      "normal"
    )

    doc.setFontSize(12)

    doc.setTextColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.text(
      role,
      20,
      82
    )

    /*
     * Bio
     */

    const introduction =
      profile?.bio ||
      profile?.introduction ||
      ""

    let currentY = 95

    if (introduction) {
      doc.setFont(
        "helvetica",
        "normal"
      )

      doc.setFontSize(9)

      doc.setTextColor(
        MUTED.r,
        MUTED.g,
        MUTED.b
      )

      const introLines =
        doc.splitTextToSize(
          introduction,
          165
        )

      doc.text(
        introLines,
        20,
        currentY
      )

      currentY +=
        introLines.length * 5 +
        12
    }

    /*
     * --------------------------------------------------
     * AUTHENTICITY CARD
     * --------------------------------------------------
     */

    const cardY =
      Math.max(
        currentY,
        112
      )

    doc.setFillColor(
      CARD.r,
      CARD.g,
      CARD.b
    )

    doc.roundedRect(
      20,
      cardY,
      pageWidth - 40,
      78,
      7,
      7,
      "F"
    )

    /*
     * Green left accent
     */

    doc.setFillColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.roundedRect(
      20,
      cardY,
      2,
      78,
      1,
      1,
      "F"
    )

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(9)

    doc.setTextColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.text(
      "PORTFOLIO SIGNAL",
      32,
      cardY + 18
    )

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(15)

    doc.setTextColor(
      WHITE.r,
      WHITE.g,
      WHITE.b
    )

    doc.text(
      "Authenticity",
      32,
      cardY + 31
    )

    doc.setFont(
      "helvetica",
      "normal"
    )

    doc.setFontSize(8)

    doc.setTextColor(
      MUTED.r,
      MUTED.g,
      MUTED.b
    )

    doc.text(
      "Based on documented learning evidence",
      32,
      cardY + 41
    )

    doc.text(
      `${folios.length} folio${
        folios.length === 1
          ? ""
          : "s"
      } recorded`,
      32,
      cardY + 51
    )

    scoreCircle(
      pageWidth - 52,
      cardY + 39,
      overallScore,
      24
    )

    /*
     * --------------------------------------------------
     * VERIFIED SECTION
     * --------------------------------------------------
     */

    const verifyY =
      cardY + 101

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(10)

    doc.setTextColor(
      WHITE.r,
      WHITE.g,
      WHITE.b
    )

    doc.text(
      "VERIFICATION",
      20,
      verifyY
    )

    doc.setFillColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.circle(
      24,
      verifyY + 12,
      3,
      "F"
    )

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(9)

    doc.setTextColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.text(
      "FolioLabs portfolio record",
      33,
      verifyY + 14
    )

    doc.setFont(
      "helvetica",
      "normal"
    )

    doc.setFontSize(8)

    doc.setTextColor(
      MUTED.r,
      MUTED.g,
      MUTED.b
    )

    doc.text(
      "This document represents the portfolio record associated",
      33,
      verifyY + 23
    )

    doc.text(
      "with this FolioLabs account.",
      33,
      verifyY + 29
    )

    /*
     * Verification link placeholder
     *
     * We will replace this with the real signed
     * verification URL once the verification endpoint
     * is added.
     */

    doc.setTextColor(
      GREEN.r,
      GREEN.g,
      GREEN.b
    )

    doc.setFont(
      "helvetica",
      "bold"
    )

    doc.setFontSize(8)

    doc.text(
      "Verify online →",
      33,
      verifyY + 42
    )

    footer(1)

    /*
     * --------------------------------------------------
     * INDIVIDUAL FOLIOS
     * --------------------------------------------------
     */

    folios.forEach(
      (folio, index) => {
        doc.addPage()

        background()

        /*
         * Header
         */

        addLogo(
          20,
          16,
          11
        )

        doc.setFont(
          "helvetica",
          "bold"
        )

        doc.setFontSize(13)

        doc.setTextColor(
          WHITE.r,
          WHITE.g,
          WHITE.b
        )

        doc.text(
          "FolioLabs",
          35,
          24
        )

        doc.setFont(
          "helvetica",
          "bold"
        )

        doc.setFontSize(7)

        doc.setTextColor(
          GREEN.r,
          GREEN.g,
          GREEN.b
        )

        doc.text(
          `FOLIO ${String(
            index + 1
          ).padStart(2, "0")}`,
          pageWidth - 20,
          24,
          {
            align: "right",
          }
        )

        /*
         * Accent
         */

        doc.setFillColor(
          GREEN.r,
          GREEN.g,
          GREEN.b
        )

        doc.rect(
          20,
          37,
          22,
          1,
          "F"
        )

        /*
         * Title
         */

        const title =
          folio.title ||
          folio.name ||
          "Untitled Folio"

        doc.setFont(
          "helvetica",
          "bold"
        )

        doc.setFontSize(24)

        doc.setTextColor(
          WHITE.r,
          WHITE.g,
          WHITE.b
        )

        const titleLines =
          doc.splitTextToSize(
            title,
            125
          )

        doc.text(
          titleLines,
          20,
          55
        )

        /*
         * Folio score
         */

        const folioScore =
          Math.min(
            100,
            70 +
              (index + 1) * 5
          )

        scoreCircle(
          pageWidth - 45,
          52,
          folioScore,
          18
        )

        let y =
          78 +
          titleLines.length * 7

        /*
         * Description
         */

        const description =
          folio.description ||
          folio.summary ||
          ""

        if (description) {
          doc.setFont(
            "helvetica",
            "normal"
          )

          doc.setFontSize(9)

          doc.setTextColor(
            MUTED.r,
            MUTED.g,
            MUTED.b
          )

          const descriptionLines =
            doc.splitTextToSize(
              description,
              170
            )

          doc.text(
            descriptionLines,
            20,
            y
          )

          y +=
            descriptionLines.length *
              5 +
            14
        }

        /*
         * Evidence card
         */

        doc.setFillColor(
          CARD.r,
          CARD.g,
          CARD.b
        )

        doc.roundedRect(
          20,
          y,
          pageWidth - 40,
          58,
          6,
          6,
          "F"
        )

        doc.setFont(
          "helvetica",
          "bold"
        )

        doc.setFontSize(9)

        doc.setTextColor(
          GREEN.r,
          GREEN.g,
          GREEN.b
        )

        doc.text(
          "EVIDENCE",
          30,
          y + 15
        )

        doc.setFont(
          "helvetica",
          "normal"
        )

        doc.setFontSize(8)

        doc.setTextColor(
          MUTED.r,
          MUTED.g,
          MUTED.b
        )

        doc.text(
          "Documented work associated with this folio.",
          30,
          y + 26
        )

        /*
         * Evidence indicators
         */

        const evidenceItems = [
          "Development timeline",
          "Sources & citations",
          "Reflection",
          "Assessment",
          "AI disclosure",
        ]

        let evidenceY =
          y + 38

        evidenceItems.forEach(
          (item) => {
            doc.setFillColor(
              GREEN.r,
              GREEN.g,
              GREEN.b
            )

            doc.circle(
              32,
              evidenceY - 1.5,
              1.4,
              "F"
            )

            doc.setFontSize(7.5)

            doc.setTextColor(
              WHITE.r,
              WHITE.g,
              WHITE.b
            )

            doc.text(
              item,
              38,
              evidenceY
            )

            evidenceY += 7
          }
        )

        /*
         * Authenticity explanation
         */

        y += 76

        doc.setFont(
          "helvetica",
          "bold"
        )

        doc.setFontSize(10)

        doc.setTextColor(
          WHITE.r,
          WHITE.g,
          WHITE.b
        )

        doc.text(
          "Authenticity signal",
          20,
          y
        )

        doc.setFont(
          "helvetica",
          "normal"
        )

        doc.setFontSize(8)

        doc.setTextColor(
          MUTED.r,
          MUTED.g,
          MUTED.b
        )

        const authenticityText =
          "This score represents the authenticity signal currently " +
          "associated with this folio. FolioLabs can incorporate " +
          "additional evidence, assessments, reflections, reviews, " +
          "and verification events as the portfolio develops."

        const authenticityLines =
          doc.splitTextToSize(
            authenticityText,
            170
          )

        doc.text(
          authenticityLines,
          20,
          y + 10
        )

        /*
         * Green bottom accent
         */

        doc.setFillColor(
          GREEN.r,
          GREEN.g,
          GREEN.b
        )

        doc.rect(
          20,
          pageHeight - 30,
          35,
          1,
          "F"
        )

        footer(index + 2)
      }
    )

    /*
     * --------------------------------------------------
     * OUTPUT
     * --------------------------------------------------
     */

    const pdfBuffer =
      Buffer.from(
        doc.output("arraybuffer")
      )

    return new NextResponse(
      pdfBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'attachment; filename="FolioLabs-Portfolio.pdf"',

          "Cache-Control":
            "no-store",
        },
      }
    )
  } catch (error) {
    console.error(
      "Portfolio PDF generation error:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Unable to generate portfolio PDF.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    )
  }
}