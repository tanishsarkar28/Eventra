import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from docx_helpers import (
    set_cell_background, set_cell_margins, set_cell_border,
    add_hyperlink, style_heading, add_callout_box, add_custom_table, add_diagram_image
)

def build_srs_document():
    doc = docx.Document()

    # Set margins to 1.0 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

        # Configure Header & Footer
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.text = "Eventra — Software Requirements Specification (INT252)"
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        for r in p_hdr.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.italic = True
            r.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

        footer = section.footer
        p_ftr = footer.paragraphs[0]
        p_ftr.text = "Continuous Assessment 3 • Autumn 2026 • Course Code: INT252"
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p_ftr.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    # -------------------------------------------------------------
    # PAGE 1: TITLE PAGE (Exact User Template First Page)
    # -------------------------------------------------------------
    p_title_space = doc.add_paragraph()
    p_title_space.paragraph_format.space_before = Pt(40)

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_proj = p_proj.add_run("Project Name: Eventra")
    r_proj.font.name = 'Calibri'
    r_proj.font.size = Pt(28)
    r_proj.font.bold = True
    r_proj.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    p_proj.paragraph_format.space_after = Pt(8)

    p_srs = doc.add_paragraph()
    p_srs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_srs = p_srs.add_run("Software Requirements Specification")
    r_srs.font.name = 'Calibri'
    r_srs.font.size = Pt(18)
    r_srs.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    p_srs.paragraph_format.space_after = Pt(36)

    # Course info box
    p_course = doc.add_paragraph()
    p_course.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_c1 = p_course.add_run("Course Code: INT252\n")
    r_c1.font.bold = True
    r_c2 = p_course.add_run("Course Name: WEB APP DEVELOPMENT WITH REACTJS\n\n")
    r_c2.font.bold = True
    for r in (r_c1, r_c2):
        r.font.name = 'Calibri'
        r.font.size = Pt(13)
        r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_students = doc.add_paragraph()
    p_students.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_s1 = p_students.add_run("Student Names: Tanish, Rishi, Anush\n")
    r_s1.font.bold = True
    r_s2 = p_students.add_run("Student Registration Numbers.: 12407229, 12408074, 12407704\n\n")
    for r in (r_s1, r_s2):
        r.font.name = 'Calibri'
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    p_prep = doc.add_paragraph()
    p_prep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_p1 = p_prep.add_run("Prepared for\n")
    r_p1.font.size = Pt(12)
    r_p2 = p_prep.add_run("Continuous Assessment 3\n")
    r_p2.font.size = Pt(14)
    r_p2.font.bold = True
    r_p3 = p_prep.add_run("Autumn 2026\n")
    r_p3.font.size = Pt(12)
    for r in (r_p1, r_p2, r_p3):
        r.font.name = 'Calibri'
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # PAGE BREAK TO KEEP FIRST PAGE DISTINCT
    doc.add_page_break()

    # -------------------------------------------------------------
    # PAGE 2: TABLE OF CONTENTS & REVISION HISTORY (Exact User Template Second Page)
    # -------------------------------------------------------------
    p_toc_title = doc.add_paragraph()
    r_toc_title = p_toc_title.add_run("Table of Contents")
    r_toc_title.font.name = 'Calibri'
    r_toc_title.font.size = Pt(20)
    r_toc_title.font.bold = True
    r_toc_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    p_toc_title.paragraph_format.space_after = Pt(10)

    toc_items = [
        ("Revision History", "ii", 0),
        ("1. Introduction", "1", 0),
        ("1.1 Purpose", "1", 1),
        ("1.2 Scope", "1", 1),
        ("1.3 Definitions, Acronyms, and Abbreviations", "1", 1),
        ("1.4 References", "1", 1),
        ("1.5 Overview", "1", 1),
        ("2. General Description", "2", 0),
        ("2.1 Product Perspective", "2", 1),
        ("2.2 Product Functions", "2", 1),
        ("2.3 User Characteristics", "2", 1),
        ("2.4 General Constraints", "2", 1),
        ("2.5 Assumptions and Dependencies", "2", 1),
        ("3. Specific Requirements", "2", 0),
        ("3.1 External Interface Requirements", "3", 1),
        ("3.1.1 User Interfaces", "3", 2),
        ("3.1.2 Hardware Interfaces", "3", 2),
        ("3.1.3 Software Interfaces", "3", 2),
        ("3.1.4 Communications Interfaces", "3", 2),
        ("3.2 Functional Requirements", "3", 1),
        ("3.2.1 Module 1: Authentication, RBAC & Profile Management", "3", 2),
        ("3.2.2 Module 2: Event Lifecycle Management & Approval Workflow", "4", 2),
        ("3.2.3 Module 3: Campus Venue Administration & Facility Scheduling", "5", 2),
        ("3.2.4 Module 4: Multi-Dimensional Clash Detection & Alternative Engine", "6", 2),
        ("3.2.5 Module 5: Student Event Discovery & Recommendation Engine", "7", 2),
        ("3.2.6 Module 6: Registration, Waitlist Auto-Promotion & QR Ticket Attendance", "8", 2),
        ("3.2.7 Module 7: Event-Driven Multi-Channel Notifications & Reminders", "9", 2),
        ("3.2.8 Module 8: Personal Calendar, Timetable Clash Prevention & .ics Export", "10", 2),
        ("3.2.9 Module 9: Admin Command Center, Moderation, Audit & Analytics", "11", 2),
        ("3.5 Non-Functional Requirements", "12", 1),
        ("3.5.1 Performance", "12", 2),
        ("3.5.2 Reliability", "12", 2),
        ("3.5.3 Availability", "12", 2),
        ("3.5.4 Security", "12", 2),
        ("3.5.5 Maintainability", "13", 2),
        ("3.5.6 Portability", "13", 2),
        ("3.7 Design Constraints", "13", 1),
        ("3.9 Other Requirements", "13", 1),
        ("4. Analysis Models", "14", 0),
        ("4.1 Data Flow Diagrams (DFD)", "14", 1),
        ("4.1.1 Level 0: Context Data Flow Diagram", "14", 2),
        ("4.1.2 Level 1: System Subsystems Data Flow Diagram", "15", 2),
        ("4.1.3 Level 2: Registration, Waitlist Auto-Promotion & QR Check-in DFD", "16", 2),
        ("4.1.4 Level 2: Venue Booking & Clash Validation Engine DFD", "17", 2),
        ("4.2 Entity-Relationship / Domain Data Model", "18", 1),
        ("5. Github link", "19", 0),
        ("6. DEPLOYED LINK", "19", 0),
    ]

    for title, pg, level in toc_items:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.space_before = Pt(1)
        p_item.paragraph_format.space_after = Pt(1.5)
        indent = "    " * level
        r_title = p_item.add_run(f"{indent}{title} ")
        r_title.font.name = 'Calibri'
        r_title.font.size = Pt(9.5 if level > 0 else 10)
        if level == 0:
            r_title.font.bold = True
            r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        else:
            r_title.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

        # Dots leader
        dots_count = max(5, 75 - len(indent) * 4 - len(title))
        r_dots = p_item.add_run("." * dots_count + " ")
        r_dots.font.name = 'Calibri'
        r_dots.font.size = Pt(8.5)
        r_dots.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

        r_pg = p_item.add_run(pg)
        r_pg.font.name = 'Calibri'
        r_pg.font.size = Pt(9.5)
        r_pg.font.bold = (level == 0)
        r_pg.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) if level == 0 else RGBColor(0x33, 0x41, 0x55)

    p_rev_hdr = doc.add_paragraph()
    p_rev_hdr.paragraph_format.space_before = Pt(14)
    r_rev = p_rev_hdr.add_run("Revision History")
    r_rev.font.name = 'Calibri'
    r_rev.font.size = Pt(13)
    r_rev.font.bold = True
    r_rev.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    rev_headers = ["Version", "Date", "Primary Authors", "Description of Changes"]
    rev_data = [
        ["v0.1.0", "2026-10-22", "Tanish (12407229)", "Initial baseline: IEEE SRS setup, Module 1 (Auth & RBAC) and Module 4 (Clash Detection)."],
        ["v0.2.0", "2026-10-28", "Rishi (12408074)", "Specification of Module 2 (Event Management), Module 5 (Discovery Feed), and Module 8 (Calendar)."],
        ["v0.3.0", "2026-11-05", "Anush (12407704)", "Specification of Module 3 (Venues & Blackouts), Module 6 (QR Tickets & Waitlist), and Module 9 (Admin)."],
        ["v0.4.0", "2026-11-18", "Tanish, Rishi, Anush", "Integration of DFD Level 0, Level 1, Level 2 models, ERD, and measurable non-functional metrics."],
        ["v1.0.0", "2026-11-24", "Tanish, Rishi, Anush", "Final validated SRS for Continuous Assessment 3 matching production deployment on Render."]
    ]
    add_custom_table(doc, rev_headers, rev_data, col_widths=[0.8, 1.0, 1.6, 3.1])

    # PAGE BREAK TO KEEP SECOND PAGE DISTINCT
    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 1: INTRODUCTION
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    r = p.add_run("1. Introduction")
    style_heading(p, 18, RGBColor(0x1E, 0x3A, 0x8A), 12, 6)

    p_intro = doc.add_paragraph(
        "The introduction to this Software Requirement Specification (SRS) document provides a comprehensive overview of Eventra — "
        "Campus Event Management System. This document articulates the complete set of functional, non-functional, interface, and behavioral "
        "requirements necessary for a software engineer to adequately design, implement, test, and verify the software product in accordance "
        "with IEEE Std 830-1998 guidelines."
    )
    p_intro.paragraph_format.space_after = Pt(6)

    # 1.1 Purpose
    p = doc.add_paragraph()
    r = p.add_run("1.1 Purpose")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "The purpose of this SRS document is to establish a rigorous, unambiguous specification of the Eventra web application, developed "
        "using React 18 and Next.js 14 (App Router). The document serves the following intended audiences:\n"
        "1. Academic Evaluators & Course Instructors (INT252): To evaluate architectural maturity, topic integration (React 18 & Next.js 14 App Router), "
        "engineering practices, and syllabus mastery for Continuous Assessment 3.\n"
        "2. Software Developers & Maintainers: To serve as the definitive blueprint for API contracts, database entity schemas, validation algorithms, "
        "and component hierarchies.\n"
        "3. Quality Assurance Engineers: To provide a verifiable baseline for executing automated test suites, edge-case validations, and user acceptance criteria.\n"
        "4. End Users (Campus Administrators, Club Organisers, and Students): To outline operational capabilities, permissions, and workflows."
    )

    # 1.2 Scope
    p = doc.add_paragraph()
    r = p.add_run("1.2 Scope")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "Software Product Name: Eventra — Campus Event Management System\n\n"
        "Eventra is an integrated campus-wide web application designed to centralize, streamline, and modernize how extracurricular and academic events "
        "are organized, scheduled, discovered, and attended within a university ecosystem."
    )

    add_callout_box(
        doc,
        "Relevant Benefits, Objectives & Goals:\n"
        "• Elimination of Scheduling Clashes: Enforces real-time interval overlap detection with sub-50ms latency across venues, organiser availability, "
        "audience demographics, and college blackout dates.\n"
        "• High Attendance Conversion: Drives event participation via an algorithmic 'Relevant to Me' relevance match score (0–100%) and automated FIFO "
        "waitlist promotion upon ticket cancellation.\n"
        "• Gatekeeper Fraud Prevention: Eliminates duplicate admissions through single-use Base64 QR code ticket issuance and instant scanner verification.\n"
        "• Student Schedule Harmony: Prevents academic conflict by integrating student recurring class timetables directly into the event booking engine.",
        title="Core Engineering Objectives"
    )

    doc.add_paragraph(
        "What the Software Product WILL Do:\n"
        "• Authenticate users across three distinct roles (Student, Organiser, Administrator) using salted bcrypt passwords and JWT session cookies.\n"
        "• Manage complete event lifecycles (Draft, Pending Approval, Published, Cancelled) with poster image uploads.\n"
        "• Administer campus venues, seating limits, equipment inventories, operational hours, and exam/maintenance blackout dates.\n"
        "• Detect and prevent scheduling collisions across 5 clash categories, offering automatic alternative open slots and venues.\n"
        "• Deliver personalized student discovery feeds with multi-criteria filtering and personal watchlist bookmarking.\n"
        "• Allocate seats, queue overflow attendees to an automated FIFO waitlist, generate digital Base64 QR tickets, and record gate check-ins.\n"
        "• Transmit multi-channel notifications (In-App, simulated Email Outbox, Push Outbox) and trigger 24-hour and 1-hour pre-event reminders.\n"
        "• Manage recurring class timetables, compute daily free-time slots, and export standards-compliant RFC 5545 .ics calendar files.\n"
        "• Provide administrators with proposal review queues, clash overrides with mandatory justification, student report investigations, "
        "immutable audit logs, and quantitative campus analytics.\n\n"
        "What the Software Product WILL NOT Do (Out of Scope):\n"
        "• Eventra does not handle external monetary banking transactions or real payment gateways; fees are modeled as descriptive metadata.\n"
        "• Eventra does not send external paid SMS or third-party email transmissions; communications are simulated locally to avoid cloud billing."
    )

    # 1.3 Definitions, Acronyms, and Abbreviations
    p = doc.add_paragraph()
    r = p.add_run("1.3 Definitions, Acronyms, and Abbreviations")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    def_headers = ["Term / Acronym", "Full Expansion", "Operational Definition in Eventra"]
    def_data = [
        ["SRS", "Software Requirements Specification", "Formal IEEE Std 830-1998 document specifying system requirements."],
        ["RBAC", "Role-Based Access Control", "Security mechanism restricting features based on role (Student, Organiser, Admin)."],
        ["JWT", "JSON Web Token", "Cryptographically signed compact token stored in httpOnly cookies for session state."],
        ["DFD", "Data Flow Diagram", "Visual model illustrating the flow of data across processes, entities, and stores."],
        ["FIFO", "First-In, First-Out", "Queue discipline used in waitlists where the earliest student is promoted first."],
        ["RFC 5545", "iCalendar Standard", "Internet protocol defining the standard format for calendar data exchange (.ics)."],
        ["QR Code", "Quick Response Code", "2D matrix barcode storing ticket codes for camera-based gate check-in."],
        ["SSR", "Server-Side Rendering", "Rendering React components on the Next.js server prior to sending HTML to client."],
        ["CSR", "Client-Side Rendering", "Browser-side dynamic rendering enabling React hooks (useState, useEffect)."],
        ["CRUD", "Create, Read, Update, Delete", "The four fundamental operations of persistent database storage."],
        ["KPI", "Key Performance Indicator", "Quantifiable administrative metrics (venue utilization %, attendance conversion %)."]
    ]
    add_custom_table(doc, def_headers, def_data, col_widths=[1.2, 1.8, 3.5])

    # 1.4 References
    p = doc.add_paragraph()
    r = p.add_run("1.4 References")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "1. IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications, IEEE Computer Society, 1998.\n"
        "2. Next.js 14 App Router Official Documentation, Vercel Inc., 2024. [https://nextjs.org/docs]\n"
        "3. React 18 Official Documentation, Meta Platforms Inc., 2024. [https://react.dev/]\n"
        "4. RFC 5545: Internet Calendaring and Scheduling Core Object Specification (iCalendar), IETF, 2009.\n"
        "5. Tailwind CSS Documentation, Tailwind Labs, 2024. [https://tailwindcss.com/docs]\n"
        "6. University Course Curriculum: INT252 Web App Development with ReactJS, Department of Computer Science & Engineering, 2026."
    )

    # 1.5 Overview
    p = doc.add_paragraph()
    r = p.add_run("1.5 Overview")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "The remainder of this SRS document is organized into the following chapters:\n"
        "• Section 2 (General Description): Explores product perspective, user personas, operational constraints, and domain assumptions.\n"
        "• Section 3 (Specific Requirements): Details external interfaces, exhaustive functional requirements for Modules 1 through 9, "
        "measurable non-functional requirements (performance, reliability, security), and design constraints.\n"
        "• Section 4 (Analysis Models): Presents visual systems modeling including Level 0 Context DFD, Level 1 Subsystem DFD, "
        "Level 2 Process DFDs, and Entity-Relationship domain data schemas.\n"
        "• Section 5 & 6 (Repository & Deployment Links): Provides the official GitHub repository link and production Render deployment URL."
    )

    # -------------------------------------------------------------
    # SECTION 2: GENERAL DESCRIPTION
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    r = p.add_run("2. General Description")
    style_heading(p, 18, RGBColor(0x1E, 0x3A, 0x8A), 14, 6)

    p = doc.add_paragraph()
    r = p.add_run("2.1 Product Perspective")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "Eventra is an autonomous, cloud-hosted campus web application engineered to operate within university network boundaries. "
        "It acts as a centralized command and discovery portal, replacing physical notice boards, paper rosters, and informal chat groups. "
        "The system runs on the Render cloud platform with a lightweight Node.js container environment, using atomic JSON file storage in data/ "
        "for zero-overhead academic evaluation and high fault tolerance."
    )

    p = doc.add_paragraph()
    r = p.add_run("2.2 Product Functions")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "Eventra encompasses 9 tightly integrated functional subsystems:\n"
        "1. Authentication & RBAC: Multi-role authentication with password hashing, JWT sessions, and profile customizations.\n"
        "2. Event Lifecycle Management: Event authoring, poster upload processing, club scoping, draft saving, proposal submissions, and soft cancellations.\n"
        "3. Venue Administration & Scheduling: Facility cataloging, operating windows, equipment inventories, date blackouts, and reservation approval.\n"
        "4. Multi-Dimensional Clash Detection: Algorithmic collision detection evaluating venue overlaps, capacity limits, club double-booking, audience overlaps, and blackouts.\n"
        "5. Student Event Discovery: Personalized discovery feed with interest-based 'Relevant to Me' scoring (0–100%) and watchlist bookmarking.\n"
        "6. Registration, Waitlist & Gate Attendance: Real-time seat allocation, FIFO waitlist queueing, cancellation auto-promotion, Base64 QR tickets, and gate check-in scanning.\n"
        "7. Multi-Channel Notifications: Event-driven communications (In-App, simulated Email Outbox, Push Outbox) and automated 24h & 1h pre-event reminders.\n"
        "8. Personal Calendar & Timetable Integration: Recurring class timetable management, personal schedule clash prevention, free-slot finder, and RFC 5545 .ics export.\n"
        "9. Admin Command Center & Analytics: Proposal reviews, administrative clash overrides, student report investigations, immutable audit logs, and campus analytics."
    )

    p = doc.add_paragraph()
    r = p.add_run("2.3 User Characteristics")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "• Students: Campus learners possessing general web browsing literacy. They require rapid event discovery, mobile-friendly registration, "
        "conflict protection against classes, and digital ticket passes.\n"
        "• Club Organisers: Society leaders and committee heads. They require comprehensive event authoring tools, venue availability checkers, "
        "live attendee tables, webcam QR scanners, and downloadable CSV rosters.\n"
        "• Administrators: University faculty and facility directors. They require high-level governance, venue blackout controls, proposal approval queues, "
        "clash override authorities, report resolution tools, audit log inspections, and campus analytics."
    )

    p = doc.add_paragraph()
    r = p.add_run("2.4 General Constraints")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "• Language & Framework: Written strictly in plain JavaScript (.js files, zero TypeScript compilation overhead) within React 18 and Next.js 14 App Router.\n"
        "• Storage Mechanism: Atomic JSON file persistence (lib/db.js) eliminating external SQL/NoSQL daemon dependencies.\n"
        "• Hosting Environment: Deployed on Render's container service within 512 MB memory boundaries."
    )

    p = doc.add_paragraph()
    r = p.add_run("2.5 Assumptions and Dependencies")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "• Host environment provides Node.js runtime version 18.17.0+ or 20.x.\n"
        "• Gatekeeper devices possess functioning camera hardware and browser permissions for html5-qrcode barcode scanning.\n"
        "• Operating system grants read and write file permissions to the data/ and public/uploads/ directories."
    )

    # -------------------------------------------------------------
    # SECTION 3: SPECIFIC REQUIREMENTS
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    r = p.add_run("3. Specific Requirements")
    style_heading(p, 18, RGBColor(0x1E, 0x3A, 0x8A), 14, 6)

    doc.add_paragraph(
        "This section details the complete technical specifications for Eventra, including external interfaces, functional specifications "
        "for all 9 project modules, non-functional measurable constraints, and design limitations."
    )

    # 3.1 External Interface Requirements
    p = doc.add_paragraph()
    r = p.add_run("3.1 External Interface Requirements")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    p = doc.add_paragraph()
    r = p.add_run("3.1.1 User Interfaces")
    style_heading(p, 12, RGBColor(0x1F, 0x29, 0x37), 8, 2)
    doc.add_paragraph(
        "• Responsive Shell (components/Navbar.js): Responsive pill-shaped navigation with role-aware links, live unread notification badge, and profile shortcuts.\n"
        "• Discovery Feed (app/discover/page.js): Keyword search, category pills, Free/Paid toggle, date picker, and event cards displaying 'Relevant to Me' badges.\n"
        "• Event Studio (app/events/create/page.js): Multi-input form with live poster image preview, dynamic <datalist> venue picker, and real-time clash alerts.\n"
        "• Gatekeeper Console (app/events/[id]/attendees/page.js): Integrated webcam QR scanner viewfinder, manual ticket code input, audio-visual feedback, and CSV export.\n"
        "• Personal Calendar (app/calendar/page.js): Weekly agenda (Mon–Sun) mapping lectures, bookmarked events, and registered events, with free-slot gap finder.\n"
        "• Admin Command Center (app/admin/page.js): Tabbed dashboard with KPI summary cards, pending proposal queue with clash pills, blackout controls, reports, and analytics."
    )

    p = doc.add_paragraph()
    r = p.add_run("3.1.2 Hardware Interfaces")
    style_heading(p, 12, RGBColor(0x1F, 0x29, 0x37), 8, 2)
    doc.add_paragraph(
        "• Camera Hardware: Standard smartphone and laptop webcams accessed via MediaDevices API and html5-qrcode for 2D barcode recognition at venue doors.\n"
        "• Display Resolutions: Fully responsive across mobile viewports (360x640), tablets (768x1024), and desktop displays (1920x1080 and above)."
    )

    p = doc.add_paragraph()
    r = p.add_run("3.1.3 Software Interfaces")
    style_heading(p, 12, RGBColor(0x1F, 0x29, 0x37), 8, 2)
    doc.add_paragraph(
        "• Operating System: Platform agnostic (Windows, macOS, Linux Ubuntu on Render).\n"
        "• Cryptography & Token Engines: bcryptjs (10 salt rounds) and jsonwebtoken (JWT HMAC-SHA256).\n"
        "• Barcode Libraries: qrcode (Base64 PNG generation) and html5-qrcode (client-side scanner).\n"
        "• Calendar Standard: RFC 5545 iCalendar specification generator creating .ics streams compatible with Google Calendar, Apple iCal, and Outlook."
    )

    p = doc.add_paragraph()
    r = p.add_run("3.1.4 Communications Interfaces")
    style_heading(p, 12, RGBColor(0x1F, 0x29, 0x37), 8, 2)
    doc.add_paragraph(
        "• Protocol: HTTPS / TLS 1.3 encryption on port 443 in production.\n"
        "• Payload Format: application/json for all RESTful API Route Handlers.\n"
        "• Session Storage: httpOnly, secure (production), sameSite: 'lax' cookie storage named 'token'.\n"
        "• File Upload Protocol: multipart/form-data for event poster uploads to public/uploads/."
    )

    # 3.2 Functional Requirements (Modules 1 to 9)
    p = doc.add_paragraph()
    r = p.add_run("3.2 Functional Requirements")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    modules_spec = [
        ("3.2.1 Module 1: User Authentication, RBAC & Profile Management",
         "Module 1 governs identity, security, role-based access control, and user profile metadata across three distinct user roles: Student, Organiser, and Administrator.",
         "name, email, password, role ('student' | 'organiser'), branch, year, interests, clubName (for organisers), login credentials.",
         "1. Validates fields and verifies email uniqueness in data/users.json.\n2. Hashes password using bcryptjs (salt rounds = 10).\n3. Issues JWT in httpOnly cookie on login.\n4. Middleware inspects tokens on protected routes, enforcing RBAC (HTTP 401/403).\n5. Admins verify pending organiser accounts.",
         "HTTP 201 Created on registration; HTTP 200 OK on login with set-cookie header; user profile payload (passwords excluded).",
         "Duplicate email returns HTTP 400 Bad Request; invalid credentials return HTTP 401 Unauthorized; malformed token returns HTTP 401."),

        ("3.2.2 Module 2: Event Lifecycle Management & Approval Workflow",
         "Module 2 enables verified club organisers to author, customize, edit, track, and cancel campus events, enforcing strict lifecycle state transitions.",
         "title, description, category, tags, date, startTime, endTime, venue, capacity, registrationDeadline, isPaid, ticketPrice, poster file / URL.",
         "1. Organisers create events in 'Draft' or 'Pending Approval' state.\n2. Direct self-publishing by organisers is blocked (returns HTTP 403).\n3. Modifying date, timing, or venue of a published event resets its status to 'Pending Approval'.\n4. Poster files uploaded to /api/upload are validated and stored in public/uploads/.\n5. Event cancellation marks status as 'Cancelled'.",
         "HTTP 201 Created with unique event ID; organiser event listings (/api/events/mine); updated event object.",
         "Unapproved publishing attempt returns HTTP 403 Forbidden; invalid time ranges (startTime >= endTime) return HTTP 400 Bad Request."),

        ("3.2.3 Module 3: Campus Venue Administration & Facility Scheduling",
         "Module 3 provides administrative facility scheduling across auditoriums, seminar halls, computer labs, and grounds, tracking equipment and blackouts.",
         "name, type, capacity, location, facilities (AC, Projector, Sound System, WiFi), availableDays, availableFrom, availableTo, requiresApproval, date blackouts.",
         "1. Administrators create and edit facility records in data/venues.json.\n2. Availability query computes booked slots and derives open free intervals.\n3. Date blackouts block venues for exams, maintenance, or holidays.\n4. Booking requests on approval-required venues enter 'Pending' state until reviewed.\n5. Event approval syncs a confirmed reservation in data/bookings.json.",
         "HTTP 200 OK with venue directory; calculated availability payload with bookedSlots and availableSlots; HTTP 201 Created on blackouts.",
         "Booking a deactivated venue returns HTTP 400; booking outside operating window returns HTTP 400; overlapping booking returns HTTP 409 Conflict."),

        ("3.2.4 Module 4: Multi-Dimensional Clash Detection & Alternative Suggestion Engine",
         "Module 4 acts as an intelligent traffic controller, proactively catching 5 categories of scheduling collisions using interval overlap math.",
         "venue, date, startTime, endTime, capacity, targetAudience, clubName, excludeEventId.",
         "1. Evaluates the Golden Interval Overlap condition: (start1 < end2) AND (start2 < end1).\n2. Checks 5 clash types: Venue Clash (Critical), Blackout Clash (Critical), Capacity Overflow (High), Organiser Double-Booking (High), Audience Overlap (Medium).\n3. Generates alternative open slots today, alternative facilities with sufficient capacity, and nearby dates.\n4. Administrative override requires an explicit written justification recorded in audit logs.",
         "Structured JSON conflict report with hasClash, clashCount, severity badges, and remedy tips; alternative slots/venues payload.",
         "Missing parameters return HTTP 400 Bad Request; non-admin attempting clash override returns HTTP 403 Forbidden."),

        ("3.2.5 Module 5: Student Event Discovery, Recommendation Engine & Bookmarking",
         "Module 5 empowers students to discover campus events through multi-parameter filters, watchlist bookmarking, and an algorithmic match score.",
         "Search keyword q, category, isPaid (Free/Paid), date, sortBy (relevance, trending, date), eventId (for bookmarking).",
         "1. Filters data/events.json strictly for 'Published' events.\n2. Performs case-insensitive search across title, description, tags, and club name.\n3. Calculates 'Relevant to Me' score (0–100%): Interests match (max 40 pts) + Academic/Branch alignment (max 25 pts) + Time proximity (max 20 pts) + Popularity (max 15 pts).\n4. Toggles bookmarks in data/bookmarks.json.",
         "Array of published event objects annotated with relevanceScore % and isBookmarked status; HTTP 200 on bookmark toggle.",
         "Unauthenticated bookmark attempt returns HTTP 401 Unauthorized; missing event returns HTTP 404 Not Found."),

        ("3.2.6 Module 6: Registration, Waitlist Auto-Promotion & QR Ticket Attendance",
         "Module 6 manages student registrations, capacity boundaries, automated FIFO waitlist promotion, digital Base64 QR tickets, and gate check-in scanning.",
         "eventId, teamSize, teamMembers, answers (roll number, notes), ticketCode (for gate scanner), cancellation request.",
         "1. Runs Module 8 schedule clash check against student's class timetable and existing bookings.\n2. If seats open: creates confirmed registration and generates Base64 QR ticket.\n3. If full: enqueues student in data/waitlist.json at position #N.\n4. When attendee cancels (allowed up to 2h before event), promotes earliest waitlisted student.\n5. Gate scanner marks ticket as 'Used' and prevents duplicate scans.",
         "HTTP 201 Created with confirmed registration and embedded Base64 QR ticket; HTTP 200 with waitlist position; gate check-in success payload; downloadable CSV roster.",
         "Schedule collision returns HTTP 409 Conflict; duplicate ticket scan returns HTTP 400 (*Duplicate Scan*); late cancellation returns HTTP 400."),

        ("3.2.7 Module 7: Event-Driven Multi-Channel Notifications & Scheduled Reminders",
         "Module 7 bridges event state changes and student attention through an asynchronous Event-Driven Architecture supporting In-App, Email, and Push channels.",
         "Business events emitted to Event Bus ('registration:confirmed', 'waitlist:promoted', 'event:updated', 'event:cancelled'); notification preferences; cron triggers.",
         "1. Handlers verify user channel preferences (inApp, email, push) and category toggles.\n2. Dispatches notifications to data/notifications.json, data/email_outbox.json, and data/push_outbox.json.\n3. Computes set intersection between student interests and event tags for new event alerts.\n4. Scheduled reminder engine scans published events and dispatches deduplicated alerts at T-24h and T-1h.",
         "Real-time unread alert count and notifications list; HTTP 200 on marking notifications read; cron execution summary.",
         "Unauthorized user attempting to read someone else's alerts returns HTTP 403 Forbidden; malformed preferences return HTTP 400."),

        ("3.2.8 Module 8: Personal Calendar, Timetable Clash Prevention & RFC 5545 Export",
         "Module 8 harmonizes campus events with student academic life, managing recurring class timetables, preventing lecture clashes, and generating .ics exports.",
         "subject, dayOfWeek, startTime, endTime, room, instructor, bulk JSON/CSV timetable file, date query for free slots.",
         "1. Stores student class schedules in data/timetable.json with 1-click sample engineering presets.\n2. Personal clash engine maps event date to day of week, tests interval overlap against lectures, and blocks conflicting registrations.\n3. Free-slot gap finder merges busy blocks and reports open intervals between 08:00 and 18:00.\n4. Compiles recurring lecture rules (RRULE) and events into an RFC 5545 .ics calendar stream.",
         "Weekly visual agenda aggregating lectures and events; array of free time blocks; downloadable eventra-calendar.ics file.",
         "Invalid time range (startTime >= endTime) returns HTTP 400 Bad Request; malformed timetable import returns HTTP 400."),

        ("3.2.9 Module 9: Admin Command Center, Moderation, Audit Logging & Campus Analytics",
         "Module 9 serves as the executive command center, providing proposal moderation, administrative clash overrides, student report arbitration, and analytics.",
         "Proposal review decision (Approve / Reject), overrideReason, student content report (reason, details), report resolution action.",
         "1. Evaluates pending events against Module 4's clash engine, rendering visual clash status pills.\n2. Rejects proposal approval if a clash exists unless admin provides an explicit override reason.\n3. Rejection rolls event back to 'Draft' and notifies the organiser with administrative feedback.\n4. Investigates student flags (POST /events/:id/report) and resolves or cancels the event.\n5. Immutable audit logger records all sensitive operations in data/audit_logs.json.\n6. Computes weekly event cadence, venue utilization %, attendance conversion %, and clash rates.",
         "Executive KPI summary cards; queryable audit log table; live campus analytics metrics.",
         "Non-admin attempting access returns HTTP 403 Forbidden; overriding clash without written justification returns HTTP 400 Bad Request.")
    ]

    for title, intro, inputs, proc, outputs, err in modules_spec:
        p = doc.add_paragraph()
        r = p.add_run(title)
        style_heading(p, 12, RGBColor(0x1E, 0x3A, 0x8A), 10, 2)

        doc.add_paragraph(f"Introduction: {intro}")
        doc.add_paragraph(f"Inputs: {inputs}")
        doc.add_paragraph(f"Processing:\n{proc}")
        doc.add_paragraph(f"Outputs: {outputs}")
        doc.add_paragraph(f"Error Handling: {err}")

    # 3.5 Non-Functional Requirements
    p = doc.add_paragraph()
    r = p.add_run("3.5 Non-Functional Requirements")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 12, 4)

    nfr_items = [
        ("3.5.1 Performance",
         "• API Latency: 95% of standard REST API requests shall be processed and respond in less than 200 milliseconds under standard load.\n"
         "• Page Render Speed: Initial First Contentful Paint (FCP) of the application shall execute in less than 1.0 second on standard connections.\n"
         "• Clash Detection Speed: Multi-dimensional collision validation across all venues and events shall execute within 50 milliseconds.\n"
         "• QR Ticket Rendering: Server-side Base64 QR code ticket generation shall complete in under 30 milliseconds per ticket."),
        ("3.5.2 Reliability",
         "• Atomic File Persistence: All file mutations in data/ via lib/db.js shall use atomic write patterns (staging to temporary files before renaming) "
         "to guarantee zero JSON corruption during ungraceful server terminations.\n"
         "• Mean Time Between Failures: System MTBF shall exceed 720 hours (30 days) of continuous operation.\n"
         "• Notification Deduplication: Lock mechanisms shall guarantee zero duplicate reminder notifications at the 24h and 1h intervals."),
        ("3.5.3 Availability",
         "• Cloud Operational Uptime: The application shall achieve at least 99.9% uptime hosted on Render cloud infrastructure.\n"
         "• Health Monitoring & Recovery: Automated health checks shall trigger container restarts within 30 seconds of an unhandled crash."),
        ("3.5.4 Security",
         "• Cryptographic Password Storage: User passwords shall be salted and hashed with bcryptjs using 10 work rounds. Plaintext passwords shall never be persisted or logged.\n"
         "• Stateless Session Tokens: Sessions shall be transmitted strictly through httpOnly, sameSite: 'lax' cookies to prevent Cross-Site Scripting (XSS) token theft.\n"
         "• Privilege Enforcement: Server-side route handlers shall rigorously enforce role authorizations, rejecting unauthorized escalation with HTTP 401/403.\n"
         "• Admission Anti-Fraud: Every ticket code is unique; scanning an already used ticket at the gate shall immediately reject admission."),
        ("3.5.5 Maintainability",
         "• Architectural Modularity: Cleanly organized following Next.js 14 App Router standards, separating presentation (app/, components/), "
         "core logic (lib/), and data stores (data/).\n"
         "• Zero-Overhead JavaScript: Written in clean plain JavaScript without complex build tools, enabling easy debugging and evaluation.\n"
         "• Automated Test Coverage: Standalone test scripts (scripts/test-module*.js) provide 100% automated coverage across all 9 modules."),
        ("3.5.6 Portability",
         "• Platform Agnostic Runtime: Server runtime executes identically across Windows, Linux (Ubuntu), and macOS.\n"
         "• Browser Compliance: Client web interface renders flawlessly across Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge.")
    ]

    for title, text in nfr_items:
        p = doc.add_paragraph()
        r = p.add_run(title)
        style_heading(p, 12, RGBColor(0x1F, 0x29, 0x37), 8, 2)
        doc.add_paragraph(text)

    # 3.7 Design Constraints
    p = doc.add_paragraph()
    r = p.add_run("3.7 Design Constraints")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "• Academic Curriculum Alignment: Developed with React 18 and Next.js 14 App Router as mandated by the INT252 university course curriculum.\n"
        "• Zero External Paid Dependencies: All functionality (including QR generation, calendar export, clash detection, and email simulation) "
        "runs self-contained without requiring paid external third-party APIs.\n"
        "• Container Memory Footprint: Optimized to run within Render's free tier memory allocation (512 MB RAM) with fast cold-start performance."
    )

    # 3.9 Other Requirements
    p = doc.add_paragraph()
    r = p.add_run("3.9 Other Requirements")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "• Academic Rubric Compliance: Fully compliant with INT252 Continuous Assessment 3 evaluation standards, including team module distribution, "
        "automated test harnesses, and viva defense documentation.\n"
        "• Data Privacy: Personal student information (emails, branch, year, attendance logs) is protected and restricted from unauthorized roles."
    )

    # -------------------------------------------------------------
    # SECTION 4: ANALYSIS MODELS
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    r = p.add_run("4. Analysis Models")
    style_heading(p, 18, RGBColor(0x1E, 0x3A, 0x8A), 14, 6)

    doc.add_paragraph(
        "This section presents the formal analysis models for Eventra, including Level 0, Level 1, and Level 2 Data Flow Diagrams (DFD) "
        "and an Entity-Relationship (ER) domain model."
    )

    p = doc.add_paragraph()
    r = p.add_run("4.1 Data Flow Diagrams (DFD)")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    # 4.1.1 Level 0 DFD
    p = doc.add_paragraph()
    r = p.add_run("4.1.1 Level 0: Context Data Flow Diagram")
    style_heading(p, 12, RGBColor(0x1E, 0x3A, 0x8A), 8, 2)

    doc.add_paragraph(
        "The Level 0 Context Diagram captures the global boundary of the Eventra platform, external user entities, and high-level data flows."
    )
    add_diagram_image(doc, "diagrams_temp/dfd_level0.png", "DFD Level 0: Global Context Diagram for Eventra", width_in=6.2)

    dfd0_headers = ["External Entity", "Input Data Flows into Eventra", "Output Data Flows from Eventra"]
    dfd0_data = [
        ["Student", "Registration details, login credentials, discovery filters, event booking requests, timetable lecture slots, content violation reports.",
         "Ranked discovery feed, 'Relevant to Me' match %, digital Base64 QR tickets, in-app notifications, lecture clash alerts, .ics calendar stream."],
        ["Club Organiser", "Club registration info, event creation proposals, poster image files, venue reservation requests, gatekeeper QR ticket scans.",
         "Proposal approval alerts, conflict diagnostics & open alternative slots, live attendee table, downloadable CSV roster, gate check-in status."],
        ["Administrator", "Organiser verification approvals, venue catalog specifications, date blackout reservations, proposal approvals/rejections, clash overrides, report resolutions.",
         "Pending proposal queues, clash diagnostic breakdowns, immutable audit log records, campus utilization and analytics metrics."],
        ["External Calendar", "N/A (Subscriber entity)", "RFC 5545 iCalendar (.ics) stream synchronizing campus events with Google Calendar, Apple iCal, and Outlook."]
    ]
    add_custom_table(doc, dfd0_headers, dfd0_data, col_widths=[1.3, 2.6, 2.6])

    # 4.1.2 Level 1 DFD
    p = doc.add_paragraph()
    r = p.add_run("4.1.2 Level 1: System Subsystems Data Flow Diagram")
    style_heading(p, 12, RGBColor(0x1E, 0x3A, 0x8A), 8, 2)

    doc.add_paragraph(
        "The Level 1 DFD decomposes Eventra into its 9 functional subsystems and 10 persistent data stores."
    )
    add_diagram_image(doc, "diagrams_temp/dfd_level1.png", "DFD Level 1: System Subsystems & Data Stores Decomposition", width_in=6.4)

    dfd1_headers = ["Subsystem Process", "Input Source", "Output Destination", "Associated Data Stores"]
    dfd1_data = [
        ["1.0 Auth & RBAC", "Students, Organisers, Admins", "Session Token, User Context", "D1: Users (data/users.json)"],
        ["2.0 Event Lifecycle", "Organisers, Admin Decisions", "Event Details, Proposal State", "D2: Events (data/events.json)"],
        ["3.0 Venue Scheduling", "Administrators, Organiser Requests", "Venue Directory, Slot Availability", "D3: Venues, D4: Bookings"],
        ["4.0 Clash Engine", "Proposed Event Schedules", "Clash Alerts, Alternative Options", "Reads D2: Events, D3: Venues, D4: Bookings"],
        ["5.0 Discovery Feed", "Student Queries & Interests", "Ranked Event Feed, Bookmarks", "Reads D2: Events, D1: Users, D5: Bookmarks"],
        ["6.0 Registration & QR", "Student Booking, Gate Scans", "QR Tickets, Gate Check-In", "D6: Registrations, D7: Tickets & Attendance"],
        ["7.0 Notifications", "Event Bus State Triggers", "In-App Alerts, Outbox Queues", "D8: Notifications, Email & Push Outbox"],
        ["8.0 Personal Calendar", "Student Timetable, Event Dates", "Weekly Agenda, .ics Stream", "D9: Timetable (data/timetable.json)"],
        ["9.0 Admin & Analytics", "Admins, Student Reports", "Audit Logs, Analytics Metrics", "D10: Audit Logs, Reports & Snapshots"]
    ]
    add_custom_table(doc, dfd1_headers, dfd1_data, col_widths=[1.5, 1.6, 1.6, 1.8])

    # 4.1.3 Level 2 Registration DFD
    p = doc.add_paragraph()
    r = p.add_run("4.1.3 Level 2: Registration, Waitlist Auto-Promotion & Gate QR Check-in DFD")
    style_heading(p, 12, RGBColor(0x1E, 0x3A, 0x8A), 8, 2)

    doc.add_paragraph(
        "This Level 2 DFD details the internal registration pipeline: validating Module 8 schedule conflicts, checking room capacity boundaries, "
        "enqueuing to FIFO waitlist, promoting upon attendee cancellation, issuing Base64 QR tickets, and verifying gate scans."
    )
    add_diagram_image(doc, "diagrams_temp/dfd_level2_reg.png", "DFD Level 2: Module 6 Registration & Admission Lifecycle", width_in=6.0)

    # 4.1.4 Level 2 Clash DFD
    p = doc.add_paragraph()
    r = p.add_run("4.1.4 Level 2: Venue Booking & Clash Validation Engine DFD")
    style_heading(p, 12, RGBColor(0x1E, 0x3A, 0x8A), 8, 2)

    doc.add_paragraph(
        "This Level 2 DFD details the algorithmic pipeline of Module 4: executing interval overlap math across published events and bookings, "
        "evaluating the 5 clash categories, providing open slot suggestions, and recording administrative overrides."
    )
    add_diagram_image(doc, "diagrams_temp/dfd_level2_clash.png", "DFD Level 2: Module 4 Multi-Dimensional Clash Validation Engine", width_in=6.0)

    # 4.2 Entity-Relationship Diagram
    p = doc.add_paragraph()
    r = p.add_run("4.2 Entity-Relationship / Domain Data Model")
    style_heading(p, 14, RGBColor(0x25, 0x63, 0xEB), 10, 4)

    doc.add_paragraph(
        "The following Entity-Relationship (ER) model defines the relational semantics, primary keys (PK), foreign keys (FK), and cardinalities "
        "governing Eventra's atomic data stores."
    )
    add_diagram_image(doc, "diagrams_temp/erd_diagram.png", "Entity-Relationship Domain Model for Eventra Campus Platform", width_in=6.4)

    erd_headers = ["Entity Name", "Primary Key", "Foreign Keys", "Key Attributes & Purpose"]
    erd_data = [
        ["USER", "id", "N/A", "name, email, password, role ('student'|'organiser'|'admin'), branch, year, clubName, isVerified."],
        ["EVENT", "id", "organiserId (FK -> USER.id)", "title, description, category, tags, date, startTime, endTime, venue, capacity, status, adminOverride."],
        ["VENUE", "id", "N/A", "name, type, capacity, location, facilities, availableDays, availableFrom, availableTo, requiresApproval, isActive."],
        ["BOOKING", "id", "venueId (FK), eventId (FK)", "type ('booking'|'blackout'), date, startTime, endTime, title, reason, requestedBy, status."],
        ["REGISTRATION", "id", "eventId (FK), userId (FK)", "ticketCode, status ('Confirmed'|'Cancelled'), teamSize, registeredAt, cancelledAt."],
        ["WAITLIST", "id", "eventId (FK), userId (FK)", "position (#1, #2), status ('Waiting'|'Promoted'|'Cancelled'), createdAt."],
        ["TICKET", "id", "registrationId (FK), eventId (FK)", "ticketCode (Unique), qrCode (Base64 PNG), status ('Active'|'Used'|'Cancelled'), issuedAt, usedAt."],
        ["ATTENDANCE", "id", "eventId (FK), ticketCode (FK)", "userId, userName, checkInTime, scannedBy (FK -> USER.id), status ('Checked In')."],
        ["TIMETABLE_SLOT", "id", "userId (FK -> USER.id)", "subject, dayOfWeek, startTime, endTime, room, instructor."],
        ["NOTIFICATION", "id", "userId (FK -> USER.id)", "title, message, type, channels, isRead, readAt, metadata, createdAt."],
        ["AUDIT_LOG", "id", "adminId (FK -> USER.id)", "timestamp, adminName, action, targetType, targetId, details, ipAddress."]
    ]
    add_custom_table(doc, erd_headers, erd_data, col_widths=[1.2, 0.9, 1.6, 2.8])

    # -------------------------------------------------------------
    # SECTION 5: GITHUB LINK
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    r = p.add_run("5. Github link")
    style_heading(p, 18, RGBColor(0x1E, 0x3A, 0x8A), 14, 6)

    p_gh = doc.add_paragraph()
    r_gh1 = p_gh.add_run("The complete open-source codebase, commit history, test automation scripts, and technical documentation are hosted on GitHub at:\n\n")
    r_gh1.font.name = 'Calibri'
    r_gh1.font.size = Pt(11)

    gh_url = "https://github.com/tanishsarkar28/Eventra.git"
    add_hyperlink(p_gh, gh_url, gh_url, color="2563EB", underline=True)
    p_gh.paragraph_format.space_after = Pt(14)

    # -------------------------------------------------------------
    # SECTION 6: DEPLOYED LINK
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    r = p.add_run("6. DEPLOYED LINK")
    style_heading(p, 18, RGBColor(0x1E, 0x3A, 0x8A), 14, 6)

    p_dep = doc.add_paragraph()
    r_dep1 = p_dep.add_run("The live, fully functional cloud production deployment of Eventra is publicly accessible at:\n\n")
    r_dep1.font.name = 'Calibri'
    r_dep1.font.size = Pt(11)

    dep_url = "https://eventra-fchm.onrender.com/"
    add_hyperlink(p_dep, dep_url, dep_url, color="2563EB", underline=True)

    r_dep2 = p_dep.add_run("\n\n(Hosted on Render Cloud Infrastructure, running Next.js 14 App Router on Node.js 20 runtime)")
    r_dep2.font.name = 'Calibri'
    r_dep2.font.size = Pt(9.5)
    r_dep2.font.italic = True
    r_dep2.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Save to file
    out_path = os.path.abspath("Eventra_SRS_INT252.docx")
    doc.save(out_path)
    print(f"Document successfully created at: {out_path}")
    return out_path

if __name__ == '__main__':
    build_srs_document()
